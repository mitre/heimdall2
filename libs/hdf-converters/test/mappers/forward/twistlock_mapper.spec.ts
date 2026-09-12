import fs from 'fs';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {TwistlockResults} from '../../../src/twistlock-mapper';
import {omitVersions} from '../../utils';

// Sequential: these tests spy on the shared console (vitest.config.ts runs
// tests concurrently by default), see issue #8611 for the severity values.
describe.sequential('twistlock_mapper_severity_mapping', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps the distro-vendor pass-through severities without warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockReturnValue();
    const mapper = new TwistlockResults(
      fs.readFileSync(
        'sample_jsons/twistlock_mapper/sample_input_report/twistlock-twistcli-vendor-severities-sample.json',
        {encoding: 'utf-8'}
      )
    );
    const impacts = Object.fromEntries(
      mapper.toHdf().profiles[0].controls.map((c) => [c.id, c.impact])
    );
    expect(impacts['CVE-2022-1650']).toBe(0.5); // unassigned
    expect(impacts['CVE-2022-22824']).toBe(0.1); // unimportant
    expect(impacts['CVE-2022-22823']).toBe(0.1); // negligible
    expect(impacts['CVE-2022-22822']).toBe(0.5); // untriaged (Ubuntu)
    expect(impacts['CVE-2022-22827']).toBe(0.5); // not yet assigned
    expect(impacts['CVE-2021-43529']).toBe(0.9); // critical (control case)
    // No warnings: proves 'unassigned' is mapped to 0.5, not defaulted to it
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('twistlock_mapper', () => {
  it('Successfully converts Twistlock docker image scan targeted at a local/cloned repository data', () => {
    const mapper = new TwistlockResults(
      fs.readFileSync(
        'sample_jsons/twistlock_mapper/sample_input_report/twistlock-twistcli-sample-1.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/twistlock_mapper/twistlock-twistcli-sample-1-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/twistlock_mapper/twistlock-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});

describe('twistlock_mapper_code_repo', () => {
  it('Successfully converts Twistlock code repo scan targeted at a local/cloned repository data', () => {
    const mapper = new TwistlockResults(
      fs.readFileSync(
        'sample_jsons/twistlock_mapper/sample_input_report/twistlock-twistcli-coderepo-scan-sample.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/twistlock_mapper/twistlock-coderepo-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/twistlock_mapper/twistlock-coderepo-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('twistlock_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Twistlock docker image scan', () => {
    const mapper = new TwistlockResults(
      fs.readFileSync(
        'sample_jsons/twistlock_mapper/sample_input_report/twistlock-twistcli-sample-1.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/twistlock_mapper/twistlock-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/twistlock_mapper/twistlock-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('twistlock_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Twistlock code repo scan', () => {
    const mapper = new TwistlockResults(
      fs.readFileSync(
        'sample_jsons/twistlock_mapper/sample_input_report/twistlock-twistcli-coderepo-scan-sample.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/twistlock_mapper/twistlock-coderepo-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/twistlock_mapper/twistlock-coderepo-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
