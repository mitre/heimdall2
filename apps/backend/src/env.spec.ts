/* eslint-disable node/no-process-env */
// This test file uses validateEnv() directly with controlled input objects.
// Only the "module default export" test imports the module (which reads process.env).
import {describe, expect, it} from 'vitest';
import {validateEnv} from './env';

const baseTestEnv = {
  NODE_ENV: 'test',
  DATABASE_PASSWORD: 'postgres',
  DATABASE_NAME: 'heimdallts_testing_service_db',
};

const baseProdEnv = {
  NODE_ENV: 'production',
  JWT_SECRET: 'prod-secret-64-chars-long-enough-for-validation-purposes-here',
  DATABASE_PASSWORD: 'prod-pw',
  EXTERNAL_URL: 'https://heimdall.example.gov',
};

describe('env validation', () => {
  // --- Defaults ---

  it('provides DATABASE_HOST default of 127.0.0.1', () => {
    const env = validateEnv(baseTestEnv);
    expect(env.DATABASE_HOST).toBe('127.0.0.1');
  });

  it('provides DATABASE_PORT default of 5432 as number', () => {
    const env = validateEnv(baseTestEnv);
    expect(env.DATABASE_PORT).toBe(5432);
    expect(typeof env.DATABASE_PORT).toBe('number');
  });

  it('reads DATABASE_HOST from input when provided', () => {
    const env = validateEnv({...baseTestEnv, DATABASE_HOST: 'db.example.com'});
    expect(env.DATABASE_HOST).toBe('db.example.com');
  });

  it('provides EXTERNAL_URL default of http://localhost:3000', () => {
    const env = validateEnv(baseTestEnv);
    expect(env.EXTERNAL_URL).toBe('http://localhost:3000');
  });

  it('provides JWT_EXPIRE_TIME default of 1d', () => {
    const env = validateEnv(baseTestEnv);
    expect(env.JWT_EXPIRE_TIME).toBe('1d');
  });

  // --- Optional fields ---

  it('returns undefined for optional GITHUB_CLIENTID when not set', () => {
    const env = validateEnv(baseTestEnv);
    expect(env.GITHUB_CLIENTID).toBeUndefined();
  });

  it('returns GITHUB_CLIENTID when provided', () => {
    const env = validateEnv({...baseTestEnv, GITHUB_CLIENTID: 'gh-id-123'});
    expect(env.GITHUB_CLIENTID).toBe('gh-id-123');
  });

  it('returns undefined for DATABASE_PASSWORD when not set', () => {
    const env = validateEnv({NODE_ENV: 'test'});
    expect(env.DATABASE_PASSWORD).toBeUndefined();
  });

  // --- Type coercion ---

  it('coerces DATABASE_PORT string to number', () => {
    const env = validateEnv({...baseTestEnv, DATABASE_PORT: '5433'});
    expect(env.DATABASE_PORT).toBe(5433);
  });

  it('rejects non-numeric DATABASE_PORT', () => {
    expect(() => validateEnv({...baseTestEnv, DATABASE_PORT: 'abc'})).toThrow();
  });

  // --- NODE_ENV validation ---

  it('accepts development NODE_ENV with secret', () => {
    const env = validateEnv({...baseTestEnv, NODE_ENV: 'development', JWT_SECRET: 'a'.repeat(64)});
    expect(env.NODE_ENV).toBe('development');
  });

  it('rejects invalid NODE_ENV value', () => {
    expect(() => validateEnv({...baseTestEnv, NODE_ENV: 'staging'})).toThrow();
  });

  it('rejects missing NODE_ENV', () => {
    expect(() => validateEnv({DATABASE_PASSWORD: 'pw'})).toThrow();
  });

  // --- Auth secret enforcement ---

  it('requires auth secret in development (not just production)', () => {
    expect(() =>
      validateEnv({NODE_ENV: 'development'})
    ).toThrow('BETTER_AUTH_SECRET');
  });

  it('does NOT require auth secret in test', () => {
    const env = validateEnv({NODE_ENV: 'test'});
    expect(env.NODE_ENV).toBe('test');
  });

  it('accepts BETTER_AUTH_SECRET as the auth secret (min 32 chars)', () => {
    const secret = 'b'.repeat(64);
    const env = validateEnv({NODE_ENV: 'development', BETTER_AUTH_SECRET: secret});
    expect(env.BETTER_AUTH_SECRET).toBe(secret);
  });

  it('accepts JWT_SECRET as the auth secret (min 32 chars)', () => {
    const secret = 'c'.repeat(64);
    const env = validateEnv({NODE_ENV: 'development', JWT_SECRET: secret});
    expect(env.JWT_SECRET).toBe(secret);
  });

  it('rejects auth secret shorter than 32 characters', () => {
    expect(() =>
      validateEnv({NODE_ENV: 'development', JWT_SECRET: 'too-short'})
    ).toThrow();
  });

  // --- Production guards ---

  it('requires DATABASE_PASSWORD in production', () => {
    expect(() =>
      validateEnv({...baseProdEnv, DATABASE_PASSWORD: undefined})
    ).toThrow('DATABASE_PASSWORD');
  });

  it('requires explicit EXTERNAL_URL in production', () => {
    expect(() =>
      validateEnv({...baseProdEnv, EXTERNAL_URL: undefined})
    ).toThrow('EXTERNAL_URL');
  });

  it('rejects default EXTERNAL_URL in production', () => {
    expect(() =>
      validateEnv({...baseProdEnv, EXTERNAL_URL: 'http://localhost:3000'})
    ).toThrow('EXTERNAL_URL');
  });

  it('rejects HTTP EXTERNAL_URL in production', () => {
    expect(() =>
      validateEnv({...baseProdEnv, EXTERNAL_URL: 'http://heimdall.example.gov'})
    ).toThrow('HTTPS');
  });

  it('rejects HTTP OIDC_ISSUER in production', () => {
    expect(() =>
      validateEnv({...baseProdEnv, OIDC_ISSUER: 'http://auth.example.com'})
    ).toThrow('HTTPS');
  });

  it('rejects HTTP GITLAB_BASEURL in production', () => {
    expect(() =>
      validateEnv({...baseProdEnv, GITLAB_BASEURL: 'http://gitlab.example.com'})
    ).toThrow('HTTPS');
  });

  it('rejects HTTP GHE_BASE_URL in production', () => {
    expect(() =>
      validateEnv({
        ...baseProdEnv,
        GITHUB_ENTERPRISE_INSTANCE_BASE_URL: 'http://ghe.example.com',
      })
    ).toThrow('HTTPS');
  });

  it('rejects HTTP GHE_API_URL in production', () => {
    expect(() =>
      validateEnv({
        ...baseProdEnv,
        GITHUB_ENTERPRISE_INSTANCE_API_URL: 'http://ghe-api.example.com',
      })
    ).toThrow('HTTPS');
  });

  // --- Cross-field validation ---

  it('requires OKTA_DOMAIN when OKTA_CLIENTID is set', () => {
    expect(() =>
      validateEnv({...baseTestEnv, OKTA_CLIENTID: 'okta-id'})
    ).toThrow('OKTA_DOMAIN');
  });

  it('accepts OKTA_ISSUER_URL instead of OKTA_DOMAIN', () => {
    const env = validateEnv({
      ...baseTestEnv,
      OKTA_CLIENTID: 'okta-id',
      OKTA_ISSUER_URL: 'https://mitre.okta.com',
    });
    expect(env.OKTA_ISSUER_URL).toBe('https://mitre.okta.com');
  });

  // --- Multiple errors ---

  it('reports multiple validation errors at once', () => {
    try {
      validateEnv({
        NODE_ENV: 'production',
      });
      expect.unreachable('should have thrown');
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain('BETTER_AUTH_SECRET');
      expect(msg).toContain('DATABASE_PASSWORD');
      expect(msg).toContain('EXTERNAL_URL');
    }
  });

  // --- Module default export ---

  it('exports a typed env object from the module default', async () => {
    const {default: env} = await import('./env');
    expect(env.NODE_ENV).toBeDefined();
    expect(env.DATABASE_HOST).toBeDefined();
  });
});
