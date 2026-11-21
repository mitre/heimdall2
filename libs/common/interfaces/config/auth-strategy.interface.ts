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

export type AuthStrategy = (typeof AUTH_STRATEGY)[keyof typeof AUTH_STRATEGY];
export const AUTH_STRATEGIES = Object.values(AUTH_STRATEGY);
export const OAUTH_AUTH_STRATEGIES: AuthStrategy[] = [
  AUTH_STRATEGY.GITHUB,
  AUTH_STRATEGY.GITLAB,
  AUTH_STRATEGY.GOOGLE,
  AUTH_STRATEGY.OIDC,
  AUTH_STRATEGY.OKTA,
];
export type ExternalAuthStrategy = Exclude<AuthStrategy, typeof AUTH_STRATEGY.LOCAL>;
