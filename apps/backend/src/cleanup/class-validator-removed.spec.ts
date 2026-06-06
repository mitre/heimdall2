import {describe, it, expect} from 'vitest';
import {execSync} from 'child_process';

describe('legacy dependency removal', () => {
  it('zero imports of the old validation library in backend src', () => {
    const result = execSync(
      'grep -rn "from .class-validator" apps/backend/src/ --include="*.ts" | grep -v node_modules | grep -v ".spec.ts" || true',
      {encoding: 'utf-8'},
    );
    expect(result.trim()).toBe('');
  });

  it('zero imports of the old transformer library in backend src', () => {
    const result = execSync(
      'grep -rn "from .class-transformer" apps/backend/src/ --include="*.ts" | grep -v node_modules | grep -v ".spec.ts" || true',
      {encoding: 'utf-8'},
    );
    expect(result.trim()).toBe('');
  });

  it('zero imports of heimdall common interfaces in backend src', () => {
    const result = execSync(
      'grep -rn "@heimdall/common/interfaces" apps/backend/src/ --include="*.ts" | grep -v node_modules | grep -v ".spec.ts" || true',
      {encoding: 'utf-8'},
    );
    expect(result.trim()).toBe('');
  });
});
