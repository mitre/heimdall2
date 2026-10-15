import express from 'express';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ConfigService} from './config.service';

afterEach(() => vi.restoreAllMocks());

function config(values: Record<string, string> = {}, tenable: string[] = []) {
  const service = Object.create(ConfigService.prototype) as ConfigService;
  vi.spyOn(service, 'get').mockImplementation((key) => values[key]);
  vi.spyOn(service, 'getTenableHostUrl').mockReturnValue(tenable);
  return service;
}

function clientIP(trust: boolean | 'loopback', peer: string, forwarded: string) {
  const app = express();
  app.set('trust proxy', trust);
  const request = Object.assign(Object.create(app.request), {
    app,
    socket: {remoteAddress: peer},
    headers: {'x-forwarded-for': forwarded}
  });
  return request.ip;
}

describe('proxy trust', () => {
  it.each(['nginx', 'bundled'])('trusts only loopback for managed %s', (mode) => {
    for (const values of [{}, {OIDC_CLIENTID: 'configured'}]) {
      expect(
        config({NODE_ENV: 'production', HEIMDALL_PROXY_MODE: mode, ...values})
          .getTrustProxy()
      ).toBe('loopback');
    }
    expect(
      config({NODE_ENV: 'production', HEIMDALL_PROXY_MODE: mode}, [
        'https://tenable.example'
      ]).getTrustProxy()
    ).toBe('loopback');
  });

  it('preserves existing external and non-RPM behavior', () => {
    expect(
      config({
        NODE_ENV: 'production',
        HEIMDALL_PROXY_MODE: 'external',
        OIDC_CLIENTID: 'configured'
      }).getTrustProxy()
    ).toBe(true);
    expect(
      config({NODE_ENV: 'production', OIDC_CLIENTID: 'configured'})
        .getTrustProxy()
    ).toBe(true);
    expect(
      config({NODE_ENV: 'production'}, ['https://tenable.example'])
        .getTrustProxy()
    ).toBe(true);
    expect(
      config({NODE_ENV: 'production', HEIMDALL_PROXY_MODE: 'external'})
        .getTrustProxy()
    ).toBe(false);
    expect(
      config({NODE_ENV: 'development', OIDC_CLIENTID: 'configured'})
        .getTrustProxy()
    ).toBe(false);
  });

  it.each(['127.0.0.1', '::1', '::ffff:127.0.0.1'])(
    'recognizes clients behind %s',
    (peer) => {
      expect(clientIP('loopback', peer, '198.51.100.4')).toBe('198.51.100.4');
      expect(clientIP('loopback', peer, '203.0.113.99, 198.51.100.4'))
        .toBe('198.51.100.4');
    }
  );

  it('ignores spoofed forwarded addresses from a direct remote peer', () => {
    expect(clientIP('loopback', '198.51.100.4', '203.0.113.99'))
      .toBe('198.51.100.4');
  });
});
