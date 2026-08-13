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
  if (result['1_0_ExecJson'] !== undefined) {
    const controls: HDFControl[] = [];
    // Get all controls
    result['1_0_ExecJson'].profiles.forEach((p) =>
      controls.push(...p.controls.map((c) => hdfWrapControl(c)))
    );
    expect(controls[0].rawNistTags).toEqual(['AC-17 (2)']);
  }
});
