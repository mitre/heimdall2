import {describe, it, expect} from 'vitest';
import {execSync} from 'child_process';

describe('Module wiring cleanup', () => {
  it('ApiKeysModule has no SequelizeModule imports', () => {
    const result = execSync(
      'grep -n "SequelizeModule" apps/backend/src/apikeys/apikeys.module.ts || true',
      {encoding: 'utf-8'},
    );
    expect(result.trim()).toBe('');
  });

  it('APIKeyDto does not import Sequelize ApiKey model', () => {
    const result = execSync(
      'grep -n "apikey.model" apps/backend/src/apikeys/dto/apikey.dto.ts || true',
      {encoding: 'utf-8'},
    );
    expect(result.trim()).toBe('');
  });

  it('EvaluationsModule imports AuthzModule', () => {
    const result = execSync(
      'grep -n "AuthzModule" apps/backend/src/evaluations/evaluations.module.ts || true',
      {encoding: 'utf-8'},
    );
    expect(result.trim()).not.toBe('');
  });

  it('EvaluationTagsModule has no SequelizeModule imports', () => {
    const result = execSync(
      'grep -n "SequelizeModule" apps/backend/src/evaluation-tags/evaluation-tags.module.ts || true',
      {encoding: 'utf-8'},
    );
    expect(result.trim()).toBe('');
  });
});
