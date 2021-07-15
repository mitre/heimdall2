import * as fs from 'fs';
import {ConversionResult, convertFile} from '../fileparse';
import {statusCounts} from './status_counts';

test('Returns proper status counts for sample file in parse_testbed', () => {
  const content = fs.readFileSync(
    'parse_testbed/aws-ami-results.json',
    'utf-8'
  );
  const result: ConversionResult = convertFile(content);
  if (result['1_0_ExecJson'] !== undefined) {
    expect(statusCounts.count_exec_1_0(result['1_0_ExecJson'])).toEqual({
      'From Profile': 0,
      'Not Applicable': 0,
      'Not Reviewed': 6,
      'Profile Error': 2,
      Failed: 28,
      Passed: 16
    });
  }
});
