import {describe, it, expect} from 'vitest';
import {execSync} from 'child_process';

const FILES_TO_CHECK = [
  'src/app.controller.ts',
  'src/token/token.providers.ts',
  'src/filters/authentication-exception.filter.ts',
  'src/interceptors/logging.interceptor.ts',
  'src/evaluations/evaluations.controller.ts',
  'src/users/users.controller.ts',
  'src/guards/api-keys-enabled.guard.ts',
  'src/evaluations/evaluations.module.ts',
  'src/evaluation-tags/evaluation-tags.module.ts',
  'src/groups/groups.module.ts',
  'src/statistics/statistics.module.ts',
];

describe('ConfigService retirement', () => {
  for (const file of FILES_TO_CHECK) {
    it(`${file} does not import ConfigService`, () => {
      const result = execSync(
        `grep -n "ConfigService\\|ConfigModule\\|config.service\\|config.module" apps/backend/${file} || true`,
        {encoding: 'utf-8'},
      );
      expect(result.trim()).toBe('');
    });
  }
});
