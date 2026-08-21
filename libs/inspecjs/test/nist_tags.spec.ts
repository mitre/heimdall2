import * as fs from 'fs';
import { expect, test } from 'vitest';
import { type HDFControl, hdfWrapControl } from '../src';
import { type ConversionResult, convertFile } from '../src/fileparse';

test('Returns proper status counts for sample file in parse_testbed', () => {
  const content = fs.readFileSync(
    'parse_testbed/rhel7-nist-string.json',
    'utf8',
  );
  const result: ConversionResult = convertFile(content);
  expect(result['1_0_ExecJson']).toBeDefined();
  const controls: HDFControl[] = [];
  const profiles = result['1_0_ExecJson']!.profiles;
  for (const p of profiles) {
    controls.push(...p.controls.map(c => hdfWrapControl(c)));
  }
  expect(controls[0].rawNistTags).toEqual(['AC-17 (2)']);
});
