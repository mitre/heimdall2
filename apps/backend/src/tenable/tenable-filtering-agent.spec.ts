import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { INestApplication } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import axios from 'axios';
import type { Request } from 'express';
import session from 'express-session';
import { sign } from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { JwtStrategy } from '../authn/jwt.strategy';
import { ConfigService } from '../config/config.service';
import { UsersService } from '../users/users.service';
import {
  createTenableAgents,
  isBlockedAddress,
} from './tenable-filtering-agent';
import { TenableController } from './tenable.controller';
import { TenableService } from './tenable.service';

// heimdall2-86f6.13 — the address filter, the THIRD of three SSRF controls.
//
// heimdall2-86f6.6 validates the NAME. The socket connects to whatever that
// name RESOLVES to at connect time, so an attacker who can point a permitted
// name at an internal address defeats the allowlist without ever violating it.
//
// THE CONTROL RUNS INSIDE THE CONNECTION'S OWN DNS LOOKUP — the community
// pattern (azu/request-filtering-agent), which Node supports via the documented
// `lookup` option on socket.connect. Validating there means the address checked
// IS the address connected to, so there is no window between the check and the
// connection for the answer to change.
//
// THE SEAM NEEDS NO DNS MOCK. `localhost` is a NAME that resolves through the
// ordinary resolver to a loopback address, so it exercises resolve-then-connect
// end to end with no external DNS dependency and no vi.mock. The hit counter on
// the target server is what discriminates: either the socket arrived or it did
// not. A literal `127.0.0.1` host exercises the other branch, where no DNS
// lookup happens at all.

const TEST_JWT_SECRET = 'tenable-filter-spec-jwt-secret';
const TEST_USER = {
  email: 'tenable-filter-spec@example.com',
  id: '1',
  jwtSecret: 'tenable-filter-spec-user-secret',
  role: 'user',
};

// Served by the target if anything ever reaches it.
const LOOT = 'INTERNAL-SERVICE-REACHED';

