import { describe, expect, it } from 'vitest';
import type { ConfigService } from '../config/config.service';
import type { AuthnService } from './authn.service';
import { GoogleStrategy } from './google.strategy';

// passport-oauth2 keeps the configured callback on the instance; that value is
// what this test is about.
type ConfiguredStrategy = { _callbackURL: string };

function strategyFor(externalUrl: string): ConfiguredStrategy {
  const configService = {
    getExternalUrl: () => externalUrl,
    get: () => 'test-value',
  } as unknown as ConfigService;

  return new GoogleStrategy(
    {} as AuthnService,
    configService,
  ) as unknown as ConfiguredStrategy;
}

describe('GoogleStrategy callback URL', () => {
  it('builds the callback from the external URL when one is configured', () => {
    expect(strategyFor('https://heimdall.example.org')._callbackURL).toBe(
      'https://heimdall.example.org/authn/google/callback',
    );
  });

  // The callback used to be built inside a template literal followed by
  // `|| 'disabled'`. A template literal is always truthy, so that fallback
  // could never fire and an unset EXTERNAL_URL produced a bare path — unlike
  // clientID and clientSecret, which do fall back to the placeholder.
  it('falls back to the disabled placeholder when no external URL is set', () => {
    expect(strategyFor('')._callbackURL).toBe('disabled');
  });
});
