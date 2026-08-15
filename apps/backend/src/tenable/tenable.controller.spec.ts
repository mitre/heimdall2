import type { AddressInfo } from 'node:net';
import type { INestApplication } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import session from 'express-session';
import { sign } from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { JwtStrategy } from '../authn/jwt.strategy';
import { ConfigService } from '../config/config.service';
import { UsersService } from '../users/users.service';
import { TenableController } from './tenable.controller';
import { TenableService } from './tenable.service';

// The strategy resolves its signing key as JWT_SECRET + the user's own
// jwtSecret, so both halves are pinned here and the token below is signed with
// the same concatenation. Stubs rather than the real ConfigService/UsersService:
// this spec is about the guard chain, and a stub keeps it off the database
// without weakening what is under test — the REAL JwtAuthGuard and the REAL
// JwtStrategy are both registered.
const TEST_JWT_SECRET = 'tenable-spec-jwt-secret';
const TEST_USER = {
  email: 'tenable-spec@example.com',
  id: '1',
  jwtSecret: 'tenable-spec-user-secret',
  role: 'user',
};

// The handler's own answer when it runs without Tenable credentials in the
// session. Its presence in a response body proves the request reached the
// handler — which is exactly what the guard must prevent.
const HANDLER_SESSION_REJECTION = 'Not authenticated with Tenable';

// The only host this deployment is configured to talk to.
const TEST_TENABLE_HOST = 'https://tenable.example.com';

// The handler's ENOTFOUND branch (tenable.controller.ts). A `.invalid` host is
// reserved by RFC 2606 and never resolves, so this code appears if and only if
// control reached axios and a request was actually attempted. Its ABSENCE is
// the evidence that the allowlist rejected the host first — asserting the
// status alone cannot tell the two rejections apart, because both answer 400.
const HANDLER_DNS_FAILURE = 'INVALID_HOST_URL';

describe('TenableController authentication', () => {
  let app: INestApplication;
  let baseUrl: string;
  let module: TestingModule;

  beforeAll(async () => {
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
              if (key === 'TENABLE_HOST_URL') return TEST_TENABLE_HOST;
              return;
            },
            getTenableAdditionalHostUrls: () => '',
            getTenableHostUrl: () => TEST_TENABLE_HOST,
          },
        },
        {
          provide: UsersService,
          useValue: { findById: () => Promise.resolve(TEST_USER) },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    // Production installs express-session (main.ts) whenever a Tenable host is
    // configured, and the proxy handler reads request.session. Without it the
    // handler throws a TypeError and answers 500, which would make the
    // "did the handler run?" assertion below pass for the wrong reason.
    app.use(
      session({
        resave: false,
        saveUninitialized: false,
        secret: 'tenable-spec-session-secret',
      }),
    );
    await app.init();
    // Port 0 = ephemeral, so this never collides with a dev server.
    await app.listen(0);
    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${String(address.port)}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects POST /api/tenable/login when no Authorization header is sent', async () => {
    expect.assertions(1);

    const response = await fetch(`${baseUrl}/api/tenable/login`, {
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    // Unguarded, this reaches the handler and answers 400 'Missing
    // credentials' — the endpoint accepts an arbitrary host_url from any
    // caller and returns what that host said, which is the defect.
    expect(response.status).toBe(401);
  });

  it('rejects the catch-all proxy at the guard rather than at the handler session check', async () => {
    expect.assertions(2);

    const response = await fetch(`${baseUrl}/api/tenable/scanResult`);
    const body = await response.text();

    expect(response.status).toBe(401);
    // Both the guard and the handler answer 401, so status alone cannot tell
    // them apart. The handler's body names the Tenable session; the guard's
    // does not. Asserting only the status would pass against the bug.
    expect(body).not.toContain(HANDLER_SESSION_REJECTION);
  });

  it('lets an authenticated request through to the handler', async () => {
    expect.assertions(2);
    const token = sign(
      { email: TEST_USER.email, role: TEST_USER.role, sub: TEST_USER.id },
      TEST_JWT_SECRET + TEST_USER.jwtSecret,
      { expiresIn: '1h' },
    );

    const response = await fetch(`${baseUrl}/api/tenable/login`, {
      body: JSON.stringify({}),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    const body = (await response.json()) as { message?: string };

    // 400 from the handler, not 401 from the guard: the guard admitted the
    // request and the feature still works for a signed-in user.
    expect(response.status).toBe(400);
    expect(body.message).toBe('Missing credentials');
  });

  it('rejects a host absent from the allowlist before any request is made', async () => {
    expect.assertions(2);
    const token = sign(
      { email: TEST_USER.email, role: TEST_USER.role, sub: TEST_USER.id },
      TEST_JWT_SECRET + TEST_USER.jwtSecret,
      { expiresIn: '1h' },
    );

    const response = await fetch(`${baseUrl}/api/tenable/login`, {
      body: JSON.stringify({
        accesskey: 'irrelevant',
        host_url: 'https://attacker.invalid',
        secretkey: 'irrelevant',
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    const body = await response.text();

    expect(response.status).toBe(400);
    // The load-bearing assertion. Both the allowlist rejection and the
    // handler's DNS failure answer 400, so the status cannot discriminate. If
    // this string is present the server attempted the outbound request, which
    // is the forgery itself — rejecting AFTER the request would still be a
    // vulnerability.
    expect(body).not.toContain(HANDLER_DNS_FAILURE);
  });
});
