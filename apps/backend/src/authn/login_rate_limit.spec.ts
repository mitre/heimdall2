import { once } from 'events';
import { createServer } from 'http';
import type { AddressInfo } from 'net';
import express from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestGuard } from '../guards/test.guard';
import { createLoginRateLimiter } from './login_rate_limit';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('E2E test mode', () => {
  it.each([
    { enabled: false, environment: 'production', flag: 'true' },
    { enabled: false, environment: 'production', flag: 'false' },
    { enabled: true, environment: 'test', flag: 'true' },
    { enabled: true, environment: 'development', flag: 'true' },
    { enabled: false, environment: 'test', flag: 'false' },
    { enabled: false, environment: undefined, flag: 'true' },
    { enabled: false, environment: 'test', flag: undefined },
  ])('restricts reset and throttling exemptions for $environment / $flag', async ({ enabled, environment, flag }) => {
    vi.stubEnv('NODE_ENV', environment);
    vi.stubEnv('CYPRESS_TESTING', flag);
    expect(new TestGuard().canActivate()).toBe(enabled);

    const app = express();
    app.use('/authn/login', createLoginRateLimiter());
    app.post('/authn/login', (_request, response) => {
      response.sendStatus(401);
    });
    const server = createServer(app);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const { port } = server.address() as AddressInfo;
    try {
      for (let attempt = 0; attempt < 21; attempt++) {
        const response = await fetch(`http://127.0.0.1:${port}/authn/login`, { method: 'POST' });
        expect(response.status).toBe(enabled || attempt < 20 ? 401 : 429);
        await response.text();
      }
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  });
});
