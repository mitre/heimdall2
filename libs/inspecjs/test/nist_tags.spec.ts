import * as fs from 'fs';
import {HDFControl, hdfWrapControl} from '../src';
import {ConversionResult, convertFile} from '../src/fileparse';

test('Returns proper status counts for sample file in parse_testbed', () => {
  const content = fs.readFileSync(
    'parse_testbed/rhel7-nist-string.json',
    'utf-8'
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
