import * as fs from 'fs';
import { describe, expect, it } from 'vitest';
import type { ContextualizedEvaluation, ContextualizedProfile } from './context';
import type { ConversionResult } from './fileparse';
import {
  convertFile,
  convertFileContextual,
  isContextualizedEvaluation,
  isContextualizedProfile,
} from './fileparse';

const testbed = 'parse_testbed/';

describe.sequential('fileparse', () => {
  it('correctly reads the contents of the given files', () => {
    expect.assertions(27);
    const filenames = fs.readdirSync(testbed);
    expect(() => {
      for (const filename of filenames) {
        const content = fs.readFileSync(testbed + filename, 'utf8');
        const result: ConversionResult = convertFile(content);
        expect(result).toHaveProperty('1_0_ExecJson');
      }
    }).not.toThrow(Error);
  });

  it('checks file files are contextualized evaluations', () => {
    expect.assertions(27);
    const filenames = fs.readdirSync(testbed);
    expect(() => {
      for (const filename of filenames) {
        const content = fs.readFileSync(testbed + filename, 'utf8');
        const result: ContextualizedEvaluation | ContextualizedProfile
          = convertFileContextual(content);
        const isContextEval = isContextualizedEvaluation(result);
        expect(isContextEval).toEqual(true);
      }
    }).not.toThrow(Error);
  });

  it('checks file files are not contextualized evaluations', () => {
    expect.assertions(27);
    const filenames = fs.readdirSync(testbed);
    expect(() => {
      for (const filename of filenames) {
        const content = fs.readFileSync(testbed + filename, 'utf8');
        const result: ContextualizedEvaluation | ContextualizedProfile
          = convertFileContextual(content);
        const isContextEval = isContextualizedProfile(result);
        expect(isContextEval).toEqual(false);
      }
    }).not.toThrow(Error);
  });
});
