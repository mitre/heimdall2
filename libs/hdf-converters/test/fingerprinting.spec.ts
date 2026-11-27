import fs from 'fs';
import {describe, expect, it} from 'vitest';
import {fingerprint, INPUT_TYPES} from '../src/utils/fingerprinting';

function guess(file: string): INPUT_TYPES {
  return fingerprint({
    data: fs.readFileSync(file, {encoding: 'utf-8'}),
    filename: file.split('/').pop() as string
  });
}

function guessJson(object: unknown): INPUT_TYPES {
  return fingerprint({data: JSON.stringify(object), filename: 'report.json'});
}

describe('fingerprint', () => {
  it.each([
    ['anchore_grype_mapper/sample_input_report/anchore_grype.json', INPUT_TYPES.GRYPE],
    ['asff_mapper/sample_input_report/asff_sample.json', INPUT_TYPES.ASFF],
    ['asff_mapper/sample_input_report/prowler_sample.json', INPUT_TYPES.ASFF],
    ['checkov_mapper/sample_input_report/checkov_sample.json', INPUT_TYPES.CHECKOV],
    ['conveyor_mapper/sample_input_report/sample-results.json', INPUT_TYPES.CONVEYOR],
    ['cyclonedx_sbom_mapper/sample_input_report/dropwizard-vulns.json', INPUT_TYPES.CYCLONEDX_SBOM],
    ['cyclonedx_sbom_mapper/sample_input_report/vex.json', INPUT_TYPES.CYCLONEDX_SBOM],
    ['dependency_track_mapper/sample_input_report/fpf-default.json', INPUT_TYPES.DEPENDENCY_TRACK],
    ['gosec_mapper/sample_input_report/Grype_gosec_results.json', INPUT_TYPES.GOSEC],
    ['hadolint/sample_input_report/heimdall_dockerfile.hadolint.json', INPUT_TYPES.HADOLINT],
    ['jfrog_xray_mapper/sample_input_report/jfrog_xray_sample.json', INPUT_TYPES.JFROG],
    ['msft_secure_score_mapper/sample_input_report/combined.json', INPUT_TYPES.MSFT_SEC_SCORE],
    ['neuvector_mapper/sample_input_report/neuvector-mitre-heimdall.json', INPUT_TYPES.NEUVECTOR],
    ['nikto_mapper/sample_input_report/zero.webappsecurity.json', INPUT_TYPES.NIKTO],
    ['sarif_mapper/sample_input_report/sarif_input.sarif', INPUT_TYPES.SARIF],
    ['snyk_mapper/sample_input_report/nodejs-goof-local.json', INPUT_TYPES.SNYK],
    ['snyk_mapper/sample_input_report/nodejs-goof-remote.json', INPUT_TYPES.SNYK],
    ['trufflehog_mapper/sample_input_report/trufflehog.json', INPUT_TYPES.TRUFFLEHOG],
    ['twistlock_mapper/sample_input_report/twistlock-twistcli-sample-1.json', INPUT_TYPES.TWISTLOCK],
    ['zap_mapper/sample_input_report/webgoat.json', INPUT_TYPES.ZAP]
  ])('identifies %s', (file, expected) => {
    expect(guess(`sample_jsons/${file}`)).toEqual(expected);
  });

  it('does not pick a format on a tie (Anchore Enterprise report, issue #8612)', () => {
    // `vulnerabilities` is a Nikto and a Snyk key: 1 match each
    expect(guessJson({distro: 'ubuntu', vulnerabilities: []})).toEqual(INPUT_TYPES.NOT_FOUND);
    expect(guessJson({vulnerabilities: [{id: 'CVE-2024-0001'}]})).toEqual(INPUT_TYPES.NOT_FOUND);
  });

  it('does not identify a format from one key it shares with another format', () => {
    // `version` is a SARIF and a Dependency-Track key
    expect(guessJson({version: '1.0', profiles: [{}]})).toEqual(INPUT_TYPES.NOT_FOUND);
    expect(
      guess('sample_jsons/xccdf_reverse_mapper/sample_input_report/rhel7-results.json')
    ).toEqual(INPUT_TYPES.NOT_FOUND);
  });

  it('identifies a format from one key no other format uses', () => {
    expect(guessJson({Findings: [{}]})).toEqual(INPUT_TYPES.ASFF);
  });
});
