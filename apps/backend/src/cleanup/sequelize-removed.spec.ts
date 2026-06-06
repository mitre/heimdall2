import {describe, it, expect} from 'vitest';
import {execSync} from 'child_process';

describe('Sequelize removal', () => {
  it('no SequelizeModule imports in any production file', () => {
    const result = execSync(
      'grep -rn "SequelizeModule" apps/backend/src/ --include="*.ts" | grep -v node_modules | grep -v ".spec.ts" || true',
      {encoding: 'utf-8'},
    );
    expect(result.trim()).toBe('');
  });

  it('no @InjectModel decorators in any production file', () => {
    const result = execSync(
      'grep -rn "@InjectModel" apps/backend/src/ --include="*.ts" | grep -v node_modules | grep -v ".spec.ts" || true',
      {encoding: 'utf-8'},
    );
    expect(result.trim()).toBe('');
  });

  it('no sequelize-typescript imports in any production file', () => {
    const result = execSync(
      'grep -rn "from .sequelize-typescript" apps/backend/src/ --include="*.ts" | grep -v node_modules | grep -v ".spec.ts" || true',
      {encoding: 'utf-8'},
    );
    expect(result.trim()).toBe('');
  });

  it('no model files exist', () => {
    const result = execSync(
      'find apps/backend/src -name "*.model.ts" -not -path "*/node_modules/*" || true',
      {encoding: 'utf-8'},
    );
    expect(result.trim()).toBe('');
  });

  it('DatabaseModule directory does not exist', () => {
    const result = execSync(
      'ls apps/backend/src/database/database.module.ts 2>/dev/null || true',
      {encoding: 'utf-8'},
    );
    expect(result.trim()).toBe('');
  });
});
