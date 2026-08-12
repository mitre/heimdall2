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

  it('should resolve its client secret through getGitlabClientSecret', async () => {
    const { resolveSpy, strategy } = await buildStrategy(
      GITLAB_CANONICAL_SECRET_ENV,
    );
    expect(strategy).toBeInstanceOf(GitlabStrategy);
    expect(resolveSpy).toHaveBeenCalledTimes(1);
    expect(resolveSpy).toHaveReturnedWith('canonical-secret');
  });

  it('should resolve the legacy GITLAB_SECRET through the same path', async () => {
    const { resolveSpy } = await buildStrategy(GITLAB_LEGACY_SECRET_ENV);
    expect(resolveSpy).toHaveReturnedWith('legacy-secret');
  });
});
