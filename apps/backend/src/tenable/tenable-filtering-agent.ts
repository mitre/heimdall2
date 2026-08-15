import { lookup as systemLookup } from 'node:dns';
import type { ClientRequestArgs } from 'node:http';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import type { LookupFunction } from 'node:net';
import { BlockList, isIPv4, isIPv6, Socket } from 'node:net';
import type { Duplex } from 'node:stream';

// The THIRD of three independent controls against server-side request forgery
// on the Tenable proxy. This one governs where a connection may LAND.
//
// heimdall2-86f6.6 validates the destination NAME, and heimdall2-86f6.12 stops
// the response redirecting the request elsewhere. Neither can say anything about
// what a permitted name RESOLVES to: an attacker who can point an allowlisted
// name at an internal address defeats the allowlist without ever violating it.
//
// WHY THE CHECK LIVES IN THE CONNECTION'S OWN LOOKUP, and not in a resolve-then-
// request step before it. Resolving separately and then handing the NAME to the
// HTTP client means the client resolves again when it connects, and the second
// answer can differ from the one that was validated — the DNS rebinding window.
// Node lets a connection supply its own resolver (`lookup` on socket.connect,
// documented as "Custom lookup function. Default: dns.lookup()"), so validating
// inside that callback makes the address that was checked the same address the
// socket uses. This is the pattern azu/request-filtering-agent implements by
// overriding Agent#createConnection, read from its source rather than recalled.
//
// RESIDUAL EXPOSURE, stated precisely rather than as a generic caveat: there is
// no second resolution to disagree with the first, so the classic rebinding
// window is closed for these agents. What remains is that a name may resolve to
// a permitted address on one connection and a blocked one on the next — each
// connection is judged on its own resolution, which is the correct behaviour,
// not a gap. Connection reuse (keep-alive) means a socket validated once stays
// open; that is bounded by the agent's socket lifetime, and is the reason
// `keepAlive` is left at its default rather than being turned on here.

export const ADDRESS_REFUSED_CODE = 'UPSTREAM_ADDRESS_REFUSED';

// Ranges an outbound Tenable connection must never land in. `BlockList` parses
// addresses properly and understands CIDR, so no dotted-quad regex or hand-
// rolled mask arithmetic appears anywhere in this module.
function buildBlockedRanges(): BlockList {
  const blocked = new BlockList();
  blocked.addSubnet('0.0.0.0', 8, 'ipv4'); // "this network", reaches localhost on some stacks
  blocked.addSubnet('10.0.0.0', 8, 'ipv4'); // RFC 1918 private
  blocked.addSubnet('127.0.0.0', 8, 'ipv4'); // loopback
  blocked.addSubnet('169.254.0.0', 16, 'ipv4'); // link-local, contains 169.254.169.254
  blocked.addSubnet('172.16.0.0', 12, 'ipv4'); // RFC 1918 private
  blocked.addSubnet('192.168.0.0', 16, 'ipv4'); // RFC 1918 private
  blocked.addAddress('::1', 'ipv6'); // loopback
  blocked.addSubnet('fc00::', 7, 'ipv6'); // unique-local
  blocked.addSubnet('fe80::', 10, 'ipv6'); // link-local
  return blocked;
}

const BLOCKED = buildBlockedRanges();

/**
 * Classify a single resolved address.
 *
 * Fails CLOSED: a value that cannot be parsed as an address is treated as
 * blocked, because "unclassifiable" is not the same as "proven safe".
 */
export function isBlockedAddress(address: string): boolean {
  if (isIPv4(address)) {
    return BLOCKED.check(address, 'ipv4');
  }
  if (isIPv6(address)) {
    // BlockList maps IPv4-mapped IPv6 (::ffff:a.b.c.d) onto the IPv4 rules
    // above, so the mapped form of a blocked address is blocked too.
    return BLOCKED.check(address, 'ipv6');
  }
  return true;
}

