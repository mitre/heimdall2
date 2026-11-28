// eslint-disable-next-line n/no-extraneous-import -- Exercise the Express implementation installed by the Nest adapter.
import express from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from './config.service';

afterEach(() => vi.restoreAllMocks());

function clientIP(trust: 'loopback' | boolean, peer: string, forwarded: string) {
  const app = express();
  app.set('trust proxy', trust);
  const request = Object.assign(Object.create(app.request), {
    app,
    headers: { 'x-forwarded-for': forwarded },
    socket: { remoteAddress: peer },
  });
  return request.ip;
}

function config(values: Record<string, string> = {}, tenable: string[] = []) {
  const service = Object.create(ConfigService.prototype) as ConfigService;
  const settings = new Map(Object.entries(values));
  vi.spyOn(service, 'get').mockImplementation(key => settings.get(key));
  vi.spyOn(service, 'getTenableHostUrl').mockReturnValue(tenable);
  return service;
}

describe('proxy trust', () => {
  it.each(['nginx', 'bundled'])('trusts only loopback for managed %s', (mode) => {
    for (const values of [{}, { OIDC_CLIENTID: 'configured' }]) {
      expect(
        config({ HEIMDALL_PROXY_MODE: mode, NODE_ENV: 'production', ...values })
          .getTrustProxy(),
      ).toBe('loopback');
    }
    expect(
      config({ HEIMDALL_PROXY_MODE: mode, NODE_ENV: 'production' }, [
        'https://tenable.example',
      ]).getTrustProxy(),
    ).toBe('loopback');
  });

  it('preserves existing external and non-RPM behavior', () => {
    expect(
      config({
        HEIMDALL_PROXY_MODE: 'external',
        NODE_ENV: 'production',
        OIDC_CLIENTID: 'configured',
      }).getTrustProxy(),
    ).toBe(true);
    expect(
      config({ NODE_ENV: 'production', OIDC_CLIENTID: 'configured' })
        .getTrustProxy(),
    ).toBe(true);
    expect(
      config({ NODE_ENV: 'production' }, ['https://tenable.example'])
        .getTrustProxy(),
    ).toBe(true);
    expect(
      config({ HEIMDALL_PROXY_MODE: 'external', NODE_ENV: 'production' })
        .getTrustProxy(),
    ).toBe(false);
    expect(
      config({ NODE_ENV: 'development', OIDC_CLIENTID: 'configured' })
        .getTrustProxy(),
    ).toBe(false);
  });

  it.each(['127.0.0.1', '::1', '::ffff:127.0.0.1'])(
    'recognizes clients behind %s',
    (peer) => {
      expect(clientIP('loopback', peer, '198.51.100.4')).toBe('198.51.100.4');
      expect(clientIP('loopback', peer, '203.0.113.99, 198.51.100.4'))
        .toBe('198.51.100.4');
    },
  );

  it('ignores spoofed forwarded addresses from a direct remote peer', () => {
    expect(clientIP('loopback', '198.51.100.4', '203.0.113.99'))
      .toBe('198.51.100.4');
  });
});
