import fs from 'fs';
import {describe, expect, it} from 'vitest';
import {SarifMapper} from '../../../src/sarif-mapper';
import {omitVersions} from '../../utils';

describe('sarif_mapper', () => {
  it('Successfully converts Sarif data', () => {
    const mapper = new SarifMapper(
      fs.readFileSync(
        'sample_jsons/sarif_mapper/sample_input_report/sarif_input.sarif',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/sarif_mapper/sarif-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/sarif_mapper/sarif-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});
describe('sarif_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Sarif data', () => {
    const mapper = new SarifMapper(
      fs.readFileSync(
        'sample_jsons/sarif_mapper/sample_input_report/sarif_input.sarif',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/sarif_mapper/sarif-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/sarif_mapper/sarif-hdf-withraw.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});

describe('sarif_mapper CWE resolution', () => {
  function convert(sample: string, withRaw = false) {
    return new SarifMapper(
      fs.readFileSync(
        `sample_jsons/sarif_mapper/sample_input_report/${sample}`,
        {encoding: 'utf-8'}
      ),
      withRaw
    ).toHdf();
  }

  it('reads CWEs from rule relationships against a CWE taxonomy', () => {
    // flawfinder publishes them in rules[].relationships[].target.id, the
    // standards-blessed location, as well as in the message text.
    const control = convert('sarif_input.sarif').profiles[0].controls.find(
      (candidate) => candidate.id === 'FF1059'
    );
    expect(control?.tags.cwe).toEqual(
      expect.arrayContaining(['CWE-20', 'CWE-829'])
    );
  });

  it('reads CWEs from rule properties.tags', () => {
    // Semgrep publishes them as prose entries in the rule's tag list, and puts
    // nothing CWE-shaped in the result message.
    const control = convert('semgrep_sarif.sarif').profiles[0].controls[0];
    expect(control.tags.cwe).toEqual(['CWE-939']);
  });

  it('falls back to the result message when the rule carries no CWE', () => {
    const sarif = {
      version: '2.1.0',
      runs: [
        {
          tool: {driver: {name: 'Bare', rules: [{id: 'R1'}]}},
          results: [
            {
              ruleId: 'R1',
              level: 'error',
              message: {text: 'Something bad: happened (CWE-79).'},
              locations: []
            }
          ]
        }
      ]
    };
    const control = new SarifMapper(JSON.stringify(sarif)).toHdf().profiles[0]
      .controls[0];
    expect(control.tags.cwe).toEqual(['CWE-79']);
  });

  it('emits no CWE tags when neither the rule nor the message carries one', () => {
    const sarif = {
      version: '2.1.0',
      runs: [
        {
          tool: {driver: {name: 'Bare', rules: [{id: 'R1'}]}},
          results: [
            {
              ruleId: 'R1',
              level: 'note',
              message: {text: 'Prose with no identifier in it at all.'},
              locations: []
            }
          ]
        }
      ]
    };
    const control = new SarifMapper(JSON.stringify(sarif)).toHdf().profiles[0]
      .controls[0];
    // Previously the scrape returned a fragment of the prose as a "CWE".
    expect(control.tags.cwe).toEqual([]);
    // With nothing to map, the documented static-analysis defaults apply.
    expect(control.tags.nist).toEqual(['SA-11', 'RA-5']);
  });

  it('derives cci from the nist tags on the same control', () => {
    for (const control of convert('sarif_input.sarif').profiles[0].controls) {
      const nist = control.tags.nist as string[];
      const cci = control.tags.cci as string[];
      expect(Array.isArray(cci)).toBe(true);
      // SI-10 maps to CCI-001310; the previous implementation emitted the
      // default tags' CCIs regardless of what nist actually resolved to.
      if (nist.includes('SI-10')) {
        expect(cci).toContain('CCI-001310');
        expect(cci).not.toContain('CCI-003173');
      }
    }
  });
});
