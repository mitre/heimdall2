import { describe, expect, it } from 'vitest';
import {
  buildAllowedOrigins,
  checkTenableHost,
} from './tenable-host-allowlist';

const CONFIGURED = 'https://tenable.example.com';

describe('buildAllowedOrigins', () => {
  it('normalises the configured host to an origin', () => {
    expect.assertions(1);

    expect(buildAllowedOrigins(CONFIGURED, '')).toStrictEqual([
      'https://tenable.example.com',
    ]);
  });

  it('accepts additional hosts separated by commas or whitespace', () => {
    expect.assertions(1);

    expect(
      buildAllowedOrigins(CONFIGURED, 'https://second.example.com https://third.example.com,https://fourth.example.com'),
    ).toStrictEqual([
      'https://tenable.example.com',
      'https://second.example.com',
      'https://third.example.com',
      'https://fourth.example.com',
    ]);
  });

  it('drops an unparseable additional host rather than throwing', () => {
    expect.assertions(1);

    // One malformed extra entry must not take the whole integration offline.
    expect(
      buildAllowedOrigins(CONFIGURED, 'not a url,https://second.example.com'),
    ).toStrictEqual([
      'https://tenable.example.com',
      'https://second.example.com',
    ]);
  });

  it('is empty when nothing is configured', () => {
    expect.assertions(1);

    expect(buildAllowedOrigins('', '')).toStrictEqual([]);
  });

  it('refuses to build an entry from a non-http scheme', () => {
    expect.assertions(2);

    // The protocol restriction has to be asserted HERE, not on the request
    // side: an `ftp://` or `file://` REQUEST is already rejected by the origin
    // comparison, so a request-side test passes with or without the protocol
    // check and proves nothing. Mutation testing caught exactly that — the
    // request-side test below survived deleting this restriction. What the
    // restriction genuinely prevents is a non-http scheme becoming a usable
    // ALLOWLIST ENTRY.
    expect(buildAllowedOrigins('ftp://tenable.example.com', '')).toStrictEqual(
      [],
    );
    expect(buildAllowedOrigins('file:///etc/passwd', '')).toStrictEqual([]);
  });
});

describe('checkTenableHost', () => {
  const allowed = buildAllowedOrigins(CONFIGURED, '');

  it('permits the configured host', () => {
    expect.assertions(1);

    expect(checkTenableHost(CONFIGURED, allowed)).toStrictEqual({
      kind: 'allowed',
      origin: 'https://tenable.example.com',
    });
  });

  it('permits the same host with the default port made explicit', () => {
    expect.assertions(1);

    // AuthStep.vue appends `:443` client-side, so the server receives this form
    // while the operator configured the bare host. They are the same origin.
    expect(
      checkTenableHost('https://tenable.example.com:443/', allowed),
    ).toStrictEqual({ kind: 'allowed', origin: 'https://tenable.example.com' });
  });

  it('rejects a host that merely has the allowed host as a prefix', () => {
    expect.assertions(2);

    const decision = checkTenableHost(
      'https://tenable.example.com.attacker.test',
      allowed,
    );

    // The suffix attack a substring or startsWith comparison would admit.
    expect(decision.kind).toBe('rejected');
    expect(decision).not.toHaveProperty('origin');
  });

  it('rejects a different host entirely', () => {
    expect.assertions(1);

    expect(
      checkTenableHost('http://169.254.169.254/latest/meta-data/', allowed)
        .kind,
    ).toBe('rejected');
  });

  it('rejects a non-http protocol even when the host matches', () => {
    expect.assertions(1);

    expect(
      checkTenableHost('file://tenable.example.com/etc/passwd', allowed).kind,
    ).toBe('rejected');
  });

  it('rejects a value that cannot be parsed as a URL', () => {
    expect.assertions(1);

    expect(checkTenableHost('tenable.example.com', allowed).kind).toBe(
      'rejected',
    );
  });

  it('refuses everything when no host is configured', () => {
    expect.assertions(2);

    const decision = checkTenableHost(CONFIGURED, []);

    // An empty allowlist means refuse, never "allow anything".
    expect(decision.kind).toBe('rejected');
    expect(decision).toStrictEqual({
      kind: 'rejected',
      reason: 'No Tenable host is configured on this server',
    });
  });

  it('does not echo the rejected host back in the reason', () => {
    expect.assertions(1);

    const decision = checkTenableHost('https://attacker.test/probe', allowed);

    // Reflecting the input invites using this endpoint as a probe oracle.
    expect(
      'reason' in decision ? decision.reason : '',
    ).not.toContain('attacker.test');
  });
});
