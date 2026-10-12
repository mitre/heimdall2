// The FIRST of three independent controls against server-side request forgery
// on the Tenable proxy. This one governs where a request may be SENT, by name.
//
// It is NOT sufficient alone. A permitted name still resolves to whatever its
// DNS says at request time, and a permitted host can still answer 302 and move
// the request somewhere else. Those are heimdall2-86f6.13 and heimdall2-86f6.12.
//
// Comparison is on WHATWG URL origins rather than raw strings, which OWASP's
// SSRF Prevention Cheat Sheet requires: a substring or prefix comparison admits
// `https://tenable.example.com.attacker.test` against an allowlist containing
// `https://tenable.example.com`. Using `origin` also normalises the two forms
// the server actually receives — AuthStep.vue appends `https://` and `:443`
// client-side, and `origin` drops a default port, lowercases the host, and
// discards any path, so `https://host` and `https://host:443/` compare equal.

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

// Operators supply additional hosts as one delimited string, because
// app-config.ts reads every setting as a single string (see getTenableHostUrl).
const ENTRY_SEPARATOR = /[\s,]+/v;

// Discriminated on a STRING literal rather than a boolean `allowed` flag. This
// repo sets neither `strict` nor `strictNullChecks`, and without them TypeScript
// will not narrow a union through truthiness — `if (!decision.allowed)` compiles
// under vitest (transpile-only) and then fails `nest build` on `decision.reason`.
// A string tag narrows correctly regardless of that setting, and unlike the
// `decision.allowed === false` form it needs no comparison against a boolean
// literal, so nothing here is one "simplification" away from breaking the build.
export type HostDecision =
  | { kind: 'allowed'; origin: string }
  | { kind: 'rejected'; reason: string };

/**
 * Normalise one configured or requested host to its origin.
 * Returns undefined when the value is absent, unparseable, or uses a protocol
 * that is not http/https — all three are "not usable as an allowlist entry".
 */
function toOrigin(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    // Not a parseable absolute URL. Deliberately not "fixed up" by prepending a
    // scheme: guessing what an operator or caller meant is how a validator ends
    // up admitting something neither of them intended.
    return undefined;
  }
  return ALLOWED_PROTOCOLS.has(parsed.protocol) ? parsed.origin : undefined;
}

/**
 * Build the set of permitted origins from the configured Tenable host plus any
 * additional hosts. Unparseable entries are dropped rather than throwing: one
 * malformed extra host must not take the whole integration offline, and the
 * empty-allowlist case is itself a refusal (see checkTenableHost).
 */
export function buildAllowedOrigins(
  configuredHost: string,
  additionalHosts: string,
): string[] {
  const candidates = [configuredHost, ...additionalHosts.split(ENTRY_SEPARATOR)];
  const origins = new Set<string>();
  for (const candidate of candidates) {
    const origin = toOrigin(candidate);
    if (origin !== undefined) {
      origins.add(origin);
    }
  }
  return [...origins];
}

/**
 * Decide whether a requested host may be contacted.
 *
 * Callers MUST act on a rejected decision before any outbound request —
 * rejecting after the request has already been made still performs the forgery
 * and still returns the upstream response to the caller.
 */
export function checkTenableHost(
  requestedHost: string,
  allowedOrigins: readonly string[],
): HostDecision {
  if (allowedOrigins.length === 0) {
    // No configured host means there is nothing legitimate to talk to, so the
    // safe reading is "refuse", never "allow anything".
    return {
      kind: 'rejected',
      reason: 'No Tenable host is configured on this server',
    };
  }
  const origin = toOrigin(requestedHost);
  if (origin === undefined) {
    return {
      kind: 'rejected',
      reason: 'The Tenable host must be a valid http or https URL',
    };
  }
  if (!allowedOrigins.includes(origin)) {
    // The rejected origin is deliberately NOT echoed back: the caller already
    // knows what they sent, and reflecting it invites using this endpoint as a
    // probe oracle.
    return {
      kind: 'rejected',
      reason: 'The requested Tenable host is not permitted by this server',
    };
  }
  return { kind: 'allowed', origin };
}
