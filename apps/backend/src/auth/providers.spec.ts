import {describe, expect, it} from 'vitest';
import {createAuth} from './auth.config';

describe('social + OIDC providers', () => {
  it('includes GitHub provider when GITHUB_CLIENTID is set', () => {
    const auth = createAuth({
      envOverrides: {GITHUB_CLIENTID: 'gh-test-id', GITHUB_CLIENTSECRET: 'gh-test-secret'},
    });
    const github = auth.options.socialProviders?.github;
    expect(github).toBeDefined();
    expect(github?.clientId).toBe('gh-test-id');
    expect(github?.clientSecret).toBe('gh-test-secret');
  });

  it('excludes GitHub provider when GITHUB_CLIENTID is not set', () => {
    const auth = createAuth({
      envOverrides: {GITHUB_CLIENTID: undefined, GITHUB_CLIENTSECRET: undefined},
    });
    expect(auth.options.socialProviders?.github).toBeUndefined();
  });

  it('includes GitLab provider with custom baseURL', () => {
    const auth = createAuth({
      envOverrides: {
        GITLAB_CLIENTID: 'gl-test-id',
        GITLAB_CLIENTSECRET: 'gl-test-secret',
        GITLAB_BASEURL: 'https://gitlab.mitre.org',
      },
    });
    const gitlab = auth.options.socialProviders?.gitlab;
    expect(gitlab).toBeDefined();
    expect(gitlab?.clientId).toBe('gl-test-id');
  });

  it('includes Google provider when GOOGLE_CLIENTID is set', () => {
    const auth = createAuth({
      envOverrides: {GOOGLE_CLIENTID: 'goog-test-id', GOOGLE_CLIENTSECRET: 'goog-test-secret'},
    });
    const google = auth.options.socialProviders?.google;
    expect(google).toBeDefined();
    expect(google?.clientId).toBe('goog-test-id');
  });

  it('includes genericOAuth with Okta when OKTA_CLIENTID is set', () => {
    const auth = createAuth({
      envOverrides: {
        OKTA_CLIENTID: 'okta-test-id',
        OKTA_CLIENTSECRET: 'okta-test-secret',
        OKTA_DOMAIN: 'mitre.okta.com',
      },
    });
    const plugins = auth.options.plugins || [];
    const genericOAuthPlugin = plugins.find(
      (p: {id?: string}) => p.id === 'generic-oauth'
    );
    expect(genericOAuthPlugin).toBeDefined();
  });

  it('includes genericOAuth with OIDC when OIDC_CLIENTID is set', () => {
    const auth = createAuth({
      envOverrides: {
        OIDC_CLIENTID: 'oidc-test-id',
        OIDC_CLIENT_SECRET: 'oidc-test-secret',
        OIDC_ISSUER: 'https://auth.example.com',
      },
    });
    const plugins = auth.options.plugins || [];
    const genericOAuthPlugin = plugins.find(
      (p: {id?: string}) => p.id === 'generic-oauth'
    );
    expect(genericOAuthPlugin).toBeDefined();
  });

  it('excludes all social providers when no CLIENTID env vars are set', () => {
    const auth = createAuth({
      envOverrides: {
        GITHUB_CLIENTID: undefined,
        GITLAB_CLIENTID: undefined,
        GOOGLE_CLIENTID: undefined,
      },
    });
    expect(auth.options.socialProviders?.github).toBeUndefined();
    expect(auth.options.socialProviders?.gitlab).toBeUndefined();
    expect(auth.options.socialProviders?.google).toBeUndefined();
  });

  it('rejects HTTP URLs for OIDC_ISSUER in production', () => {
    expect(() =>
      createAuth({
        envOverrides: {
          NODE_ENV: 'production' as const,
          BETTER_AUTH_SECRET: 'a'.repeat(64),
          OIDC_CLIENTID: 'oidc-test-id',
          OIDC_CLIENT_SECRET: 'oidc-test-secret',
          OIDC_ISSUER: 'http://insecure.example.com',
        },
      })
    ).toThrow('must use HTTPS');
  });

  it('rejects HTTP URLs for Okta domain in production', () => {
    expect(() =>
      createAuth({
        envOverrides: {
          NODE_ENV: 'production' as const,
          BETTER_AUTH_SECRET: 'a'.repeat(64),
          OKTA_CLIENTID: 'okta-test-id',
          OKTA_CLIENTSECRET: 'okta-test-secret',
          OKTA_DOMAIN: 'http://evil.example.com',
        },
      })
    ).toThrow('must use HTTPS');
  });

  it('allows HTTP URLs for OIDC_ISSUER in development', () => {
    const auth = createAuth({
      envOverrides: {
        OIDC_CLIENTID: 'oidc-test-id',
        OIDC_CLIENT_SECRET: 'oidc-test-secret',
        OIDC_ISSUER: 'http://localhost:8080',
      },
    });
    const plugins = auth.options.plugins || [];
    const genericOAuthPlugin = plugins.find(
      (p: {id?: string}) => p.id === 'generic-oauth'
    );
    expect(genericOAuthPlugin).toBeDefined();
  });

  it('sanitizes OIDC_NAME to safe providerId with path traversal stripped', () => {
    const auth = createAuth({
      envOverrides: {
        OIDC_CLIENTID: 'oidc-test-id',
        OIDC_CLIENT_SECRET: 'oidc-test-secret',
        OIDC_ISSUER: 'https://auth.example.com',
        OIDC_NAME: 'My Corp/../Auth',
      },
    });
    const plugins = auth.options.plugins || [];
    const genericOAuthPlugin = plugins.find(
      (p: {id?: string}) => p.id === 'generic-oauth'
    ) as {options?: {config?: Array<{providerId: string}>}};
    expect(genericOAuthPlugin).toBeDefined();
    const oidcConfig = genericOAuthPlugin.options!.config!.find(
      (c: {providerId: string}) => c.providerId !== 'okta'
    );
    expect(oidcConfig!.providerId).toBe('my-corp-auth');
  });

  it('supports simultaneous Okta + OIDC configuration', () => {
    const auth = createAuth({
      envOverrides: {
        OKTA_CLIENTID: 'okta-id',
        OKTA_CLIENTSECRET: 'okta-secret',
        OKTA_DOMAIN: 'mitre.okta.com',
        OIDC_CLIENTID: 'oidc-id',
        OIDC_CLIENT_SECRET: 'oidc-secret',
        OIDC_ISSUER: 'https://auth.example.com',
      },
    });
    const plugins = auth.options.plugins || [];
    const genericOAuthPlugin = plugins.find(
      (p: {id?: string}) => p.id === 'generic-oauth'
    );
    expect(genericOAuthPlugin).toBeDefined();
  });

  it('has empty trustedProviders by default (STIG)', () => {
    const auth = createAuth();
    expect(auth.options.accountLinking?.trustedProviders).toEqual([]);
  });

  it('does not register GitHub when CLIENTID set but CLIENTSECRET missing', () => {
    const auth = createAuth({
      envOverrides: {GITHUB_CLIENTID: 'gh-id', GITHUB_CLIENTSECRET: undefined},
    });
    expect(auth.options.socialProviders?.github).toBeUndefined();
  });

  it('rejects HTTP GitLab baseURL in production', () => {
    expect(() =>
      createAuth({
        envOverrides: {
          NODE_ENV: 'production' as const,
          BETTER_AUTH_SECRET: 'a'.repeat(64),
          GITLAB_CLIENTID: 'gl-id',
          GITLAB_CLIENTSECRET: 'gl-secret',
          GITLAB_BASEURL: 'http://gitlab.insecure.com',
        },
      })
    ).toThrow('must use HTTPS');
  });

  it('rejects HTTP GitHub Enterprise base URL in production', () => {
    expect(() =>
      createAuth({
        envOverrides: {
          NODE_ENV: 'production' as const,
          BETTER_AUTH_SECRET: 'a'.repeat(64),
          GITHUB_CLIENTID: 'gh-id',
          GITHUB_CLIENTSECRET: 'gh-secret',
          GITHUB_ENTERPRISE_INSTANCE_BASE_URL: 'http://ghe.insecure.com',
        },
      })
    ).toThrow('must use HTTPS');
  });

  it('supports Okta via OKTA_ISSUER_URL instead of OKTA_DOMAIN', () => {
    const auth = createAuth({
      envOverrides: {
        OKTA_CLIENTID: 'okta-id',
        OKTA_CLIENTSECRET: 'okta-secret',
        OKTA_ISSUER_URL: 'https://mitre.okta.com',
        OKTA_DOMAIN: undefined,
      },
    });
    const plugins = auth.options.plugins || [];
    const genericOAuthPlugin = plugins.find(
      (p: {id?: string}) => p.id === 'generic-oauth'
    );
    expect(genericOAuthPlugin).toBeDefined();
  });

  it('silently excludes OIDC when OIDC_ISSUER is missing', () => {
    const auth = createAuth({
      envOverrides: {
        OIDC_CLIENTID: 'oidc-id',
        OIDC_CLIENT_SECRET: 'oidc-secret',
        OIDC_ISSUER: undefined,
      },
    });
    const plugins = auth.options.plugins || [];
    const genericOAuthPlugin = plugins.find(
      (p: {id?: string}) => p.id === 'generic-oauth'
    );
    expect(genericOAuthPlugin).toBeUndefined();
  });
});
