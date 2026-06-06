import {describe, expect, it} from 'vitest';
import {CheckovMapper} from '../../../src/checkov-mapper';
import {omitVersions, readSample} from '../../utils';

describe('checkov_mapper', () => {
  describe('checkov_json', () => {
    it('Successfully converts a terraform_plan scan', () => {
    const mapper = new CheckovMapper(
      readSample('checkov_mapper/sample_input_report/checkov_json.json')
    );

      const expected = JSON.parse(
        readSample('checkov_mapper/checkov_json-hdf.json')
      );
      expect(omitVersions(mapper.toHdf())).toEqual(omitVersions(expected));
    });
  });

  describe('checkov_json withRaw', () => {
    it('Successfully converts a terraform_plan scan - withraw', () => {

    const mapper = new CheckovMapper(
      readSample('checkov_mapper/sample_input_report/checkov_json.json'),
      true
    );

      const expected = JSON.parse(
        readSample('checkov_mapper/checkov_json-withraw-hdf.json')
      );
      expect(omitVersions(mapper.toHdf())).toEqual(omitVersions(expected));
    });
  });


  describe('checkov_sample', () => {
    it('Successfully converts a terraform scan', () => {
    const mapper = new CheckovMapper(
      readSample('checkov_mapper/sample_input_report/checkov_sample.json')
    );

      const expected = JSON.parse(
        readSample('checkov_mapper/checkov_sample-hdf.json')
      );
      expect(omitVersions(mapper.toHdf())).toEqual(omitVersions(expected));
    });
  });

  describe('checkov_with_skips', () => {
    it('Successfully converts a terraform scan containing skipped checks and parsing errors', () => {
    const mapper = new CheckovMapper(
      readSample('checkov_mapper/sample_input_report/checkov_with_skips.json')
    );

      const expected = JSON.parse(
        readSample('checkov_mapper/checkov_with_skips-hdf.json')
      );
      expect(omitVersions(mapper.toHdf())).toEqual(omitVersions(expected));
    });
  });

  describe('checkov_synthetic', () => {
    it('Successfully converts a synthetic terraform scan containing all code paths — severity, skipped, parsing errors', () => {
    const mapper = new CheckovMapper(
      readSample('checkov_mapper/sample_input_report/checkov_synthetic.json')
    );

      const expected = JSON.parse(
        readSample('checkov_mapper/checkov_synthetic-hdf.json')
      );
      expect(omitVersions(mapper.toHdf())).toEqual(omitVersions(expected));
    });
  });
});
