import * as fs from 'fs';
import {ContextualizedEvaluation, ContextualizedProfile} from './context';
import {
  ConversionResult,
  convertFile,
  convertFileContextual,
  isContextualizedEvaluation,
  isContextualizedProfile
} from './fileparse';

it('correctly reads the contents of the given files', () => {
  expect.assertions(26);
  const filenames = fs.readdirSync('parse_testbed/');
  expect(() => {
    filenames.forEach((filename) => {
      const content = fs.readFileSync('parse_testbed/' + filename, 'utf-8');
      const result: ConversionResult = convertFile(content);
      expect(result).toHaveProperty('1_0_ExecJson');
    });
  }).not.toThrow(Error);
});

it('checks file files are contextualized evaluations', () => {
  expect.assertions(26);
  const filenames = fs.readdirSync('parse_testbed/');
  expect(() => {
    filenames.forEach((filename) => {
      const content = fs.readFileSync('parse_testbed/' + filename, 'utf-8');
      const result: ContextualizedEvaluation | ContextualizedProfile =
        convertFileContextual(content);
      const isContextEval = isContextualizedEvaluation(result);
      expect(isContextEval).toEqual(true);
    });
  }).not.toThrow(Error);
});

it('checks file files are not contextualized evaluations', () => {
  expect.assertions(26);
  const filenames = fs.readdirSync('parse_testbed/');
  expect(() => {
    filenames.forEach((filename) => {
      const content = fs.readFileSync('parse_testbed/' + filename, 'utf-8');
      const result: ContextualizedEvaluation | ContextualizedProfile =
        convertFileContextual(content);
      const isContextEval = isContextualizedProfile(result);
      expect(isContextEval).toEqual(false);
    });
  }).not.toThrow(Error);
});
