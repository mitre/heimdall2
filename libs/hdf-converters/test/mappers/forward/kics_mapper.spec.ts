import fs from 'fs';
import {ExecJSON} from 'inspecjs';
import {describe, expect, it} from 'vitest';
import {KicsMapper, resolveControls} from '../../../src/kics-mapper';
import {omitHDFTimes, omitVersions} from '../../utils';

function readSample(name: string): string {
  return fs.readFileSync(
    `sample_jsons/kics_mapper/sample_input_report/${name}.json`,
    {encoding: 'utf-8'}
  );
}

/** Controls derived from findings, excluding the synthetic coverage record. */
function findingControls(mapper: KicsMapper) {
  return mapper
    .toHdf()
    .profiles[0].controls.filter((c) => c.id !== 'kics-scan-coverage');
}

function readBaseline(name: string): unknown {
  return JSON.parse(
    fs.readFileSync(`sample_jsons/kics_mapper/${name}-hdf.json`, {
      encoding: 'utf-8'
    })
  );
}

describe('kics_mapper', () => {
  describe('kics_findings', () => {
    const mapper = new KicsMapper(readSample('kics_findings'));

    // Uncomment to regenerate the baseline, then re-comment before committing:
    // fs.writeFileSync(
    //   'sample_jsons/kics_mapper/kics_findings-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    it('should produce a valid HDF matching the regression baseline', () => {
      expect(omitHDFTimes(omitVersions(mapper.toHdf()))).toEqual(
        omitHDFTimes(omitVersions(readBaseline('kics_findings')))
      );
    });

    it('should emit one control per query, keyed on the query id', () => {
      const ids = findingControls(mapper).map((c) => c.id);
      expect(new Set(ids).size).toEqual(ids.length);
      for (const id of ids) expect(id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should never assign impact 0, which would report Not Applicable', () => {
      for (const control of findingControls(mapper)) {
        expect(control.impact).toBeGreaterThan(0);
      }
    });

    it('should record why each NIST tag is what it is', () => {
      for (const control of findingControls(mapper)) {
        expect(['mapped', 'cwe-derived', 'static-fallback']).toContain(
          control.tags.nistMapping
        );
      }
    });

    it('should mark fallback tags as fallback rather than as a mapping', () => {
      for (const control of findingControls(mapper)) {
        const nist = control.tags.nist as string[];
        const isFallback = [...nist].sort().join() === ['RA-5', 'SA-11'].join();
        expect(control.tags.nistMapping).toEqual(
          isFallback ? 'static-fallback' : 'cwe-derived'
        );
      }
    });

    it('should keep the source CWE visible even when it does not resolve', () => {
      const unresolved = findingControls(mapper).filter(
        (c) => c.tags.nistMapping === 'static-fallback'
      );
      expect(unresolved.length).toBeGreaterThan(0);
      for (const control of unresolved) expect(control.tags.cwe).toBeTruthy();
    });

    it('should carry the remediation pair that KICS SARIF drops', () => {
      const messages = findingControls(mapper)
        .flatMap((c) => c.results)
        .map((r) => r.message ?? '');
      expect(messages.some((m) => m.includes('Expected:'))).toBe(true);
      expect(messages.some((m) => m.includes('Actual:'))).toBe(true);
      expect(messages.some((m) => m.includes('Issue type:'))).toBe(true);
    });

    it('should report every result as failed', () => {
      for (const control of findingControls(mapper)) {
        for (const result of control.results) {
          expect(result.status).toEqual(ExecJSON.ControlResultStatus.Failed);
        }
      }
    });

    it('should locate each finding by file', () => {
      const control = findingControls(mapper)[0];
      expect(control.results[0].code_desc).toContain('File:');
    });
  });

  describe('scan coverage control', () => {
    const mapper = new KicsMapper(readSample('kics_findings'));

    it('records the denominator KICS reports only in top-level counters', () => {
      const cov = mapper
        .toHdf()
        .profiles[0].controls.find((c) => c.id === 'kics-scan-coverage');
      expect(cov).toBeDefined();
      expect(cov!.tags.queries_executed as number).toBeGreaterThan(
        cov!.tags.queries_with_findings as number
      );
    });

    it('stays out of the compliance score', () => {
      const cov = mapper
        .toHdf()
        .profiles[0].controls.find((c) => c.id === 'kics-scan-coverage')!;
      // impact 0 reports Not Applicable, so scan context cannot skew the ratio
      expect(cov.impact).toEqual(0);
      expect(cov.results[0].status).toEqual(
        ExecJSON.ControlResultStatus.Passed
      );
    });

    it('says plainly that no passing controls can be derived', () => {
      const cov = mapper
        .toHdf()
        .profiles[0].controls.find((c) => c.id === 'kics-scan-coverage')!;
      expect(cov.desc).toContain('violations only');
      expect(cov.desc).toContain('should not be read as a pass rate');
    });

    it('is present even on a scan with no findings', () => {
      const empty = new KicsMapper(readSample('kics_zero_findings'));
      expect(
        empty
          .toHdf()
          .profiles[0].controls.some((c) => c.id === 'kics-scan-coverage')
      ).toBe(true);
    });
  });

  describe('control resolution precedence', () => {
    // The shipped table is intentionally empty until adjudication completes,
    // so the table tier is exercised with a stub rather than by shipping
    // unreviewed rows.
    const stub = {
      'query-in-table': {cci: ['CCI-000366'], nist: ['CM-6 b']}
    };

    it('prefers the reviewed per-query table over the CWE', () => {
      const resolved = resolveControls(
        {query_id: 'query-in-table', cwe: '311'},
        stub
      );
      expect(resolved.nist).toEqual(['CM-6 b']);
      expect(resolved.cci).toEqual(['CCI-000366']);
      expect(resolved.source).toEqual('mapped');
    });

    it('falls back to the CWE when the query is not in the table', () => {
      const resolved = resolveControls({query_id: 'absent', cwe: '311'}, stub);
      expect(resolved.source).toEqual('cwe-derived');
      expect(resolved.nist.length).toBeGreaterThan(0);
      expect(resolved.nist).not.toEqual(['SA-11', 'RA-5']);
    });

    it('falls back to the static defaults when the CWE does not resolve', () => {
      // CWE-778 is one of the 72 KICS uses that CweNistMappingData lacks
      const resolved = resolveControls({query_id: 'absent', cwe: '778'}, stub);
      expect(resolved.source).toEqual('static-fallback');
      expect(resolved.nist).toEqual(['SA-11', 'RA-5']);
    });

    it('falls back to the static defaults when the query carries no CWE', () => {
      const resolved = resolveControls({query_id: 'absent'}, stub);
      expect(resolved.source).toEqual('static-fallback');
    });

    it('ignores a table entry with no controls', () => {
      const resolved = resolveControls(
        {query_id: 'empty', cwe: '311'},
        {
          empty: {cci: [], nist: []}
        }
      );
      expect(resolved.source).toEqual('cwe-derived');
    });
  });

  describe('kics_findings withRaw', () => {
    const mapper = new KicsMapper(readSample('kics_findings'), true);

    // Uncomment to regenerate the baseline, then re-comment before committing:
    // fs.writeFileSync(
    //   'sample_jsons/kics_mapper/kics_findings-withraw-hdf.json',
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
        omitHDFTimes(omitVersions(readBaseline('kics_findings-withraw')))
      );
    });
  });

  describe('kics_zero_findings', () => {
    const mapper = new KicsMapper(readSample('kics_zero_findings'));

    // Uncomment to regenerate the baseline, then re-comment before committing:
    // fs.writeFileSync(
    //   'sample_jsons/kics_mapper/kics_zero_findings-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    it('should convert a scan with no findings without throwing', () => {
      expect(findingControls(mapper)).toEqual([]);
    });

    it('should match the regression baseline', () => {
      expect(omitHDFTimes(omitVersions(mapper.toHdf()))).toEqual(
        omitHDFTimes(omitVersions(readBaseline('kics_zero_findings')))
      );
    });
  });
});
