import { ServerResponse } from 'node:http';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { Express, Request, RequestHandler, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from './config/config.service';

const bootstrap = vi.hoisted((): { app: unknown } => ({ app: undefined }));
vi.mock('@nestjs/core', () => ({ NestFactory: { create: () => Promise.resolve(bootstrap.app) } }));
vi.mock('./app.module', () => ({ AppModule: class {} }));
vi.mock('./token/token.providers', () => ({ generateDefault: () => 'test-secret' }));

afterEach(() => vi.restoreAllMocks());

async function bootApp(values: Record<string, string>, tenable: string[] = []) {
  vi.resetModules();
  const config = Object.create(ConfigService.prototype) as ConfigService;
  const environment = new Map(Object.entries(values));
  vi.spyOn(config, 'get').mockImplementation(key => environment.get(key));
  vi.spyOn(config, 'getTenableHostUrl').mockReturnValue(tenable);
  vi.spyOn(config, 'getSplunkHostUrl').mockReturnValue('');
  vi.spyOn(config, 'getDbConfig').mockReturnValue({});
  vi.spyOn(config, 'getSSLConfig').mockReturnValue(false);
  const app = new ExpressAdapter().getInstance<Express>();
  const get = app.get.bind(app);
  Object.assign(app, {
    enableShutdownHooks: (): void => undefined,
    get: (key: unknown) => typeof key === 'string' ? get(key) : config,
    getHttpAdapter: () => ({ getInstance: () => app }),
    useGlobalPipes: (): void => undefined,
  });
  const listen = vi.spyOn(app, 'listen').mockImplementation(() => undefined as never);
  const use = vi.spyOn(app, 'use');
  bootstrap.app = app;
  await import('./main.js');
  await vi.waitFor(() => expect(listen).toHaveBeenCalled());
  const middleware: unknown[][] = use.mock.calls;
  const limiter = middleware.find(arguments_ => arguments_[0] === '/authn/login')![1] as RequestHandler;
  const session = middleware.find(arguments_ => typeof arguments_[0] === 'function' && arguments_[0].name === 'session')?.[0] as RequestHandler | undefined;
  return { app, limiter, session };
}

function login(app: Express, limiter: RequestHandler, peer: string, forwarded: string) {
  return new Promise<number>((resolve, reject) => {
    const clientRequest = request(app, peer, forwarded);
    const response = Object.assign(new ServerResponse(clientRequest), {
      send: (): Response => {
        resolve(response.statusCode);
        return response;
      },
      status: (code: number): Response => {
        response.statusCode = code;
        return response;
      },
    }) as Response;
    void limiter(clientRequest, response, (error?: unknown) => {
      if (error) {
        reject(error instanceof Error ? error : new Error('Login middleware failed'));
      } else {
        resolve(response.statusCode);
      }
    });
  });
}

function request(app: Express, peer: string, forwarded: string) {
  return Object.assign(Object.create(app.request), {
    app,
    headers: { 'x-forwarded-for': forwarded },
    method: 'POST',
    originalUrl: '/authn/login',
    socket: { remoteAddress: peer },
  }) as Request;
}

describe('login proxy configuration', () => {
  it.each(['nginx', 'bundled'])('gives each client behind managed %s its own login limit', async (mode) => {
    const { app, limiter } = await bootApp({ HEIMDALL_PROXY_MODE: mode, NODE_ENV: 'production' });
    for (let attempt = 0; attempt < 20; attempt++) {
      expect(await login(app, limiter, '127.0.0.1', '192.0.2.1')).toBe(200);
    }
    for (let attempt = 0; attempt < 20; attempt++) {
      expect(await login(app, limiter, '127.0.0.1', '192.0.2.2')).toBe(200);
    }
    expect(await login(app, limiter, '127.0.0.1', '192.0.2.1')).toBe(429);
    expect(await login(app, limiter, '127.0.0.1', '192.0.2.2')).toBe(429);
  });

  it('does not let a direct remote client evade its login limit by spoofing forwarding headers', async () => {
    const { app, limiter } = await bootApp({ HEIMDALL_PROXY_MODE: 'nginx', NODE_ENV: 'production' });
    for (let attempt = 0; attempt < 20; attempt++) {
      expect(await login(app, limiter, '198.51.100.1', `192.0.2.${attempt + 1}`)).toBe(200);
    }
    expect(await login(app, limiter, '198.51.100.1', '192.0.2.100')).toBe(429);
    expect(request(app, '198.51.100.1', '192.0.2.100').ip).toBe('198.51.100.1');
  });

  it.each(['127.0.0.1', '::1', '::ffff:127.0.0.1'])('accepts the closest forwarded client through %s with OAuth enabled', async (peer) => {
    const { app } = await bootApp({ HEIMDALL_PROXY_MODE: 'bundled', NODE_ENV: 'production', OIDC_CLIENTID: 'configured' });
    expect(request(app, peer, '203.0.113.99, 192.0.2.1').ip).toBe('192.0.2.1');
    expect(request(app, '198.51.100.1', '203.0.113.99').ip).toBe('198.51.100.1');
  });

  it.each([
    ['127.0.0.1', [expect.stringContaining('; Secure')]],
    ['198.51.100.1', undefined],
  ])('uses bounded proxy trust for secure OAuth session cookies through %s', async (peer, cookie) => {
    const { app, session } = await bootApp({ HEIMDALL_PROXY_MODE: 'bundled', NODE_ENV: 'production', OIDC_CLIENTID: 'configured' });
    const request_ = request(app, peer, '192.0.2.1');
    request_.headers['x-forwarded-proto'] = 'https';
    const response = new ServerResponse(request_);
    await new Promise<void>((resolve, reject) => {
      session!(request_, response as Response, (error?: unknown) => {
        if (error) {
          reject(error instanceof Error ? error : new Error('Session middleware failed'));
        } else {
          resolve();
        }
      });
    });
    Object.assign(request_.session, { user: 'oauth-user' });
    response.writeHead(200);
    expect(response.getHeader('set-cookie')).toEqual(cookie);
  });

  it.each([
    [{ HEIMDALL_PROXY_MODE: 'external', NODE_ENV: 'production', OIDC_CLIENTID: 'configured' }, [], '192.0.2.1'],
    [{ NODE_ENV: 'production', OIDC_CLIENTID: 'configured' }, [], '192.0.2.1'],
    [{ NODE_ENV: 'production' }, ['https://tenable.example'], '192.0.2.1'],
    [{ HEIMDALL_PROXY_MODE: 'external', NODE_ENV: 'production' }, [], '198.51.100.1'],
    [{ NODE_ENV: 'development', OIDC_CLIENTID: 'configured' }, [], '198.51.100.1'],
  ] as [Record<string, string>, string[], string][])('preserves existing external/non-RPM trust for %j and %j', async (values, tenable, ip) => {
    const { app } = await bootApp(values, tenable);
    expect(request(app, '198.51.100.1', '192.0.2.1').ip).toBe(ip);
  });
});
