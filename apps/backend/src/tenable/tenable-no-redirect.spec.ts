import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { INestApplication } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import session from 'express-session';
import { sign } from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { JwtStrategy } from '../authn/jwt.strategy';
import { ConfigService } from '../config/config.service';
import { UsersService } from '../users/users.service';
import { TenableController } from './tenable.controller';
import { TenableService } from './tenable.service';

// heimdall2-86f6.12 — the redirect control, the SECOND of three independent
// SSRF controls on the Tenable proxy.
//
// The name allowlist (heimdall2-86f6.6) governs where a request may be SENT. It
// says nothing about where the RESPONSE may send it next: axios follows
// redirects by default, so an allowlisted host answering
// `302 Location: http://169.254.169.254/...` walks the server straight past the
// allowlist that just approved it. That is the bypass this spec pins.
//
// THE SEAM IS TWO REAL LOCAL SERVERS, not a mock and not an inspection of the
// axios config object. This contract is about what the HTTP client DOES. A test
// asserting that `maxRedirects: 0` appears in a config literal is a FORM check —
// it passes whether or not the behaviour holds, and it would keep passing if the
// option were later overridden, renamed by an axios major, or shadowed by a
// per-request config. Counting hits on the redirect TARGET cannot pass for the
// wrong reason: either the second server was contacted or it was not.

// The body the redirect target serves. If this string ever reaches a caller, the
// redirect was followed and the control has failed.
const LOOT = 'REDIRECT-TARGET-REACHED';

const TEST_JWT_SECRET = 'tenable-redirect-spec-jwt-secret';
const TEST_USER = {
  email: 'tenable-redirect-spec@example.com',
  id: '1',
  jwtSecret: 'tenable-redirect-spec-user-secret',
  role: 'user',
};

function listen(server: http.Server): Promise<string> {
  return new Promise((resolve) => {
    // Port 0 = ephemeral, matching the controller spec, so this never collides
    // with a dev server or with a parallel test file.
    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo;
      resolve(`http://127.0.0.1:${String(address.port)}`);
    });
  });
}

function close(server: http.Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => {
      resolve();
    });
  });
}

describe('outbound Tenable requests do not follow redirects', () => {
  let app: INestApplication;
  let appUrl: string;
  let module: TestingModule;
  let redirector: http.Server;
  let redirectorUrl: string;
  let target: http.Server;
  let targetHits: number;
  let targetUrl: string;

  beforeAll(async () => {
    // The redirect TARGET — stands in for the address an attacker would steer
    // the server toward. It records every request it receives.
    targetHits = 0;
    target = http.createServer((_request, response) => {
      targetHits += 1;
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end(LOOT);
    });
    targetUrl = await listen(target);

    // The allowlisted host. It is permitted by name, and it answers every
    // request with a redirect elsewhere.
    redirector = http.createServer((_request, response) => {
      response.writeHead(302, { Location: `${targetUrl}/looted` });
      response.end();
    });
    redirectorUrl = await listen(redirector);

    module = await Test.createTestingModule({
      controllers: [TenableController],
      imports: [PassportModule],
      providers: [
        TenableService,
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'JWT_SECRET') return TEST_JWT_SECRET;
              return;
            },
            getTenableAdditionalHostUrls: () => '',
            // The redirector is ON the allowlist. That is the point: this card
            // is about the control that still has to hold once the name check
            // has already said yes.
            getTenableHostUrl: () => redirectorUrl,
          },
        },
        {
          provide: UsersService,
          useValue: { findById: () => Promise.resolve(TEST_USER) },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.use(
      session({
        resave: false,
        saveUninitialized: false,
        secret: 'tenable-redirect-spec-session-secret',
      }),
    );
    await app.init();
    await app.listen(0);
    const address = app.getHttpServer().address() as AddressInfo;
    appUrl = `http://127.0.0.1:${String(address.port)}`;
  });

  afterAll(async () => {
    await app.close();
    await close(redirector);
    await close(target);
  });

  beforeEach(() => {
    targetHits = 0;
  });

  it('does not follow a 302 from the login probe', async () => {
    expect.assertions(3);
    const token = sign(
      { email: TEST_USER.email, role: TEST_USER.role, sub: TEST_USER.id },
      TEST_JWT_SECRET + TEST_USER.jwtSecret,
      { expiresIn: '1h' },
    );

    const response = await fetch(`${appUrl}/api/tenable/login`, {
      body: JSON.stringify({
        accesskey: 'irrelevant',
        host_url: redirectorUrl,
        secretkey: 'irrelevant',
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    const body = await response.text();

    // THE LOAD-BEARING ASSERTION. The redirect target was never contacted, so
    // no outbound request left for an address the allowlist never approved.
    expect(targetHits).toBe(0);
    // And its body never reached the caller. Asserting only the hit count would
    // miss a future path that fetches the target through some other route.
    expect(body).not.toContain(LOOT);
    // AC: the refusal is a HANDLED outcome. Not a 500 (an unhandled throw) and
    // not a 302 (which would make our own API answer a redirect it invented).
    expect(response.status).toBe(502);
  });

  it('names the refused redirect rather than reporting a generic proxy error', async () => {
    expect.assertions(1);
    const token = sign(
      { email: TEST_USER.email, role: TEST_USER.role, sub: TEST_USER.id },
      TEST_JWT_SECRET + TEST_USER.jwtSecret,
      { expiresIn: '1h' },
    );

    const response = await fetch(`${appUrl}/api/tenable/login`, {
      body: JSON.stringify({
        accesskey: 'irrelevant',
        host_url: redirectorUrl,
        secretkey: 'irrelevant',
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    const body = (await response.json()) as { code?: string };

    // A distinct code, because "the upstream tried to redirect us and we
    // refused" is operationally different from "the upstream is unreachable".
    expect(body.code).toBe('UPSTREAM_REDIRECT_REFUSED');
  });

  it('does not follow a 302 from the proxy path', async () => {
    expect.assertions(2);
    const service = new TenableService();
    // The proxy builds its own axios instance, entirely separately from the
    // login probe. Fixing one does not fix the other, so this is asserted
    // against the service directly rather than inferred from the test above.
    const request = {
      body: {},
      get: () => 'application/json',
      method: 'GET',
      originalUrl: '/api/tenable/rest/scanResult',
      query: {},
    } as unknown as Request;

    await expect(
      service.proxyRequest(request, {
        accesskey: 'irrelevant',
        host_url: redirectorUrl,
        secretkey: 'irrelevant',
      }),
    ).rejects.toThrow();

    expect(targetHits).toBe(0);
  });
});
