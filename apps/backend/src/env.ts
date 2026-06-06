/* eslint-disable node/no-process-env */
// This is the ONLY file that may access process.env directly.
// All other files — including tests — must import env from this module.

import path from 'path';
import {config} from 'dotenv';
import {expand} from 'dotenv-expand';
import {z} from 'zod';

const backendDir = path.resolve(__dirname, '..');
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
expand(config({path: path.resolve(backendDir, envFile)}));

const EnvSchema = z
  .object({
    // Core
    NODE_ENV: z.enum(['development', 'production', 'test']),
    PORT: z.coerce.number().default(3000),

    // Database
    DATABASE_HOST: z.string().default('127.0.0.1'),
    DATABASE_PORT: z.coerce.number().default(5432),
    DATABASE_USERNAME: z.string().default('postgres'),
    DATABASE_PASSWORD: z.string().optional(),
    DATABASE_NAME: z.string().optional(),
    DATABASE_URL: z.string().optional(),
    DATABASE_SSL: z.string().optional(),
    DATABASE_SSL_INSECURE: z.string().optional(),
    DATABASE_SSL_KEY: z.string().optional(),
    DATABASE_SSL_CERT: z.string().optional(),
    DATABASE_SSL_CA: z.string().optional(),

    // Auth secrets
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    JWT_SECRET: z.string().min(32).optional(),
    // Default changed from 60s to 1d — the old 60s default was a known bug
    // (sessions expired before users could do anything)
    JWT_EXPIRE_TIME: z.string().default('1d'),
    API_KEY_SECRET: z.string().optional(),

    // Session & Security
    SESSION_EXPIRES_IN: z.coerce.number().default(86400),
    SESSION_COOKIE_CACHE_MAX_AGE: z.coerce.number().default(300),
    BCRYPT_COST: z.coerce.number().min(10).max(31).default(14),
    PASSWORD_MIN_LENGTH: z.coerce.number().min(1).default(15),
    COOKIE_PREFIX: z.string().default('heimdall'),
    API_KEY_DEFAULT_EXPIRY_DAYS: z.coerce.number().default(7),
    TWO_FACTOR_ISSUER: z.string().default('Heimdall'),

    // App
    EXTERNAL_URL: z.string().default('http://localhost:3000'),
    ADMIN_EMAIL: z.string().default('admin@heimdall.local'),
    ADMIN_PASSWORD: z.string().optional(),
    ADMIN_USES_EXTERNAL_AUTH: z.string().optional(),
    ADMIN_FORCE_PASSWORD_CHANGE: z.string().optional(),
    LOCAL_LOGIN_DISABLED: z.string().optional(),
    REGISTRATION_DISABLED: z.string().optional(),
    ONE_SESSION_PER_USER: z.string().optional(),
    MAX_FILE_UPLOAD_SIZE: z.coerce.number().default(50),
    MAX_BODY_SIZE_MB: z.coerce.number().default(50),
    SESSION_COOKIE_MAX_AGE_MS: z.coerce.number().default(3600000),

    // Rate Limiting
    RATE_LIMIT_ENABLED: z.string().optional(),
    RATE_LIMIT_WINDOW: z.coerce.number().default(60),
    RATE_LIMIT_MAX: z.coerce.number().default(20),
    RATE_LIMIT_LOGIN_WINDOW: z.coerce.number().default(60),
    RATE_LIMIT_LOGIN_MAX: z.coerce.number().default(5),
    RATE_LIMIT_SIGNUP_WINDOW: z.coerce.number().default(300),
    RATE_LIMIT_SIGNUP_MAX: z.coerce.number().default(3),

    // UI
    CLASSIFICATION_BANNER_TEXT: z.string().optional(),
    CLASSIFICATION_BANNER_TEXT_COLOR: z.string().optional(),
    CLASSIFICATION_BANNER_COLOR: z.string().optional(),
    WARNING_BANNER: z.string().optional(),

    // GitHub OAuth
    GITHUB_CLIENTID: z.string().optional(),
    GITHUB_CLIENTSECRET: z.string().optional(),
    GITHUB_ENTERPRISE_INSTANCE_BASE_URL: z.string().optional(),
    GITHUB_ENTERPRISE_INSTANCE_API_URL: z.string().optional(),

    // GitLab OAuth
    GITLAB_CLIENTID: z.string().optional(),
    GITLAB_CLIENTSECRET: z.string().optional(),
    GITLAB_BASEURL: z.string().optional(),

    // Google OAuth
    GOOGLE_CLIENTID: z.string().optional(),
    GOOGLE_CLIENTSECRET: z.string().optional(),

    // Okta OIDC
    OKTA_CLIENTID: z.string().optional(),
    OKTA_CLIENTSECRET: z.string().optional(),
    OKTA_DOMAIN: z.string().optional(),
    OKTA_ISSUER_URL: z.string().optional(),

    // Generic OIDC (discovery-based — replaces legacy OIDC_AUTHORIZATION_URL/TOKEN_URL/USER_INFO_URL)
    OIDC_NAME: z.string().optional(),
    OIDC_ISSUER: z.string().optional(),
    OIDC_CLIENTID: z.string().optional(),
    OIDC_CLIENT_SECRET: z.string().optional(),
    OIDC_EXTERNAL_GROUPS: z.string().optional(),

    // LDAP
    LDAP_ENABLED: z.string().optional(),
    LDAP_HOST: z.string().optional(),
    LDAP_PORT: z.coerce.number().optional(),
    LDAP_BINDDN: z.string().optional(),
    LDAP_PASSWORD: z.string().optional(),
    LDAP_SEARCHBASE: z.string().optional(),
    LDAP_SEARCHFILTER: z.string().optional(),
    LDAP_NAMEFIELD: z.string().default('name'),
    LDAP_MAILFIELD: z.string().default('mail'),
    LDAP_SSL: z.string().optional(),
    LDAP_SSL_CA: z.string().optional(),
    LDAP_SSL_INSECURE: z.string().optional(),

    // External services
    SPLUNK_HOST_URL: z.string().optional(),
    TENABLE_HOST_URL: z.string().optional(),
    FORCE_TENABLE_FRONTEND: z.string().optional(),

    // Testing
    CYPRESS_TESTING: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const addError = (path: string, message: string) =>
      ctx.addIssue({code: z.ZodIssueCode.custom, path: [path], message});

    const requireHttps = (value: string | undefined, name: string) => {
      if (value && !value.startsWith('https://')) {
        addError(name, `${name} must use HTTPS in production (got: ${value.split('/')[0]}//...)`);
      }
    };

    // Auth secret required in all environments except test
    if (data.NODE_ENV !== 'test' && !data.BETTER_AUTH_SECRET && !data.JWT_SECRET) {
      addError(
        'BETTER_AUTH_SECRET',
        'BETTER_AUTH_SECRET or JWT_SECRET must be set. Generate with: openssl rand -hex 64'
      );
    }

    if (data.NODE_ENV === 'production') {
      // Production-only requirements
      if (!data.DATABASE_PASSWORD) {
        addError('DATABASE_PASSWORD', 'DATABASE_PASSWORD must be set in production');
      }
      if (!data.EXTERNAL_URL || data.EXTERNAL_URL === 'http://localhost:3000') {
        addError('EXTERNAL_URL', 'EXTERNAL_URL must be explicitly set in production (not the default)');
      }

      // HTTPS enforcement for all OAuth/OIDC/external URLs in production
      requireHttps(data.OIDC_ISSUER, 'OIDC_ISSUER');
      requireHttps(data.GITLAB_BASEURL, 'GITLAB_BASEURL');
      requireHttps(data.OKTA_DOMAIN, 'OKTA_DOMAIN');
      requireHttps(data.OKTA_ISSUER_URL, 'OKTA_ISSUER_URL');
      requireHttps(data.GITHUB_ENTERPRISE_INSTANCE_BASE_URL, 'GITHUB_ENTERPRISE_INSTANCE_BASE_URL');
      requireHttps(data.GITHUB_ENTERPRISE_INSTANCE_API_URL, 'GITHUB_ENTERPRISE_INSTANCE_API_URL');
      requireHttps(data.EXTERNAL_URL, 'EXTERNAL_URL');

      // SSL insecure warning
      if (data.DATABASE_SSL_INSECURE?.toLowerCase() === 'true') {
        console.warn(
          'WARNING: DATABASE_SSL_INSECURE=true in production disables TLS certificate validation. ' +
            'This allows man-in-the-middle attacks. Set DATABASE_SSL_CA instead.'
        );
      }

      // API_KEY_SECRET warning
      if (data.API_KEY_SECRET === undefined) {
        console.warn(
          'WARNING: API_KEY_SECRET is not set. API key authentication is disabled.'
        );
      }
    }

    // Okta: domain required when clientId is set (any environment)
    if (data.OKTA_CLIENTID && !data.OKTA_DOMAIN && !data.OKTA_ISSUER_URL) {
      addError(
        'OKTA_DOMAIN',
        'OKTA_DOMAIN or OKTA_ISSUER_URL must be set when OKTA_CLIENTID is configured'
      );
    }
  });

