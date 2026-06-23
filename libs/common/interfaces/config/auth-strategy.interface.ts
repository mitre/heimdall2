export const AUTH_STRATEGY = {
  GITHUB: 'github',
  GITLAB: 'gitlab',
  GOOGLE: 'google',
  LDAP: 'ldap',
  LOCAL: 'local',
  OIDC: 'oidc',
  OKTA: 'okta',
  SAML: 'saml',
} as const;

export const AUTH_STRATEGIES = [
  AUTH_STRATEGY.LOCAL,
  AUTH_STRATEGY.LDAP,
  AUTH_STRATEGY.GITHUB,
  AUTH_STRATEGY.GITLAB,
  AUTH_STRATEGY.GOOGLE,
  AUTH_STRATEGY.OKTA,
  AUTH_STRATEGY.OIDC,
  AUTH_STRATEGY.SAML,
] as const;

export type AuthStrategy = (typeof AUTH_STRATEGIES)[number];

export type ExternalAuthStrategy = Exclude<
  AuthStrategy,
  typeof AUTH_STRATEGY.LOCAL
>;
