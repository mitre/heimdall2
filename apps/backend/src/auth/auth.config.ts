import {betterAuth} from 'better-auth';
import type {BetterAuthPlugin} from 'better-auth';
import {apiKey} from '@better-auth/api-key';
import {sso} from '@better-auth/sso';
import {APIError} from 'better-auth/api';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {admin, bearer, customSession, genericOAuth, openAPI, organization, twoFactor} from 'better-auth/plugins';
import {createAccessControl} from 'better-auth/plugins/access';
import {compare, hash} from 'bcryptjs';
import {drizzle} from 'drizzle-orm/node-postgres';
import * as authSchema from '../db/auth-schema.generated';
import {
  getDrizzleConnectionConfig,
  readFileOrValue,
  type DrizzleConnectionConfig,
} from '../db/connection';
import defaultEnv, {type Env} from '../env';
import {ldap, normalizeString} from './plugins/ldap';
import {passwordPolicy} from './plugins/password-policy';


const ac = createAccessControl({
  user: [
    'create', 'list', 'set-role', 'ban', 'delete',
    'set-password', 'get', 'update',
  ],
  session: ['list', 'revoke', 'delete'],
});

const heimdallRoles = {
  admin: ac.newRole({
    user: ['create', 'list', 'set-role', 'ban', 'delete', 'set-password', 'get', 'update'],
    session: ['list', 'revoke', 'delete'],
  }),
  user: ac.newRole({user: [], session: []}),
};

function getSecret(e: Env): string {
  const secret = e.BETTER_AUTH_SECRET || e.JWT_SECRET;
  if (secret) return secret;
  if (e.NODE_ENV === 'test') return 'test-only-secret-not-for-production';
  // Zod superRefine catches this for non-test — this is a safeguard only
  throw new Error('BETTER_AUTH_SECRET or JWT_SECRET must be set');
}

function requireHttpsUrl(
  value: string,
  envVarName: string,
  isProduction: boolean
): string {
  if (isProduction && !value.startsWith('https://')) {
    throw new Error(
      `${envVarName} must use HTTPS (got: ${value.split('/')[0]}//...). ` +
        'HTTP is not permitted for OAuth/OIDC endpoints in production.'
    );
  }
  return value;
}

function sanitizeProviderId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-');
}

function buildSocialProviders(e: Env, isProduction: boolean) {
  const providers: Record<
    string,
    {clientId: string; clientSecret: string; [k: string]: unknown}
  > = {};

  if (e.GITHUB_CLIENTID && e.GITHUB_CLIENTSECRET) {
    providers.github = {
      clientId: e.GITHUB_CLIENTID,
      clientSecret: e.GITHUB_CLIENTSECRET,
      ...(e.GITHUB_ENTERPRISE_INSTANCE_BASE_URL && {
        baseURL: requireHttpsUrl(
          e.GITHUB_ENTERPRISE_INSTANCE_BASE_URL,
          'GITHUB_ENTERPRISE_INSTANCE_BASE_URL',
          isProduction
        ),
      }),
    };
  }

  if (e.GITLAB_CLIENTID && e.GITLAB_CLIENTSECRET) {
    providers.gitlab = {
      clientId: e.GITLAB_CLIENTID,
      clientSecret: e.GITLAB_CLIENTSECRET,
      ...(e.GITLAB_BASEURL && {
        baseURL: requireHttpsUrl(e.GITLAB_BASEURL, 'GITLAB_BASEURL', isProduction),
      }),
    };
  }

  if (e.GOOGLE_CLIENTID && e.GOOGLE_CLIENTSECRET) {
    providers.google = {
      clientId: e.GOOGLE_CLIENTID,
      clientSecret: e.GOOGLE_CLIENTSECRET,
    };
  }

  return Object.keys(providers).length > 0 ? providers : undefined;
}