export type Env = z.infer<typeof EnvSchema>;
export {EnvSchema};

export function validateEnv(
  input: Record<string, string | undefined> = process.env
): Env {
  const parsed = EnvSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const message = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${(msgs || []).join(', ')}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${message}`);
  }
  return parsed.data;
}

let env: Env;
try {
  env = validateEnv();
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}

export default env;

export function isProductionMode(): boolean {
  return env.NODE_ENV === 'production';
}

export function isLocalLoginAllowed(): boolean {
  return env.LOCAL_LOGIN_DISABLED?.toLowerCase() !== 'true';
}

export function isRegistrationAllowed(): boolean {
  return env.REGISTRATION_DISABLED?.toLowerCase() !== 'true';
}

const SUPPORTED_OAUTH = ['github', 'gitlab', 'google', 'okta', 'oidc'] as const;

export function enabledOauthStrategies(): string[] {
  return SUPPORTED_OAUTH.filter((strategy) => {
    const key = `${strategy.toUpperCase()}_CLIENTID` as keyof Env;
    return Boolean(env[key]);
  });
}

export function frontendStartupSettings() {
  return {
    apiKeysEnabled: Boolean(env.API_KEY_SECRET),
    banner: env.WARNING_BANNER ?? '',
    classificationBannerColor: env.CLASSIFICATION_BANNER_COLOR ?? 'red',
    classificationBannerText: env.CLASSIFICATION_BANNER_TEXT ?? '',
    classificationBannerTextColor: env.CLASSIFICATION_BANNER_TEXT_COLOR ?? 'white',
    enabledOAuth: enabledOauthStrategies(),
    externalUrl: env.EXTERNAL_URL,
    oidcName: env.OIDC_NAME ?? '',
    ldap: env.LDAP_ENABLED?.toLowerCase() === 'true',
    registrationEnabled: isRegistrationAllowed(),
    localLoginEnabled: isLocalLoginAllowed(),
    tenableHostUrl: env.TENABLE_HOST_URL ?? '',
    forceTenableFrontend: env.FORCE_TENABLE_FRONTEND?.toLowerCase() === 'true',
    splunkHostUrl: env.SPLUNK_HOST_URL ?? '',
  };
}

export const SENSITIVE_KEY_PATTERNS = [
  /cookie/i,
  /passw(or)?d/i,
  /^pw$/,
  /^pass$/i,
  /secret/i,
  /token/i,
  /api[-._]?key/i,
  /data/i,
];
