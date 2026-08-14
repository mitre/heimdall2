import {valueToSeverity} from '@/store/search';
import {describe, expect, it} from 'vitest';

describe('valueToSeverity', () => {
  it('accepts a known severity whatever its case', () => {
    expect(valueToSeverity('high')).toBe('high');
    expect(valueToSeverity('HIGH')).toBe('high');
  });

  it('falls back to none for a value that is not a severity', () => {
    expect(valueToSeverity('not-a-severity')).toBe('none');
  });
});
