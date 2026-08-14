import {describe, expect, it} from 'vitest';
import {parseCsv} from '../src/base-converter';

describe('parseCsv', () => {
  it('Reports a malformed row as an Error carrying the parser errors', () => {
    let thrown: unknown;
    try {
      // One row with more fields than the header declares.
      parseCsv('a,b\n1,2,3');
    } catch (error) {
      thrown = error;
    }

    // Throwing the parser's raw error ARRAY gave callers a value with no
    // message and no stack; the details now ride along as the cause.
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toContain('Failed to parse CSV');
    expect((thrown as Error).cause).toBeDefined();
  });

  it('Returns the parsed rows when the input is well formed', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([{a: '1', b: '2'}]);
  });
});
