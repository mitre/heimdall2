import fs from 'fs';
import path from 'path';
import {
  ChecklistJsonixConverter,
  ChecklistObject
} from '../../../src/ckl-mapper/checklist-jsonix-converter';
import {jsonixMapping} from '../../../src/ckl-mapper/jsonixMapping';
import {Checklist} from '../../../src/ckl-mapper/checklistJsonix';
import 'jest-xml-matcher';

describe('ChecklistJsonixConverter', () => {
  let converter: ChecklistJsonixConverter;

  beforeAll(() => {
    converter = new ChecklistJsonixConverter(jsonixMapping);
  });

  it('should convert XML/CKL to Jsonix Object', () => {
    const input: string = fs.readFileSync(
      path.join(
        'sample_jsons/checklist-jsonix-converter/sample_input_report/RHEL8V1R3.ckl'
      ),
      {encoding: 'utf-8'}
    );

    const expected: Checklist = JSON.parse(
      fs.readFileSync(
        'sample_jsons/checklist-jsonix-converter/checklist_jsonix_data.json',
        {encoding: 'utf-8'}
      )
    );

    const actual = converter.toJsonix(input);

    expect(actual).toEqual(expected);
  });

  it('should convert Jsonix Object to Intermediate Checklist Object', () => {
    const input: Checklist = JSON.parse(
      fs.readFileSync(
        'sample_jsons/checklist-jsonix-converter/sample_input_report/checklist_jsonix_data.json',
        {encoding: 'utf-8'}
      )
    );

    const expected: ChecklistObject = JSON.parse(
      fs.readFileSync(
        'sample_jsons/checklist-jsonix-converter/checklist_intermediate_object.json',
        {encoding: 'utf-8'}
      )
    );

    const actual = converter.toIntermediateObject(input);

    expect(actual).toEqual(expected);
  });

  it('should convert Intermediate Checklist Object to Jsonix Object', () => {
    const input: ChecklistObject = JSON.parse(
      fs.readFileSync(
        'sample_jsons/checklist-jsonix-converter/sample_input_report/checklist_intermediate_object.json',
        {encoding: 'utf-8'}
      )
    );

    const expected: Checklist = JSON.parse(
      fs.readFileSync(
        'sample_jsons/checklist-jsonix-converter/checklist_jsonix_data.json',
        {encoding: 'utf-8'}
      )
    );

    const actual = converter.fromIntermediateObject(input);

    expect(actual).toEqual(expected);
  });

  it('should convert Jsonix Object to XML/CKL', () => {
    const input: Checklist = JSON.parse(
      fs.readFileSync(
        path.join(
          'sample_jsons/checklist-jsonix-converter/sample_input_report/checklist_jsonix_data.json'
        ),
        {encoding: 'utf-8'}
      )
    );

    const expected: string = fs.readFileSync(
      'sample_jsons/checklist-jsonix-converter/RHEL8V1R3.ckl',
      {encoding: 'utf-8'}
    );
    const actual = converter.fromJsonix(input);

    expect(actual).toEqualXML(expected);
  });
});
