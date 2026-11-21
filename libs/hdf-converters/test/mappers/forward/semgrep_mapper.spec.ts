import fs from 'fs';
import {ExecJSON} from 'inspecjs';
import {describe, expect, it} from 'vitest';
import {SemgrepMapper} from '../../../src/semgrep-mapper';
import {omitHDFTimes, omitVersions} from '../../utils';

function readSample(name: string): string {
  return fs.readFileSync(
    `sample_jsons/semgrep_mapper/sample_input_report/${name}.json`,
    {encoding: 'utf-8'}
  );
}

function readBaseline(name: string): unknown {
  return JSON.parse(
    fs.readFileSync(`sample_jsons/semgrep_mapper/${name}-hdf.json`, {
      encoding: 'utf-8'
    })
  );
}

describe('semgrep_mapper', () => {
  describe('semgrep_findings', () => {
    const mapper = new SemgrepMapper(readSample('semgrep_findings'));

    // Uncomment to regenerate the baseline, then re-comment before committing:
    // fs.writeFileSync(
    //   'sample_jsons/semgrep_mapper/semgrep_findings-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    it('should produce a valid HDF matching the regression baseline', () => {
      expect(omitHDFTimes(omitVersions(mapper.toHdf()))).toEqual(
        omitHDFTimes(omitVersions(readBaseline('semgrep_findings')))
      );
    });

    it('should map every rule to exactly one control', () => {
      const controls = mapper.toHdf().profiles[0].controls;
      const ids = controls.map((control) => control.id);
      expect(new Set(ids).size).toEqual(ids.length);
    });

    it('should resolve NIST tags from the rule CWE rather than the default', () => {
      const control = mapper
        .toHdf()
        .profiles[0].controls.find((c) =>
          c.id.includes('subprocess-shell-true')
        );
      expect(control?.tags.nist).toBeDefined();
      expect(control?.tags.cwe).toContain(
        "CWE-78: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')"
      );
    });

    it('should normalize owasp whether the rule supplies a string or an array', () => {
      const controls = mapper.toHdf().profiles[0].controls;
      for (const control of controls) {
        expect(Array.isArray(control.tags.owasp)).toBe(true);
      }
    });

    it('should rename semgrep metadata impact so it does not shadow HDF impact', () => {
      const control = mapper.toHdf().profiles[0].controls[0];
      expect(typeof control.impact).toEqual('number');
      expect(control.tags.impact).toBeUndefined();
      expect(control.tags.semgrep_impact).toBeDefined();
    });

    it('should emit refs as a flat array of url objects', () => {
      for (const control of mapper.toHdf().profiles[0].controls) {
        expect(Array.isArray(control.refs)).toBe(true);
        for (const ref of control.refs) {
          expect(Object.keys(ref)).toEqual(['url']);
          expect(typeof (ref as {url: string}).url).toEqual('string');
        }
      }
    });

    it('should not leak the redacted placeholder into results', () => {
      const serialized = JSON.stringify(mapper.toHdf());
      expect(serialized).not.toContain('requires login');
    });
  });

  describe('semgrep_findings withRaw', () => {
    const mapper = new SemgrepMapper(readSample('semgrep_findings'), true);

    // Uncomment to regenerate the baseline, then re-comment before committing:
    // fs.writeFileSync(
    //   'sample_jsons/semgrep_mapper/semgrep_findings-withraw-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    it('should include raw data in passthrough', () => {
      const hdf = mapper.toHdf() as ExecJSON.Execution & {
        passthrough: Record<string, unknown>;
      };
      expect(hdf.passthrough).toHaveProperty('raw');
      expect(hdf.passthrough).toHaveProperty('auxiliary_data');
    });

    it('should match the regression baseline', () => {
      expect(omitHDFTimes(omitVersions(mapper.toHdf()))).toEqual(
        omitHDFTimes(omitVersions(readBaseline('semgrep_findings-withraw')))
      );
    });
  });

  describe('semgrep_empty', () => {
    const mapper = new SemgrepMapper(readSample('semgrep_empty'));

    // Uncomment to regenerate the baseline, then re-comment before committing:
    // fs.writeFileSync(
    //   'sample_jsons/semgrep_mapper/semgrep_empty-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    it('should convert a scan with no findings without throwing', () => {
      expect(mapper.toHdf().profiles[0].controls).toEqual([]);
    });

    it('should match the regression baseline', () => {
      expect(omitHDFTimes(omitVersions(mapper.toHdf()))).toEqual(
        omitHDFTimes(omitVersions(readBaseline('semgrep_empty')))
      );
    });
  });

  describe('semgrep_errors', () => {
    const mapper = new SemgrepMapper(readSample('semgrep_errors'));

    // Uncomment to regenerate the baseline, then re-comment before committing:
    // fs.writeFileSync(
    //   'sample_jsons/semgrep_mapper/semgrep_errors-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    it('should surface scan errors as their own control', () => {
      const controls = mapper.toHdf().profiles[0].controls;
      const errorControl = controls.find(
        (control) => control.id === 'Semgrep Scan Errors'
      );
      expect(errorControl).toBeDefined();
      expect(errorControl?.results.length).toBeGreaterThan(0);
      expect(errorControl?.results[0].status).toEqual(
        ExecJSON.ControlResultStatus.Error
      );
    });

    it('should match the regression baseline', () => {
      expect(omitHDFTimes(omitVersions(mapper.toHdf()))).toEqual(
        omitHDFTimes(omitVersions(readBaseline('semgrep_errors')))
      );
    });
  });
});
