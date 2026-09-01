import authStrategyDefinitions from './auth-strategy.json';

type AuthStrategyKey = keyof typeof authStrategyDefinitions.strategies;
export type AuthStrategy = Lowercase<AuthStrategyKey>;
export const AUTH_STRATEGY = authStrategyDefinitions.strategies as {
  readonly [Key in AuthStrategyKey]: Lowercase<Key>;
};
export const AUTH_STRATEGIES = Object.values(AUTH_STRATEGY) as readonly AuthStrategy[];
export const OAUTH_AUTH_STRATEGIES =
  authStrategyDefinitions.oauthStrategies as readonly AuthStrategy[];

export type ExternalAuthStrategy = Exclude<
  AuthStrategy,
  typeof AUTH_STRATEGY.LOCAL
>;
