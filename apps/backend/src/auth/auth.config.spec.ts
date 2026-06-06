import {describe, expect, it} from 'vitest';
import {createAuth} from './auth.config';

const TEST_SECRET = 'a'.repeat(64);
const PROD_OVERRIDES = {
  NODE_ENV: 'production' as const,
  BETTER_AUTH_SECRET: TEST_SECRET,
};

describe('auth config', () => {
  it('createAuth returns a betterAuth instance with Drizzle adapter and basePath', () => {
    const auth = createAuth();
    expect(auth.options.basePath).toBe('/api/auth');
    expect(auth.options.database).toBeDefined();
  });

  describe('organization plugin', () => {
    it('includes organization plugin in auth config', () => {
      const auth = createAuth();
      const plugins = auth.options.plugins || [];
      const orgPlugin = plugins.find(
        (p: {id?: string}) => p.id === 'organization'
      );
      expect(orgPlugin).toBeDefined();
    });

    it('organization plugin has member management endpoints', () => {
      const auth = createAuth();
      const plugins = auth.options.plugins || [];
      const orgPlugin = plugins.find(
        (p: {id?: string; endpoints?: Record<string, unknown>}) =>
          p.id === 'organization'
      ) as {endpoints: Record<string, unknown>};
      expect(orgPlugin.endpoints.createOrganization).toBeDefined();
      expect(orgPlugin.endpoints.addMember).toBeDefined();
      expect(orgPlugin.endpoints.removeMember).toBeDefined();
      expect(orgPlugin.endpoints.updateMemberRole).toBeDefined();
      expect(orgPlugin.endpoints.createInvitation).toBeDefined();
    });
  });

  describe('SSO plugin (SAML 2.0)', () => {
    it('includes sso plugin in auth config', () => {
      const auth = createAuth();
      const plugins = auth.options.plugins || [];
      const ssoPlugin = plugins.find(
        (p: {id?: string}) => p.id === 'sso'
      );
      expect(ssoPlugin).toBeDefined();
    });

    it('sso plugin has SAML endpoints', () => {
      const auth = createAuth();
      const plugins = auth.options.plugins || [];
      const ssoPlugin = plugins.find(
        (p: {id?: string; endpoints?: Record<string, unknown>}) =>
          p.id === 'sso'
      ) as {endpoints: Record<string, unknown>};
      expect(ssoPlugin.endpoints.spMetadata).toBeDefined();
      expect(ssoPlugin.endpoints.acsEndpoint).toBeDefined();
      expect(ssoPlugin.endpoints.registerSSOProvider).toBeDefined();
      expect(ssoPlugin.endpoints.signInSSO).toBeDefined();
    });
  });

  describe('two-factor plugin', () => {
    it('includes two-factor plugin in auth config', () => {
      const auth = createAuth();
      const plugins = auth.options.plugins || [];
      const tfPlugin = plugins.find(
        (p: {id?: string}) => p.id === 'two-factor'
      );
      expect(tfPlugin).toBeDefined();
    });

    it('two-factor plugin has TOTP endpoints', () => {
      const auth = createAuth();
      const plugins = auth.options.plugins || [];
      const tfPlugin = plugins.find(
        (p: {id?: string; endpoints?: Record<string, unknown>}) =>
          p.id === 'two-factor'
      ) as {endpoints: Record<string, unknown>};
      expect(tfPlugin.endpoints.enableTwoFactor).toBeDefined();
      expect(tfPlugin.endpoints.verifyTOTP).toBeDefined();
      expect(tfPlugin.endpoints.generateBackupCodes).toBeDefined();
    });
  });

  describe('API key plugin', () => {
    it('includes api-key plugin when API_KEY_SECRET is set', () => {
      const auth = createAuth({
        envOverrides: {API_KEY_SECRET: 'a'.repeat(64)},
      });
      const plugins = auth.options.plugins || [];
      const akPlugin = plugins.find(
        (p: {id?: string}) => p.id === 'api-key'
      );
      expect(akPlugin).toBeDefined();
    });

    it('excludes api-key plugin when API_KEY_SECRET is not set', () => {
      const auth = createAuth({
        envOverrides: {API_KEY_SECRET: undefined},
      });
      const plugins = auth.options.plugins || [];
      const akPlugin = plugins.find(
        (p: {id?: string}) => p.id === 'api-key'
      );
      expect(akPlugin).toBeUndefined();
    });

    it('api-key plugin has schema with apikey table', () => {
      const auth = createAuth({
        envOverrides: {API_KEY_SECRET: 'a'.repeat(64)},
      });
      const plugins = auth.options.plugins || [];
      const akPlugin = plugins.find(
        (p: {id?: string}) => p.id === 'api-key'
      ) as unknown as {schema?: Record<string, unknown>};
      expect(akPlugin.schema).toBeDefined();
      expect(akPlugin.schema!.apikey).toBeDefined();
    });
  });

  describe('admin plugin restrictions', () => {
    it('admin plugin is configured with explicit options (not bare defaults)', () => {
      const auth = createAuth();
      const plugins = auth.options.plugins || [];
      const adminPlugin = plugins.find(
        (p: {id?: string; options?: unknown}) => p.id === 'admin'
      ) as {options?: Record<string, unknown>};
      expect(adminPlugin).toBeDefined();
      expect(adminPlugin.options).toBeDefined();
    });

    it('admin role does not include impersonate permission', () => {
      const auth = createAuth();
      const plugins = auth.options.plugins || [];
      const adminPlugin = plugins.find(
        (p: {id?: string}) => p.id === 'admin'
      ) as unknown as {options: {roles: Record<string, {statements: Record<string, string[]>}>}};
      const adminRole = adminPlugin.options.roles.admin;
      expect(adminRole.statements.user).not.toContain('impersonate');
      expect(adminRole.statements.user).not.toContain('impersonate-admins');
    });

    it('admin role retains core management permissions', () => {
      const auth = createAuth();
      const plugins = auth.options.plugins || [];
      const adminPlugin = plugins.find(
        (p: {id?: string}) => p.id === 'admin'
      ) as unknown as {options: {roles: Record<string, {statements: Record<string, string[]>}>}};
      const adminRole = adminPlugin.options.roles.admin;
      expect(adminRole.statements.user).toContain('create');
      expect(adminRole.statements.user).toContain('list');
      expect(adminRole.statements.user).toContain('ban');
      expect(adminRole.statements.user).toContain('set-role');
      expect(adminRole.statements.user).toContain('set-password');
    });
  });

  describe('getSecret', () => {
    it('uses BETTER_AUTH_SECRET when set', () => {
      const secret = 'B'.repeat(64);
      const auth = createAuth({envOverrides: {BETTER_AUTH_SECRET: secret}});
      expect(auth.options.secret).toBe(secret);
    });

    it('falls back to JWT_SECRET when BETTER_AUTH_SECRET is not set', () => {
      const secret = 'J'.repeat(64);
      const auth = createAuth({
        envOverrides: {BETTER_AUTH_SECRET: undefined, JWT_SECRET: secret},
      });
      expect(auth.options.secret).toBe(secret);
    });

    it('uses test-only fallback when both secrets are unset in test mode', () => {
      const auth = createAuth({
        envOverrides: {BETTER_AUTH_SECRET: undefined, JWT_SECRET: undefined},
      });
      expect(auth.options.secret).toBe('test-only-secret-not-for-production');
    });

    it('prefers BETTER_AUTH_SECRET over JWT_SECRET', () => {
      const ba = 'B'.repeat(64);
      const jwt = 'J'.repeat(64);
      const auth = createAuth({
        envOverrides: {BETTER_AUTH_SECRET: ba, JWT_SECRET: jwt},
      });
      expect(auth.options.secret).toBe(ba);
    });
  });

  it('uses custom bcrypt hasher with cost 14 that round-trips correctly', async () => {
    const auth = createAuth();
    const pw = auth.options.emailAndPassword?.password;
    expect(pw?.hash).toBeTypeOf('function');
    expect(pw?.verify).toBeTypeOf('function');

    const hashed = await pw!.hash!('testpassword123');
    expect(hashed).toMatch(/^\$2[ab]\$14\$/);

    const valid = await pw!.verify!({hash: hashed, password: 'testpassword123'});
    expect(valid).toBe(true);

    const invalid = await pw!.verify!({hash: hashed, password: 'wrongpassword'});
    expect(invalid).toBe(false);
  });

  it('does not enable FIPS-unsafe encryptOAuthTokens', () => {
    const auth = createAuth();
    const account = auth.options.account as Record<string, unknown> | undefined;
    expect(account?.encryptOAuthTokens).not.toBe(true);
  });

  it('sets httpOnly true and sameSite lax on cookies', () => {
    const auth = createAuth();
    const attrs = auth.options.advanced?.defaultCookieAttributes;
    expect(attrs?.httpOnly).toBe(true);
    expect(attrs?.sameSite).toBe('lax');
  });

  it('sets cookiePrefix to heimdall', () => {
    const auth = createAuth();
    expect(auth.options.advanced?.cookiePrefix).toBe('heimdall');
  });

  it('sets trustedOrigins to contain the baseURL', () => {
    const auth = createAuth({
      envOverrides: {EXTERNAL_URL: 'https://heimdall.example.gov'},
    });
    const origins = auth.options.trustedOrigins as string[];
    expect(origins).toContain('https://heimdall.example.gov');
  });

  it('sets session.expiresIn to 86400 (24 hours)', () => {
    const auth = createAuth();
    expect(auth.options.session?.expiresIn).toBe(86400);
  });

  it('enables emailAndPassword', () => {
    const auth = createAuth();
    expect(auth.options.emailAndPassword?.enabled).toBe(true);
  });

  it('sets empty trustedProviders for account linking (STIG)', () => {
    const auth = createAuth();
    const linking = (auth.options as Record<string, unknown>).accountLinking as {trustedProviders?: string[]};
    expect(linking?.trustedProviders).toEqual([]);
  });

  it('enables rate limiting with 5/min on sign-in', () => {
    const auth = createAuth();
    expect(auth.options.rateLimit?.enabled).toBe(true);
    const rules = auth.options.rateLimit?.customRules as Record<string, {max: number; window: number}>;
    expect(rules['/sign-in/*'].max).toBe(5);
    expect(rules['/sign-in/*'].window).toBe(60);
  });

  it('sets secure cookies in production mode', () => {
    const auth = createAuth({envOverrides: PROD_OVERRIDES});
    expect(auth.options.advanced?.defaultCookieAttributes?.secure).toBe(true);
  });

  it('does not set secure cookies in development mode', () => {
    const auth = createAuth();
    expect(auth.options.advanced?.defaultCookieAttributes?.secure).toBe(false);
  });

  it('excludes openAPI plugin in production', () => {
    const auth = createAuth({envOverrides: PROD_OVERRIDES});
    const plugins = auth.options.plugins || [];
    const ids = plugins.map((p: {id?: string}) => p.id);
    expect(ids).not.toContain('open-api');
  });

  it('includes openAPI plugin in non-production', () => {
    const auth = createAuth();
    const plugins = auth.options.plugins || [];
    const ids = plugins.map((p: {id?: string}) => p.id);
    expect(ids).toContain('open-api');
  });

  it('accepts envOverrides to change baseURL', () => {
    const auth = createAuth({
      envOverrides: {EXTERNAL_URL: 'https://test.example.com'},
    });
    expect(auth.options.baseURL).toBe('https://test.example.com');
  });

  describe('ONE_SESSION_PER_USER enforcement', () => {
    it('includes session.create.after databaseHook when ONE_SESSION_PER_USER is true', () => {
      const auth = createAuth({
        envOverrides: {ONE_SESSION_PER_USER: 'true'},
      });
      const hooks = auth.options.databaseHooks;
      expect(hooks?.session?.create?.after).toBeTypeOf('function');
    });

    it('does not include session.create.after hook when ONE_SESSION_PER_USER is not set', () => {
      const auth = createAuth({
        envOverrides: {ONE_SESSION_PER_USER: undefined},
      });
      const hooks = auth.options.databaseHooks;
      expect(hooks?.session?.create?.after).toBeUndefined();
    });
  });

  describe('forcePasswordChange surfaced via customSession', () => {
    it('includes customSession plugin in plugins array', () => {
      const auth = createAuth();
      const plugins = auth.options.plugins || [];
      const csPlugin = plugins.find(
        (p: {id?: string}) => p.id === 'custom-session'
      );
      expect(csPlugin).toBeDefined();
    });

    it('includes databaseHook on session.create.before to check forcePasswordChange', () => {
      const auth = createAuth();
      const hooks = auth.options.databaseHooks;
      expect(hooks?.session?.create?.before).toBeTypeOf('function');
    });
  });

  describe('registration and local login controls', () => {
    it('enables sign-up by default when REGISTRATION_DISABLED is not set', () => {
      const auth = createAuth();
      expect(auth.options.emailAndPassword?.disableSignUp).toBe(false);
    });

    it('disables sign-up when REGISTRATION_DISABLED is true', () => {
      const auth = createAuth({
        envOverrides: {REGISTRATION_DISABLED: 'true'},
      });
      expect(auth.options.emailAndPassword?.disableSignUp).toBe(true);
    });

    it('enables sign-up when REGISTRATION_DISABLED is false', () => {
      const auth = createAuth({
        envOverrides: {REGISTRATION_DISABLED: 'false'},
      });
      expect(auth.options.emailAndPassword?.disableSignUp).toBe(false);
    });

    it('keeps emailAndPassword enabled by default', () => {
      const auth = createAuth();
      expect(auth.options.emailAndPassword?.enabled).toBe(true);
    });

    it('disables emailAndPassword when LOCAL_LOGIN_DISABLED is true', () => {
      const auth = createAuth({
        envOverrides: {LOCAL_LOGIN_DISABLED: 'true'},
      });
      expect(auth.options.emailAndPassword?.enabled).toBe(false);
    });

    it('disables sign-up AND emailAndPassword when both are set', () => {
      const auth = createAuth({
        envOverrides: {
          REGISTRATION_DISABLED: 'true',
          LOCAL_LOGIN_DISABLED: 'true',
        },
      });
      expect(auth.options.emailAndPassword?.enabled).toBe(false);
      expect(auth.options.emailAndPassword?.disableSignUp).toBe(true);
    });
  });
});
