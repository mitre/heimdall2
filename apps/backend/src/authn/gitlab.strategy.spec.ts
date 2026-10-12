import { Test } from '@nestjs/testing';
import mock, { load, restore } from 'mock-fs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  GITLAB_CANONICAL_SECRET_ENV,
  GITLAB_LEGACY_SECRET_ENV,
} from '../../test/constants/environment_test.constant';
import { ConfigService } from '../config/config.service';
import { AuthnService } from './authn.service';
import { GitlabStrategy } from './gitlab.strategy';

// The ConfigService unit tests prove getGitlabClientSecret resolves both
// spellings. These prove the STRATEGY asks for it — without them, reverting
// gitlab.strategy.ts to configService.get('GITLAB_SECRET') would leave every
// resolution test green while GitLab OAuth stayed broken for anyone who
// configured GITLAB_CLIENTSECRET from the documentation.
// passport-oauth2 hands the credential to its node-oauth client, which stores it
// as _clientSecret. Reading it is the only way to prove the resolved value
// reached passport rather than merely being computed. passport-gitlab2 ships no
// type definitions, so this needs no type assertion to reach.
function clientSecretGivenToPassport(strategy: GitlabStrategy): unknown {
  return strategy._oauth2?._clientSecret;
}

async function buildStrategy(environmentFile: string): Promise<{
  resolveSpy: ReturnType<typeof vi.spyOn>;
  strategy: GitlabStrategy;
}> {
  mock({ '.env': environmentFile, node_modules: load('node_modules') });
  const configService = new ConfigService();
  const resolveSpy = vi.spyOn(configService, 'getGitlabClientSecret');
  const moduleReference = await Test.createTestingModule({
    providers: [
      GitlabStrategy,
      { provide: ConfigService, useValue: configService },
      { provide: AuthnService, useValue: {} },
    ],
  }).compile();
  return { resolveSpy, strategy: moduleReference.get(GitlabStrategy) };
}

describe('GitlabStrategy', () => {
  beforeAll(() => {
    console.log();
  });

  afterAll(() => {
    restore();
  });

  it('should pass the canonical secret to passport as clientSecret', async () => {
    const { resolveSpy, strategy } = await buildStrategy(
      GITLAB_CANONICAL_SECRET_ENV,
    );
    expect(strategy).toBeInstanceOf(GitlabStrategy);
    expect(resolveSpy).toHaveBeenCalledTimes(1);
    expect(resolveSpy).toHaveReturnedWith('canonical-secret');
    // Asserting the RESOLVED VALUE ARRIVED, not merely that the getter ran.
    // Without this, a mutation routing the secret to a different option key
    // (clientID, say) leaves the spy assertions above green while GitLab OAuth
    // is broken. passport-oauth2 keeps the credential on its OAuth2 client.
    expect(clientSecretGivenToPassport(strategy)).toEqual('canonical-secret');
  });

  it('should pass the legacy GITLAB_SECRET to passport as clientSecret', async () => {
    const { resolveSpy, strategy } = await buildStrategy(
      GITLAB_LEGACY_SECRET_ENV,
    );
    expect(resolveSpy).toHaveReturnedWith('legacy-secret');
    expect(clientSecretGivenToPassport(strategy)).toEqual('legacy-secret');
  });
});