describe('isBlockedAddress', () => {
  // One assertion per range, because a classifier that happens to catch
  // 127.0.0.1 tells you nothing about whether it catches fe80::/10.
  it.each([
    ['10.0.0.5', 'IPv4 private 10/8'],
    ['172.16.0.5', 'IPv4 private 172.16/12'],
    ['192.168.1.5', 'IPv4 private 192.168/16'],
    ['127.0.0.1', 'IPv4 loopback 127/8'],
    ['169.254.1.1', 'IPv4 link-local 169.254/16'],
    ['169.254.169.254', 'the cloud metadata address'],
    ['::1', 'IPv6 loopback'],
    ['fe80::1', 'IPv6 link-local fe80::/10'],
    ['fc00::1', 'IPv6 unique-local fc00::/7'],
  ])('blocks %s (%s)', (address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it('blocks the IPv4-mapped IPv6 form of a blocked address', () => {
    expect.assertions(2);

    // The half that gets forgotten: a check reasoning only about IPv6 notation
    // lets ::ffff:169.254.169.254 through to the metadata service.
    expect(isBlockedAddress('::ffff:169.254.169.254')).toBe(true);
    expect(isBlockedAddress('::ffff:127.0.0.1')).toBe(true);
  });

  it('allows an ordinary routable address', () => {
    expect.assertions(2);

    // The control must not refuse everything. Without this, a classifier that
    // returns true unconditionally would pass every test above.
    expect(isBlockedAddress('93.184.216.34')).toBe(false);
    expect(isBlockedAddress('2606:2800:220:1:248:1893:25c8:1946')).toBe(false);
  });

  it('refuses a value that is not an IP address at all', () => {
    expect.assertions(1);

    // Fail closed: something that cannot be classified is not proven safe.
    expect(isBlockedAddress('not-an-address')).toBe(true);
  });
});

describe('the filtering agent', () => {
  let hits: number;
  let target: http.Server;
  let targetPort: number;

  beforeAll(async () => {
    hits = 0;
    target = http.createServer((_request, response) => {
      hits += 1;
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end(LOOT);
    });
    await new Promise<void>((resolve) => {
      target.listen(0, '127.0.0.1', () => {
        targetPort = (target.address() as AddressInfo).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      target.close(() => {
        resolve();
      });
    });
  });

  beforeEach(() => {
    hits = 0;
  });

  it('never connects to a NAME that resolves to a loopback address', async () => {
    expect.assertions(2);
    const { httpAgent, httpsAgent } = createTenableAgents({
      allowPrivateAddresses: false,
    });

    // `localhost` is a name, not a literal, so this goes through DNS resolution
    // exactly as an attacker-controlled rebinding host would.
    await expect(
      axios.get(`http://localhost:${String(targetPort)}/`, {
        httpAgent,
        httpsAgent,
      }),
    ).rejects.toThrow();

    // The load-bearing assertion: the socket never arrived.
    expect(hits).toBe(0);
  });

  it('never connects to a literal blocked IP, where no DNS lookup happens', async () => {
    expect.assertions(2);
    const { httpAgent, httpsAgent } = createTenableAgents({
      allowPrivateAddresses: false,
    });

    await expect(
      axios.get(`http://127.0.0.1:${String(targetPort)}/`, {
        httpAgent,
        httpsAgent,
      }),
    ).rejects.toThrow();

    expect(hits).toBe(0);
  });

  it('connects when the operator has opted in to private addresses', async () => {
    expect.assertions(2);
    const { httpAgent, httpsAgent } = createTenableAgents({
      allowPrivateAddresses: true,
    });

    // Proves two things at once: the opt-out works, and the refusals above are
    // caused by the filter rather than by anything else in this harness.
    const response = await axios.get(
      `http://127.0.0.1:${String(targetPort)}/`,
      { httpAgent, httpsAgent },
    );

    expect(response.data).toBe(LOOT);
    expect(hits).toBe(1);
  });
});

describe('the Tenable endpoints refuse a permitted host that resolves into blocked space', () => {
  let app: INestApplication;
  let appUrl: string;
  let hits: number;
  let module: TestingModule;
  let target: http.Server;
  let targetOrigin: string;

  beforeAll(async () => {
    hits = 0;
    target = http.createServer((_request, response) => {
      hits += 1;
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ response: { username: 'looted' } }));
    });
    await new Promise<void>((resolve) => {
      target.listen(0, '127.0.0.1', () => {
        const { port } = target.address() as AddressInfo;
        // A NAME on the allowlist that resolves to loopback — the rebinding
        // shape. The allowlist will say yes; the address filter must say no.
        targetOrigin = `http://localhost:${String(port)}`;
        resolve();
      });
    });

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
            // Configured, therefore allowlisted. This card is about what
            // happens AFTER the name check has already passed.
            getTenableHostUrl: () => targetOrigin,
            isTenablePrivateAddressAllowed: () => false,
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
        secret: 'tenable-filter-spec-session-secret',
      }),
    );
    await app.init();
    await app.listen(0);
    appUrl = `http://127.0.0.1:${String((app.getHttpServer().address() as AddressInfo).port)}`;
  });

  afterAll(async () => {
    await app.close();
    await new Promise<void>((resolve) => {
      target.close(() => {
        resolve();
      });
    });
  });

  beforeEach(() => {
    hits = 0;
  });

  it('refuses the login probe and never reaches the internal service', async () => {
    expect.assertions(3);
    const token = sign(
      { email: TEST_USER.email, role: TEST_USER.role, sub: TEST_USER.id },
      TEST_JWT_SECRET + TEST_USER.jwtSecret,
      { expiresIn: '1h' },
    );

    const response = await fetch(`${appUrl}/api/tenable/login`, {
      body: JSON.stringify({
        accesskey: 'irrelevant',
        host_url: targetOrigin,
        secretkey: 'irrelevant',
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    const body = (await response.json()) as { code?: string };

    // THE VULNERABILITY, demonstrated: today the allowlist passes on the name
    // and the server connects to the loopback service anyway.
    expect(hits).toBe(0);
    expect(body.code).toBe('UPSTREAM_ADDRESS_REFUSED');
    // Distinguishable from HOST_NOT_ALLOWED and UPSTREAM_REDIRECT_REFUSED.
    expect(response.status).toBe(502);
  });

  it('refuses the proxy path too, which builds its own axios instance', async () => {
    expect.assertions(2);
    // Asserted separately from the login probe on purpose: the proxy configures
    // its own axios instance in tenable.service.ts, so filtering one does not
    // filter the other.
    const service = new TenableService({
      isTenablePrivateAddressAllowed: () => false,
    } as unknown as ConfigService);
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
        host_url: targetOrigin,
        secretkey: 'irrelevant',
      }),
    ).rejects.toThrow();

    expect(hits).toBe(0);
  });

  it('does not disclose the resolved address to the caller', async () => {
    expect.assertions(1);
    const token = sign(
      { email: TEST_USER.email, role: TEST_USER.role, sub: TEST_USER.id },
      TEST_JWT_SECRET + TEST_USER.jwtSecret,
      { expiresIn: '1h' },
    );

    const response = await fetch(`${appUrl}/api/tenable/login`, {
      body: JSON.stringify({
        accesskey: 'irrelevant',
        host_url: targetOrigin,
        secretkey: 'irrelevant',
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    const body = await response.text();

    // Reflecting what a name resolved to turns this endpoint into a DNS oracle.
    expect(body).not.toContain('127.0.0.1');
  });
});
