export const AUTH_STRATEGIES = [
  'local',
  'ldap',
  'github',
  'gitlab',
  'google',
  'okta',
  'oidc',
  'saml',
] as const;

export type AuthStrategy = (typeof AUTH_STRATEGIES)[number];

export type ExternalAuthStrategy = Exclude<AuthStrategy, 'local'>;
