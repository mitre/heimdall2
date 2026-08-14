import * as fs from 'fs';
import {expect, test} from 'vitest';
import type {ConversionResult} from '../src/fileparse';
import { convertFile} from '../src/fileparse';
import {statusCounts} from './status_counts';

test('Returns proper status counts for sample file in parse_testbed', () => {
  const content = fs.readFileSync(
    'parse_testbed/aws-ami-results.json',
    'utf8'
  );
  const result: ConversionResult = convertFile(content);
  const execJson = result['1_0_ExecJson'];
  // Throw rather than assert inside the narrowing check: a fixture that stopped
  // converting would otherwise pass this test without asserting anything.
  if (execJson === undefined) {
    throw new TypeError('Expected the fixture to convert to a 1.0 ExecJson');
  }

  expect(statusCounts.count_exec_1_0(execJson)).toEqual({
    'From Profile': 0,
    'Not Applicable': 0,
    'Not Reviewed': 6,
    'Profile Error': 2,
    Failed: 28,
    Passed: 16
  });
});