function buildGenericOAuthConfigs(e: Env, isProduction: boolean) {
  const configs: Array<{
    providerId: string;
    clientId: string;
    clientSecret: string;
    discoveryUrl: string;
    [k: string]: unknown;
  }> = [];

  if (e.OKTA_CLIENTID && e.OKTA_CLIENTSECRET) {
    const domain = e.OKTA_DOMAIN || e.OKTA_ISSUER_URL;
    if (domain) {
      if (isProduction && domain.startsWith('http://')) {
        throw new Error(
          'OKTA_DOMAIN must use HTTPS (got: http://...). HTTP is not permitted for OAuth/OIDC endpoints in production.'
        );
      }
      const issuer = domain.startsWith('https://') ? domain : `https://${domain}`;
      configs.push({
        providerId: 'okta',
        clientId: e.OKTA_CLIENTID,
        clientSecret: e.OKTA_CLIENTSECRET,
        discoveryUrl: `${issuer}/.well-known/openid-configuration`,
      });
    } else {
      console.warn(
        'WARNING: OKTA_CLIENTID and OKTA_CLIENTSECRET are set but OKTA_DOMAIN is missing. Okta provider not configured.'
      );
    }
  }

  if (e.OIDC_CLIENTID && e.OIDC_CLIENT_SECRET && e.OIDC_ISSUER) {
    const issuer = requireHttpsUrl(e.OIDC_ISSUER, 'OIDC_ISSUER', isProduction);
    configs.push({
      providerId: sanitizeProviderId(e.OIDC_NAME || 'oidc'),
      clientId: e.OIDC_CLIENTID,
      clientSecret: e.OIDC_CLIENT_SECRET,
      discoveryUrl: `${issuer}/.well-known/openid-configuration`,
    });
  }

  return configs;
}

