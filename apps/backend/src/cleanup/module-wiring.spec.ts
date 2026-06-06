import {readFileSync} from 'node:fs';
import {describe, it, expect} from 'vitest';

function readSource(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf-8');
}

describe('Module wiring cleanup', () => {
  it('ApiKeysModule has no SequelizeModule imports', () => {
    const source = readSource('../apikeys/apikeys.module.ts');
    expect(source).not.toContain('SequelizeModule');
  });

  it('APIKeyDto does not import Sequelize ApiKey model', () => {
    const source = readSource('../apikeys/dto/apikey.dto.ts');
    expect(source).not.toContain('apikey.model');
  });

  it('EvaluationsModule imports AuthzModule', () => {
    const source = readSource('../evaluations/evaluations.module.ts');
    expect(source).toContain('AuthzModule');
  });

  it('EvaluationTagsModule has no SequelizeModule imports', () => {
    const source = readSource('../evaluation-tags/evaluation-tags.module.ts');
    expect(source).not.toContain('SequelizeModule');
  });
});
