import * as fs from 'fs';
import {contextualizeEvaluation} from './context';
import {ConversionResult, convertFile} from './fileparse';

it('correctly detects an overlayed profile', () => {
  expect.assertions(3);
  const content = fs.readFileSync(
    'parse_testbed/aws-ami-results.json',
    'utf-8'
  );
  const result: ConversionResult = convertFile(content);
  expect(result).toHaveProperty('1_0_ExecJson');
  expect(() => {
    if (result['1_0_ExecJson'] !== undefined) {
      const contextualized = contextualizeEvaluation(result['1_0_ExecJson'], [""]);
      expect(contextualized.contains.length).toBe(2);
    }
  }).not.toThrow(Error);
});
