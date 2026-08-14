import * as fs from 'fs';
import {expect, test} from 'vitest';
import type {HDFControl} from '../src';
import { hdfWrapControl} from '../src';
import type {ConversionResult} from '../src/fileparse';
import { convertFile} from '../src/fileparse';

test('Returns proper status counts for sample file in parse_testbed', () => {
  const content = fs.readFileSync(
    'parse_testbed/rhel7-nist-string.json',
    'utf8'
  );
  const result: ConversionResult = convertFile(content);
  const execJson = result['1_0_ExecJson'];
  // Throw rather than assert inside the narrowing check: a fixture that stopped
  // converting would otherwise pass this test without asserting anything.
  if (execJson === undefined) {
    throw new TypeError('Expected the fixture to convert to a 1.0 ExecJson');
  }

  // Get all controls
  const controls: HDFControl[] = execJson.profiles.flatMap((p) =>
    p.controls.map((c) => hdfWrapControl(c))
  );
  expect(controls[0].rawNistTags).toEqual(['AC-17 (2)']);
});