function buildLdapConfig(e: Env): import('./plugins/ldap').LdapOptions | null {
  if (e.LDAP_ENABLED?.toLowerCase() !== 'true') {
    return null;
  }

  const tlsOptions =
    e.LDAP_SSL?.toLowerCase() === 'true'
      ? {
          rejectUnauthorized:
            e.LDAP_SSL_INSECURE?.toLowerCase() !== 'true',
          ...(e.LDAP_SSL_CA ? {ca: readFileOrValue(e.LDAP_SSL_CA)} : {}),
        }
      : undefined;

  const nameField = e.LDAP_NAMEFIELD;
  const mailField = e.LDAP_MAILFIELD;

  return {
    config: [
      {
        providerId: 'ldap',
        ldap: {
          ldapOpts: {
            url: e.LDAP_HOST || 'ldap://localhost:389',
            ...(tlsOptions ? {tlsOptions} : {}),
          },
          adminDn: e.LDAP_BINDDN || '',
          adminPassword: e.LDAP_PASSWORD || '',
          userSearchBase: e.LDAP_SEARCHBASE || '',
          usernameAttribute:
            e.LDAP_SEARCHFILTER?.match(/\((\w+)=/)?.[1] || 'uid',
          ...(e.LDAP_SEARCHFILTER
            ? {searchFilter: e.LDAP_SEARCHFILTER}
            : {}),
        },
        mapProfileToUser: async ({profile, username}) => ({
          id: normalizeString(profile.uid) ||
              normalizeString(profile.sAMAccountName) ||
              normalizeString(profile.dn) ||
              username,
          email: (
            normalizeString(profile[mailField]) ||
            normalizeString(profile.mail) ||
            ''
          ).toLowerCase(),
          name:
            normalizeString(profile[nameField]) ||
            normalizeString(profile.cn) ||
            normalizeString(profile.displayName) ||
            username,
          emailVerified: true,
        }),
      },
    ],
  };
}

export interface CreateAuthOptions {
  connectionConfig?: DrizzleConnectionConfig;
  envOverrides?: Partial<Env>;
  db?: ReturnType<typeof drizzle>;
}

export function createAuth(options?: CreateAuthOptions) {
  const e: Env = {...defaultEnv, ...options?.envOverrides};
  const db = options?.db ??
    drizzle({connection: options?.connectionConfig || getDrizzleConnectionConfig(5)});
  const baseURL = e.EXTERNAL_URL;
  const isProduction = e.NODE_ENV === 'production';

  const socialProviders = buildSocialProviders(e, isProduction);
  const oauthConfigs = buildGenericOAuthConfigs(e, isProduction);
  const ldapConfig = buildLdapConfig(e);
  const isRegistrationDisabled =
    e.REGISTRATION_DISABLED?.toLowerCase() === 'true';
  const isLocalLoginDisabled =
    e.LOCAL_LOGIN_DISABLED?.toLowerCase() === 'true';
  const isOneSessionPerUser =
    e.ONE_SESSION_PER_USER?.toLowerCase() === 'true';

  return betterAuth({
    secret: getSecret(e),
    baseURL,
    basePath: '/api/auth',
    trustedOrigins: [baseURL],

    ...(socialProviders && {socialProviders}),

    accountLinking: {
      enabled: true,
      trustedProviders: [],
    },

    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: authSchema,
    }),

    user: {
      modelName: 'ba_user',
      additionalFields: {
        firstName: {type: 'string', required: false},
        lastName: {type: 'string', required: false},
        organization: {type: 'string', required: false},
        title: {type: 'string', required: false},
        creationMethod: {
          type: 'string',
          required: false,
          defaultValue: 'local',
        },
        forcePasswordChange: {
          type: 'boolean',
          required: false,
          defaultValue: false,
        },
        loginCount: {type: 'number', required: false, defaultValue: 0},
        lastLogin: {type: 'date', required: false},
        passwordChangedAt: {type: 'date', required: false},
      },
    },

    session: {
      modelName: 'ba_session',
      expiresIn: e.SESSION_EXPIRES_IN,
      cookieCache: {
        enabled: true,
        maxAge: e.SESSION_COOKIE_CACHE_MAX_AGE,
      },
    },

    account: {
      modelName: 'ba_account',
    },

    verification: {
      modelName: 'ba_verification',
    },

    emailAndPassword: {
      enabled: !isLocalLoginDisabled,
      disableSignUp: isRegistrationDisabled,
      password: {
        hash: async (password: string) => hash(password, e.BCRYPT_COST),
        verify: async (data: {hash: string; password: string}) =>
          compare(data.password, data.hash),
      },
    },

    advanced: {
      cookiePrefix: e.COOKIE_PREFIX,
      defaultCookieAttributes: {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const,
      },
    },

    rateLimit: {
      enabled: e.RATE_LIMIT_ENABLED?.toLowerCase() !== 'false',
      window: e.RATE_LIMIT_WINDOW,
      max: e.RATE_LIMIT_MAX,
      customRules: {
        '/sign-in/*': {window: e.RATE_LIMIT_LOGIN_WINDOW, max: e.RATE_LIMIT_LOGIN_MAX},
        '/sign-up/email': {window: e.RATE_LIMIT_SIGNUP_WINDOW, max: e.RATE_LIMIT_SIGNUP_MAX},
        '/forget-password': {window: e.RATE_LIMIT_SIGNUP_WINDOW, max: e.RATE_LIMIT_SIGNUP_MAX},
      },
    },

    databaseHooks: {
      session: {
        create: {
          async before(session, ctx) {
            if (!ctx) return;
            const user = await ctx.context.internalAdapter.findUserById(
              session.userId
            ) as {forcePasswordChange?: boolean} | null;
            if (user?.forcePasswordChange) {
              throw new APIError('FORBIDDEN', {
                message:
                  'Password change required before accessing the application',
                code: 'FORCE_PASSWORD_CHANGE',
              });
            }
          },
          ...(isOneSessionPerUser
            ? {
                async after(session, context) {
                  if (!context) return;
                  const allSessions =
                    await context.context.internalAdapter.listSessions(
                      session.userId
                    );
                  for (const s of allSessions) {
                    if (s.id !== session.id) {
                      await context.context.internalAdapter.deleteSession(s.id);
                    }
                  }
                },
              }
            : {}),
        },
      },
    },

    plugins: [
      admin({roles: heimdallRoles}),
      bearer(),
      passwordPolicy(),
      customSession(async ({user, session}) => ({
        user: {
          ...user,
          forcePasswordChange:
            (user as {forcePasswordChange?: boolean}).forcePasswordChange ??
            false,
        },
        session,
      })),
      organization(),
      sso() as BetterAuthPlugin,
      twoFactor({
        issuer: e.TWO_FACTOR_ISSUER,
        backupCodeOptions: {
          length: 10,
        },
      }),
      ...(e.API_KEY_SECRET
        ? [apiKey({keyExpiration: {defaultExpiresIn: e.API_KEY_DEFAULT_EXPIRY_DAYS}}) as BetterAuthPlugin]
        : []),
      ...(isProduction ? [] : [openAPI()]),
      ...(oauthConfigs.length > 0
        ? [genericOAuth({config: oauthConfigs})]
        : []),
      ...(ldapConfig ? [ldap(ldapConfig)] : []),
    ],
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
