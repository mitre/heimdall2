import fs from 'fs';
import {describe, expect, it} from 'vitest';
import {CheckovMapper} from '../../../src/checkov-mapper';
import {omitVersions} from '../../utils';

describe('checkov_mapper', () => {
  describe('checkov_json', () => {
    it('Successfully converts a terraform_plan scan', () => {
    const mapper = new CheckovMapper(
      fs.readFileSync(
        'sample_jsons/checkov_mapper/sample_input_report/checkov_json.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/checkov_mapper/checkov_json-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

      const expected = JSON.parse(
        fs.readFileSync(
          'sample_jsons/checkov_mapper/checkov_json-hdf.json',
          {encoding: 'utf-8'}
        )
      );
      expect(omitVersions(mapper.toHdf())).toEqual(omitVersions(expected));
    });
  });

  describe('checkov_json withRaw', () => {
    it('Successfully converts a terraform_plan scan - withraw', () => {

    const mapper = new CheckovMapper(
      fs.readFileSync(
        'sample_jsons/checkov_mapper/sample_input_report/checkov_json.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/checkov_mapper/checkov_json-withraw-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

      const expected = JSON.parse(
        fs.readFileSync(
          'sample_jsons/checkov_mapper/checkov_json-withraw-hdf.json',
          {encoding: 'utf-8'}
        )
      );
      expect(omitVersions(mapper.toHdf())).toEqual(omitVersions(expected));
    });
  });


  describe('checkov_sample', () => {
    it('Successfully converts a terraform scan', () => {
    const mapper = new CheckovMapper(
      fs.readFileSync(
        'sample_jsons/checkov_mapper/sample_input_report/checkov_sample.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/checkov_mapper/checkov_sample-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

      const expected = JSON.parse(
        fs.readFileSync(
          'sample_jsons/checkov_mapper/checkov_sample-hdf.json',
          {encoding: 'utf-8'}
        )
      );
      expect(omitVersions(mapper.toHdf())).toEqual(omitVersions(expected));
    });
  });

  describe('checkov_with_skips', () => {
    it('Successfully converts a terraform scan containing skipped checks and parsing errors', () => {
    const mapper = new CheckovMapper(
      fs.readFileSync(
        'sample_jsons/checkov_mapper/sample_input_report/checkov_with_skips.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/checkov_mapper/checkov_with_skips-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

      const expected = JSON.parse(
        fs.readFileSync(
          'sample_jsons/checkov_mapper/checkov_with_skips-hdf.json',
          {encoding: 'utf-8'}
        )
      );
      expect(omitVersions(mapper.toHdf())).toEqual(omitVersions(expected));
    });
  });

  describe('checkov_synthetic', () => {
    it('Successfully converts a synthetic terraform scan containing all code paths — severity, skipped, parsing errors', () => {
    const mapper = new CheckovMapper(
      fs.readFileSync(
        'sample_jsons/checkov_mapper/sample_input_report/checkov_synthetic.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/checkov_mapper/checkov_synthetic-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

      const expected = JSON.parse(
        fs.readFileSync(
          'sample_jsons/checkov_mapper/checkov_synthetic-hdf.json',
          {encoding: 'utf-8'}
        )
      );
      expect(omitVersions(mapper.toHdf())).toEqual(omitVersions(expected));
    });
  });
});