function refusal(): NodeJS.ErrnoException {
  // Deliberately does NOT name the address. It is attacker-influenced, and
  // reflecting it would make this endpoint a DNS oracle — the same reasoning as
  // the allowlist's rejection reasons in tenable-host-allowlist.ts.
  const error: NodeJS.ErrnoException = new Error(
    'The Tenable host resolves to an address this server is not permitted to contact',
  );
  error.code = ADDRESS_REFUSED_CODE;
  return error;
}

/**
 * A `lookup` implementation that resolves normally and then refuses to hand
 * back any address in a blocked range. Callers see a failed connection, never a
 * connection to somewhere they did not intend.
 *
 * Typed as node's own LookupFunction so the shape is the platform's, not ours.
 */
function makeFilteringLookup(allowPrivateAddresses: boolean): LookupFunction {
  return (hostname, options, callback) => {
    systemLookup(hostname, options, (error, address, family) => {
      if (error) {
        callback(error, address, family);
        return;
      }
      if (allowPrivateAddresses) {
        callback(null, address, family);
        return;
      }
      // `all: true` yields an array of entries; the single-address form yields
      // a string. Both shapes must be checked, or one of them is unguarded.
      const candidates = Array.isArray(address)
        ? address.map((entry) => entry.address)
        : [address];
      if (candidates.some((candidate) => isBlockedAddress(candidate))) {
        callback(refusal(), address, family);
        return;
      }
      callback(null, address, family);
    });
  };
}

function erroringSocket(error: NodeJS.ErrnoException): Socket {
  const socket = new Socket();
  // Deferred so the caller can attach its 'error' handler first, which
  // http.ClientRequest does synchronously after createConnection returns. A
  // microtask is late enough for that and is the repo's preferred primitive.
  queueMicrotask(() => {
    socket.destroy(error);
  });
  return socket;
}

function blockedLiteralHost(
  host: string | undefined,
  allowPrivateAddresses: boolean,
): boolean {
  if (allowPrivateAddresses || host === undefined) {
    return false;
  }
  // A host given as a literal address never reaches the resolver, so the
  // `lookup` hook above would never see it. This is the other branch.
  if (!isIPv4(host) && !isIPv6(host)) {
    return false;
  }
  return isBlockedAddress(host);
}

export class TenableFilteringHttpAgent extends HttpAgent {
  constructor(private readonly allowPrivateAddresses: boolean) {
    super();
  }

  createConnection(
    options: ClientRequestArgs,
    callback?: (error: Error | null, stream: Duplex) => void,
  ): Duplex | null | undefined {
    if (blockedLiteralHost(options.host, this.allowPrivateAddresses)) {
      return erroringSocket(refusal());
    }
    return super.createConnection(
      { ...options, lookup: makeFilteringLookup(this.allowPrivateAddresses) },
      callback,
    );
  }
}

export class TenableFilteringHttpsAgent extends HttpsAgent {
  constructor(private readonly allowPrivateAddresses: boolean) {
    super();
  }

  createConnection(
    options: ClientRequestArgs,
    callback?: (error: Error | null, stream: Duplex) => void,
  ): Duplex | null | undefined {
    if (blockedLiteralHost(options.host, this.allowPrivateAddresses)) {
      return erroringSocket(refusal());
    }
    return super.createConnection(
      { ...options, lookup: makeFilteringLookup(this.allowPrivateAddresses) },
      callback,
    );
  }
}

/**
 * Both agents, because axios selects between httpAgent and httpsAgent by the
 * target's protocol — supplying only one silently leaves the other scheme
 * unfiltered.
 */
export function createTenableAgents(options: {
  allowPrivateAddresses: boolean;
}): { httpAgent: HttpAgent; httpsAgent: HttpsAgent } {
  return {
    httpAgent: new TenableFilteringHttpAgent(options.allowPrivateAddresses),
    httpsAgent: new TenableFilteringHttpsAgent(options.allowPrivateAddresses),
  };
}
