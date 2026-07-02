import * as fs from 'fs';
import { expect, it } from 'vitest';
import { contextualizeEvaluation } from './context';
import type { ConversionResult } from './fileparse';
import { convertFile } from './fileparse';

it('correctly detects an overlayed profile', () => {
  expect.assertions(3);
  const content = fs.readFileSync(
    'parse_testbed/aws-ami-results.json',
    'utf8',
  );
  const result: ConversionResult = convertFile(content);
  expect(result).toHaveProperty('1_0_ExecJson');
  expect(result['1_0_ExecJson']).toBeDefined();
  const contextualized = contextualizeEvaluation(result['1_0_ExecJson']!);
  expect(contextualized.contains.length).toBe(2);
});
