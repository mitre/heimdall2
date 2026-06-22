import { execSync } from 'child_process';
import fs from 'fs';
import { AnchoreGrypeMapper } from '../src/anchore-grype-mapper';
import { ASFFResults } from '../src/asff-mapper/asff-mapper';
import { BurpSuiteResults } from '../src/burpsuite-mapper';
import { CheckovMapper } from '../src/checkov-mapper';
import { ChecklistResults } from '../src/ckl-mapper/checklist-mapper';
import { ConveyorResults } from '../src/conveyor-mapper';
import { CycloneDXSBOMResults } from '../src/cyclonedx-sbom-mapper';
import { DBProtectMapper } from '../src/dbprotect-mapper';
import { DependencyTrackMapper } from '../src/dependency-track-mapper';
import { FortifyResults } from '../src/fortify-mapper';
import { GosecMapper } from '../src/gosec-mapper';
// IonChannelMapper has no forward test spec — add when available
import { JfrogXrayMapper } from '../src/jfrog-xray-mapper';
import { NessusResults } from '../src/nessus-mapper';
import { NetsparkerResults } from '../src/netsparker-mapper';
import { NeuVectorMapper } from '../src/neuvector-mapper';
import { NiktoMapper } from '../src/nikto-mapper';
// PrismaMapper has dynamic output filenames — add when custom handler implemented
import { SarifMapper } from '../src/sarif-mapper';
import { ScoutsuiteMapper } from '../src/scoutsuite-mapper';
import { SnykMapper } from '../src/snyk-mapper';
import { TrufflehogResults } from '../src/trufflehog-mapper';
import { TwistlockResults } from '../src/twistlock-mapper';
import { VeracodeMapper } from '../src/veracode-mapper';
import { ZapResults } from '../src/zap-mapper';

export interface FixtureEntry {
  arrayIndex?: number;
  inputFile: string;
  isAsync: boolean;
  isExternal?: boolean;
  mapperFactory: (input: string) => { toHdf: () => any };
  objectKey?: string;
  outputFile: string;
}

export const ALLOWED_NEW_FIELDS = new Set([
  'copyright',
  'copyright_email',
  'depends',
  'description',
  'inspec_version',
  'license',
  'maintainer',
  'parent_profile',
  'skip_message',
  'status',
  'status_message',
  'summary',
  'title',
  'version',
]);

export interface ValidationResult {
  isSkipped: boolean;
  outputFile: string;
  unexpectedDiffs: string[];
  verdict: 'FAIL' | 'PASS' | 'SKIP';
}

const MAX_DIFF_DEPTH = 5;

function diffProfiles(
  baseline: Record<string, unknown>,
  current: Record<string, unknown>,
  path: string,
  depth = 0,
): string[] {
  if (depth > MAX_DIFF_DEPTH) {
    return [];
  }
  const unexpected: string[] = [];
  const allKeys = new Set([...Object.keys(baseline), ...Object.keys(current)]);

  for (const key of allKeys) {
    const fullPath = path ? `${path}.${key}` : key;
    const isInBaseline = Object.hasOwn(baseline, key);
    const isInCurrent = Object.hasOwn(current, key);

    if (!isInBaseline && isInCurrent) {
      if (!ALLOWED_NEW_FIELDS.has(key)) {
        unexpected.push(`+${fullPath}: new field not in ALLOWED_NEW_FIELDS`);
      }
      continue;
    }

    if (isInBaseline && !isInCurrent) {
      unexpected.push(`-${fullPath}: field removed`);
      continue;
    }

    const baseVal = baseline[key];
    const curVal = current[key];

    if (typeof baseVal !== typeof curVal) {
      unexpected.push(`~${fullPath}: type changed from ${typeof baseVal} to ${typeof curVal}`);
      continue;
    }

    if (Array.isArray(baseVal) && Array.isArray(curVal)) {
      if (JSON.stringify(baseVal) !== JSON.stringify(curVal) && key === 'profiles') {
        for (let i = 0; i < Math.max(baseVal.length, curVal.length); i++) {
          if (i < baseVal.length && i < curVal.length) {
            unexpected.push(...diffProfiles(baseVal[i] as Record<string, unknown>, curVal[i] as Record<string, unknown>, `${fullPath}[${i}]`, depth + 1));
          }
        }
      }
      continue;
    }

    if (typeof baseVal === 'object' && baseVal !== null && curVal !== null) {
      unexpected.push(...diffProfiles(baseVal as Record<string, unknown>, curVal as Record<string, unknown>, fullPath, depth + 1));
    }
  }

  return unexpected;
}

export async function validateMapperOutput(mapperName: string): Promise<ValidationResult[]> {
  const entries = getFixtureEntries(mapperName);
  const results: ValidationResult[] = [];

  for (const entry of entries) {
    if (entry.isExternal) {
      results.push({ isSkipped: true, outputFile: entry.outputFile, unexpectedDiffs: [], verdict: 'SKIP' });
      continue;
    }

    const validatedPath = validateFixturePath(entry.outputFile);
    if (!fs.existsSync(validatedPath)) {
      results.push({ isSkipped: false, outputFile: entry.outputFile, unexpectedDiffs: ['fixture file does not exist'], verdict: 'FAIL' });
      continue;
    }

    try {
      const input = readInput(entry.inputFile);
      const mapper = entry.mapperFactory(input);
      const rawResult = entry.isAsync ? await mapper.toHdf() : mapper.toHdf();
      let current = rawResult;
      if (entry.arrayIndex !== undefined) {
        current = rawResult[entry.arrayIndex];
      } else if (entry.objectKey !== undefined) {
        current = rawResult[entry.objectKey];
      }
      const baseline = JSON.parse(fs.readFileSync(validatedPath, 'utf8'));

      let unexpected: string[];
      try {
        unexpected = diffProfiles(baseline, current, '');
      } catch {
        const baselineKeys = new Set(Object.keys(baseline));
        const currentKeys = new Set(Object.keys(current));
        unexpected = [];
        for (const key of currentKeys) {
          if (!baselineKeys.has(key) && !ALLOWED_NEW_FIELDS.has(key)) {
            unexpected.push(`+${key}: new top-level field not in ALLOWED_NEW_FIELDS`);
          }
        }
        for (const key of baselineKeys) {
          if (!currentKeys.has(key)) {
            unexpected.push(`-${key}: top-level field removed`);
          }
        }
      }

      results.push({
        isSkipped: false,
        outputFile: entry.outputFile,
        unexpectedDiffs: unexpected,
        verdict: unexpected.length === 0 ? 'PASS' : 'FAIL',
      });
    } catch (error: any) {
      results.push({ isSkipped: false, outputFile: entry.outputFile, unexpectedDiffs: [error.message], verdict: 'FAIL' });
    }
  }

  return results;
}

function validateFixturePath(path: string): string {
  if (!path.startsWith('sample_jsons/')) {
    throw new Error(`Invalid fixture path: ${path} — must be under sample_jsons/`);
  }
  return path;
}

function readInput(path: string): string {
  return fs.readFileSync(validateFixturePath(path), { encoding: 'utf8' });
}

export const FIXTURE_REGISTRY = new Map<string, FixtureEntry[]>([
  ['anchore-grype', [
    { inputFile: 'sample_jsons/anchore_grype_mapper/sample_input_report/anchore_grype.json', isAsync: false, mapperFactory: input => new AnchoreGrypeMapper(input), outputFile: 'sample_jsons/anchore_grype_mapper/anchore-grype-hdf.json' },
    { inputFile: 'sample_jsons/anchore_grype_mapper/sample_input_report/anchore_grype.json', isAsync: false, mapperFactory: input => new AnchoreGrypeMapper(input, true), outputFile: 'sample_jsons/anchore_grype_mapper/anchore-grype-withraw.json' },
    { inputFile: 'sample_jsons/anchore_grype_mapper/sample_input_report/amazon.json', isAsync: false, mapperFactory: input => new AnchoreGrypeMapper(input), outputFile: 'sample_jsons/anchore_grype_mapper/amazon-grype-hdf.json' },
    { inputFile: 'sample_jsons/anchore_grype_mapper/sample_input_report/amazon.json', isAsync: false, mapperFactory: input => new AnchoreGrypeMapper(input, true), outputFile: 'sample_jsons/anchore_grype_mapper/amazon-grype-withraw.json' },
    { inputFile: 'sample_jsons/anchore_grype_mapper/sample_input_report/tensorflow.json', isAsync: false, mapperFactory: input => new AnchoreGrypeMapper(input), outputFile: 'sample_jsons/anchore_grype_mapper/tensorflow-grype-hdf.json' },
    { inputFile: 'sample_jsons/anchore_grype_mapper/sample_input_report/tensorflow.json', isAsync: false, mapperFactory: input => new AnchoreGrypeMapper(input, true), outputFile: 'sample_jsons/anchore_grype_mapper/tensorflow-grype-withraw.json' },
  ]],
  ['asff', [
    { inputFile: 'sample_jsons/asff_mapper/sample_input_report/asff_sample.json', isAsync: false, mapperFactory: input => new ASFFResults(input), objectKey: 'CIS AWS Foundations Benchmark v1.2.0.json', outputFile: 'sample_jsons/asff_mapper/asff-cis_aws-foundations_benchmark_v1.2.0-hdf.json' },
    { inputFile: 'sample_jsons/asff_mapper/sample_input_report/asff_sample.json', isAsync: false, mapperFactory: input => new ASFFResults(input), objectKey: 'AWS Foundational Security Best Practices v1.0.0.json', outputFile: 'sample_jsons/asff_mapper/asff-aws_foundational_security_best_practices_v1.0.0-hdf.json' },
    { inputFile: 'sample_jsons/asff_mapper/sample_input_report/prowler_sample.json', isAsync: false, mapperFactory: input => new ASFFResults(input), objectKey: 'Prowler.json', outputFile: 'sample_jsons/asff_mapper/prowler-hdf.json' },
    { inputFile: 'sample_jsons/asff_mapper/sample_input_report/prowler-sample.asff-json', isAsync: false, mapperFactory: input => new ASFFResults(input), objectKey: 'Prowler.json', outputFile: 'sample_jsons/asff_mapper/prowler-hdf.json' },
    { inputFile: 'sample_jsons/asff_mapper/sample_input_report/trivy-image_golang-1.12-alpine_sample.json', isAsync: false, mapperFactory: input => new ASFFResults(input), objectKey: 'Aqua Security - Trivy.json', outputFile: 'sample_jsons/asff_mapper/trivy-image_golang-1.12-alpine-hdf.json' },
    { inputFile: 'sample_jsons/asff_mapper/sample_input_report/rhel7_V-71931_asff.json', isAsync: false, mapperFactory: input => new ASFFResults(input), objectKey: 'rhel7_V-71931.json-this-is-a-test.json', outputFile: 'sample_jsons/asff_mapper/rhel7_V-71931-hdf.json' },
    { inputFile: 'sample_jsons/asff_mapper/sample_input_report/example-3-layer-overlay_asff.json', isAsync: false, mapperFactory: input => new ASFFResults(input), objectKey: 'example-3-layer-overlay_03062022.json-this-is-a-test.json', outputFile: 'sample_jsons/asff_mapper/example-3-layer-overlay_hdf.json' },
  ]],
  ['burpsuite', [
    { inputFile: 'sample_jsons/burpsuite_mapper/sample_input_report/zero.webappsecurity.com.min', isAsync: true, mapperFactory: input => new BurpSuiteResults(input), outputFile: 'sample_jsons/burpsuite_mapper/burpsuite-hdf.json' },
    { inputFile: 'sample_jsons/burpsuite_mapper/sample_input_report/zero.webappsecurity.com.min', isAsync: true, mapperFactory: input => new BurpSuiteResults(input, true), outputFile: 'sample_jsons/burpsuite_mapper/burpsuite-hdf-withraw.json' },
  ]],
  ['checklist', [
    { inputFile: 'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl', isAsync: false, mapperFactory: input => new ChecklistResults(input), outputFile: 'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf.json' },
    { inputFile: 'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl', isAsync: false, mapperFactory: input => new ChecklistResults(input, true), outputFile: 'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf-with-raw.json' },
    { inputFile: 'sample_jsons/checklist_mapper/sample_input_report/small_ckl_overrides.ckl', isAsync: false, mapperFactory: input => new ChecklistResults(input, true), outputFile: 'sample_jsons/checklist_mapper/small_overrides_hdf.json' },
    { inputFile: 'sample_jsons/checklist_mapper/sample_input_report/three_stig_checklist.ckl', isAsync: false, mapperFactory: input => new ChecklistResults(input), outputFile: 'sample_jsons/checklist_mapper/three_stig_checklist-hdf.json' },
    { inputFile: 'sample_jsons/checklist_mapper/sample_input_report/multiple_mac_addresses_metadata.ckl', isAsync: false, mapperFactory: input => new ChecklistResults(input), outputFile: 'sample_jsons/checklist_mapper/multiple_mac_addresses_metadata.json' },
    { inputFile: 'sample_jsons/checklist_mapper/sample_input_report/multiple_ip_addresses_metadata.ckl', isAsync: false, mapperFactory: input => new ChecklistResults(input), outputFile: 'sample_jsons/checklist_mapper/multiple_ip_addresses_metadata.json' },
  ]],
  ['checkov', [
    { inputFile: 'sample_jsons/checkov_mapper/sample_input_report/checkov_json.json', isAsync: false, mapperFactory: input => new CheckovMapper(input), outputFile: 'sample_jsons/checkov_mapper/checkov_json-hdf.json' },
    { inputFile: 'sample_jsons/checkov_mapper/sample_input_report/checkov_json.json', isAsync: false, mapperFactory: input => new CheckovMapper(input, true), outputFile: 'sample_jsons/checkov_mapper/checkov_json-withraw-hdf.json' },
    { inputFile: 'sample_jsons/checkov_mapper/sample_input_report/checkov_sample.json', isAsync: false, mapperFactory: input => new CheckovMapper(input), outputFile: 'sample_jsons/checkov_mapper/checkov_sample-hdf.json' },
    { inputFile: 'sample_jsons/checkov_mapper/sample_input_report/checkov_synthetic.json', isAsync: false, mapperFactory: input => new CheckovMapper(input), outputFile: 'sample_jsons/checkov_mapper/checkov_synthetic-hdf.json' },
    { inputFile: 'sample_jsons/checkov_mapper/sample_input_report/checkov_with_skips.json', isAsync: false, mapperFactory: input => new CheckovMapper(input), outputFile: 'sample_jsons/checkov_mapper/checkov_with_skips-hdf.json' },
  ]],
  ['conveyor', [
    { inputFile: 'sample_jsons/conveyor_mapper/sample_input_report/sample-results.json', isAsync: false, mapperFactory: input => new ConveyorResults(input), objectKey: 'Moldy', outputFile: 'sample_jsons/conveyor_mapper/conveyor-moldy-hdf.json' },
    { inputFile: 'sample_jsons/conveyor_mapper/sample_input_report/sample-results.json', isAsync: false, mapperFactory: input => new ConveyorResults(input), objectKey: 'Stigma', outputFile: 'sample_jsons/conveyor_mapper/conveyor-stigma-hdf.json' },
    { inputFile: 'sample_jsons/conveyor_mapper/sample_input_report/sample-results.json', isAsync: false, mapperFactory: input => new ConveyorResults(input), objectKey: 'CodeQuality', outputFile: 'sample_jsons/conveyor_mapper/conveyor-codequality-hdf.json' },
    { inputFile: 'sample_jsons/conveyor_mapper/sample_input_report/sample-results.json', isAsync: false, mapperFactory: input => new ConveyorResults(input), objectKey: 'Clamav', outputFile: 'sample_jsons/conveyor_mapper/conveyor-clamav-hdf.json' },
  ]],
  ['cyclonedx-sbom', [
    { inputFile: 'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-vulns.json', isAsync: false, mapperFactory: input => new CycloneDXSBOMResults(input), outputFile: 'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vulns-hdf.json' },
    { inputFile: 'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-vulns.json', isAsync: false, mapperFactory: input => new CycloneDXSBOMResults(input, true), outputFile: 'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vulns-hdf-withraw.json' },
    { inputFile: 'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-no-vulns.json', isAsync: false, mapperFactory: input => new CycloneDXSBOMResults(input), outputFile: 'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-no-vulns-hdf.json' },
    { inputFile: 'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-no-vulns.json', isAsync: false, mapperFactory: input => new CycloneDXSBOMResults(input, true), outputFile: 'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-no-vulns-hdf-withraw.json' },
    { inputFile: 'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-vex.json', isAsync: false, mapperFactory: input => new CycloneDXSBOMResults(input), outputFile: 'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vex-hdf.json' },
    { inputFile: 'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-vex.json', isAsync: false, mapperFactory: input => new CycloneDXSBOMResults(input, true), outputFile: 'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vex-hdf-withraw.json' },
    { inputFile: 'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/generated-saf-sbom.json', isAsync: false, mapperFactory: input => new CycloneDXSBOMResults(input), outputFile: 'sample_jsons/cyclonedx_sbom_mapper/sbom-saf-hdf.json' },
    { inputFile: 'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/generated-saf-sbom.json', isAsync: false, mapperFactory: input => new CycloneDXSBOMResults(input, true), outputFile: 'sample_jsons/cyclonedx_sbom_mapper/sbom-saf-hdf-withraw.json' },
    { inputFile: 'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/spdx-to-cyclonedx.json', isAsync: false, mapperFactory: input => new CycloneDXSBOMResults(input), outputFile: 'sample_jsons/cyclonedx_sbom_mapper/sbom-converted-spdx-hdf.json' },
    { inputFile: 'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/spdx-to-cyclonedx.json', isAsync: false, mapperFactory: input => new CycloneDXSBOMResults(input, true), outputFile: 'sample_jsons/cyclonedx_sbom_mapper/sbom-converted-spdx-hdf-withraw.json' },
    { inputFile: 'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/syft-scan-alpine-container.json', isAsync: false, mapperFactory: input => new CycloneDXSBOMResults(input), outputFile: 'sample_jsons/cyclonedx_sbom_mapper/sbom-syft-alpine-container-hdf.json' },
    { inputFile: 'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/syft-scan-alpine-container.json', isAsync: false, mapperFactory: input => new CycloneDXSBOMResults(input, true), outputFile: 'sample_jsons/cyclonedx_sbom_mapper/sbom-syft-alpine-container-hdf-withraw.json' },
    { inputFile: 'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/vex.json', isAsync: false, mapperFactory: input => new CycloneDXSBOMResults(input), outputFile: 'sample_jsons/cyclonedx_sbom_mapper/sbom-vex-hdf.json' },
    { inputFile: 'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/vex.json', isAsync: false, mapperFactory: input => new CycloneDXSBOMResults(input, true), outputFile: 'sample_jsons/cyclonedx_sbom_mapper/sbom-vex-hdf-withraw.json' },
  ]],
  ['dbprotect', [
    { inputFile: 'sample_jsons/dbprotect_mapper/sample_input_report/DbProtect-Check-Results-Details-XML-Sample.xml', isAsync: false, mapperFactory: input => new DBProtectMapper(input), outputFile: 'sample_jsons/dbprotect_mapper/dbprotect-check-hdf.json' },
    { inputFile: 'sample_jsons/dbprotect_mapper/sample_input_report/DbProtect-Check-Results-Details-XML-Sample.xml', isAsync: false, mapperFactory: input => new DBProtectMapper(input, true), outputFile: 'sample_jsons/dbprotect_mapper/dbprotect-check-hdf-withraw.json' },
    { inputFile: 'sample_jsons/dbprotect_mapper/sample_input_report/DbProtect-Findings-Detail-XML-Sample.xml', isAsync: false, mapperFactory: input => new DBProtectMapper(input), outputFile: 'sample_jsons/dbprotect_mapper/dbprotect-findings-hdf.json' },
    { inputFile: 'sample_jsons/dbprotect_mapper/sample_input_report/DbProtect-Findings-Detail-XML-Sample.xml', isAsync: false, mapperFactory: input => new DBProtectMapper(input, true), outputFile: 'sample_jsons/dbprotect_mapper/dbprotect-findings-hdf-withraw.json' },
  ]],
  ['dependency-track', [
    { inputFile: 'sample_jsons/dependency_track_mapper/sample_input_report/fpf-default.json', isAsync: false, mapperFactory: input => new DependencyTrackMapper(input), outputFile: 'sample_jsons/dependency_track_mapper/hdf-default.json' },
    { inputFile: 'sample_jsons/dependency_track_mapper/sample_input_report/fpf-default.json', isAsync: false, mapperFactory: input => new DependencyTrackMapper(input, true), outputFile: 'sample_jsons/dependency_track_mapper/hdf-default-withraw.json' },
    { inputFile: 'sample_jsons/dependency_track_mapper/sample_input_report/fpf-info-vulnerability.json', isAsync: false, mapperFactory: input => new DependencyTrackMapper(input), outputFile: 'sample_jsons/dependency_track_mapper/hdf-info-vulnerability.json' },
    { inputFile: 'sample_jsons/dependency_track_mapper/sample_input_report/fpf-no-vulnerabilities.json', isAsync: false, mapperFactory: input => new DependencyTrackMapper(input), outputFile: 'sample_jsons/dependency_track_mapper/hdf-no-vulnerabilities.json' },
    { inputFile: 'sample_jsons/dependency_track_mapper/sample_input_report/fpf-optional-attributes.json', isAsync: false, mapperFactory: input => new DependencyTrackMapper(input), outputFile: 'sample_jsons/dependency_track_mapper/hdf-optional-attributes.json' },
    { inputFile: 'sample_jsons/dependency_track_mapper/sample_input_report/fpf-with-attributions.json', isAsync: false, mapperFactory: input => new DependencyTrackMapper(input), outputFile: 'sample_jsons/dependency_track_mapper/hdf-with-attributions.json' },
  ]],
  ['fortify', [
    { inputFile: 'sample_jsons/fortify_mapper/sample_input_report/fortify_webgoat_results.fvdl', isAsync: true, mapperFactory: input => new FortifyResults(input), outputFile: 'sample_jsons/fortify_mapper/fortify-hdf.json' },
    { inputFile: 'sample_jsons/fortify_mapper/sample_input_report/fortify_webgoat_results.fvdl', isAsync: true, mapperFactory: input => new FortifyResults(input, true), outputFile: 'sample_jsons/fortify_mapper/fortify-hdf-withraw.json' },
  ]],
  ['gosec', [
    { inputFile: 'sample_jsons/gosec_mapper/sample_input_report/Grype_gosec_results.json', isAsync: false, mapperFactory: input => new GosecMapper(input), outputFile: 'sample_jsons/gosec_mapper/grype-gosec-hdf.json' },
    { inputFile: 'sample_jsons/gosec_mapper/sample_input_report/Grype_gosec_results.json', isAsync: false, mapperFactory: input => new GosecMapper(input, true), outputFile: 'sample_jsons/gosec_mapper/grype-gosec-hdf-withraw.json' },
    { inputFile: 'sample_jsons/gosec_mapper/sample_input_report/Go_Ethereum_gosec_results_external_suppressed.json', isAsync: false, mapperFactory: input => new GosecMapper(input), outputFile: 'sample_jsons/gosec_mapper/go-ethereum-external-unsuppressed-gosec-hdf.json' },
    { inputFile: 'sample_jsons/gosec_mapper/sample_input_report/Go_Ethereum_gosec_results_external_suppressed.json', isAsync: false, mapperFactory: input => new GosecMapper(input, true), outputFile: 'sample_jsons/gosec_mapper/go-ethereum-external-unsuppressed-gosec-hdf-withraw.json' },
    { inputFile: 'sample_jsons/gosec_mapper/sample_input_report/Go_Ethereum_gosec_results_all_suppressed.json', isAsync: false, mapperFactory: input => new GosecMapper(input), outputFile: 'sample_jsons/gosec_mapper/go-ethereum-all-unsuppressed-gosec-hdf.json' },
    { inputFile: 'sample_jsons/gosec_mapper/sample_input_report/Go_Ethereum_gosec_results_all_suppressed.json', isAsync: false, mapperFactory: input => new GosecMapper(input, true), outputFile: 'sample_jsons/gosec_mapper/go-ethereum-all-unsuppressed-gosec-hdf-withraw.json' },
  ]],
  ['jfrog-xray', [
    { inputFile: 'sample_jsons/jfrog_xray_mapper/sample_input_report/jfrog_xray_sample.json', isAsync: false, mapperFactory: input => new JfrogXrayMapper(input), outputFile: 'sample_jsons/jfrog_xray_mapper/jfrog-hdf.json' },
    { inputFile: 'sample_jsons/jfrog_xray_mapper/sample_input_report/jfrog_xray_sample.json', isAsync: false, mapperFactory: input => new JfrogXrayMapper(input, true), outputFile: 'sample_jsons/jfrog_xray_mapper/jfrog-hdf-withraw.json' },
  ]],
  ['nessus', [
    { arrayIndex: 0, inputFile: 'sample_jsons/nessus_mapper/sample_input_report/sample.nessus', isAsync: true, mapperFactory: input => new NessusResults(input), outputFile: 'sample_jsons/nessus_mapper/nessus-hdf-10.0.0.3.json' },
    { arrayIndex: 1, inputFile: 'sample_jsons/nessus_mapper/sample_input_report/sample.nessus', isAsync: true, mapperFactory: input => new NessusResults(input), outputFile: 'sample_jsons/nessus_mapper/nessus-hdf-10.0.0.2.json' },
    { arrayIndex: 2, inputFile: 'sample_jsons/nessus_mapper/sample_input_report/sample.nessus', isAsync: true, mapperFactory: input => new NessusResults(input), outputFile: 'sample_jsons/nessus_mapper/nessus-hdf-10.0.0.1.json' },
    { arrayIndex: 0, inputFile: 'sample_jsons/nessus_mapper/sample_input_report/sample.nessus', isAsync: true, mapperFactory: input => new NessusResults(input, true), outputFile: 'sample_jsons/nessus_mapper/nessus-hdf-10.0.0.3-withraw.json' },
    { arrayIndex: 1, inputFile: 'sample_jsons/nessus_mapper/sample_input_report/sample.nessus', isAsync: true, mapperFactory: input => new NessusResults(input, true), outputFile: 'sample_jsons/nessus_mapper/nessus-hdf-10.0.0.2-withraw.json' },
    { arrayIndex: 2, inputFile: 'sample_jsons/nessus_mapper/sample_input_report/sample.nessus', isAsync: true, mapperFactory: input => new NessusResults(input, true), outputFile: 'sample_jsons/nessus_mapper/nessus-hdf-10.0.0.1-withraw.json' },
  ]],
  ['netsparker', [
    { inputFile: 'sample_jsons/netsparker_mapper/sample_input_report/sample-netsparker-invicti.xml', isAsync: true, mapperFactory: input => new NetsparkerResults(input), outputFile: 'sample_jsons/netsparker_mapper/netsparker-hdf.json' },
    { inputFile: 'sample_jsons/netsparker_mapper/sample_input_report/sample-netsparker-invicti.xml', isAsync: true, mapperFactory: input => new NetsparkerResults(input, true), outputFile: 'sample_jsons/netsparker_mapper/netsparker-hdf-withraw.json' },
  ]],
  ['neuvector', [
    { inputFile: 'sample_jsons/neuvector_mapper/sample_input_report/neuvector-mitre-heimdall2.json', isAsync: false, mapperFactory: input => new NeuVectorMapper(input), outputFile: 'sample_jsons/neuvector_mapper/neuvector-hdf-mitre-heimdall2.json' },
    { inputFile: 'sample_jsons/neuvector_mapper/sample_input_report/neuvector-mitre-heimdall2.json', isAsync: false, mapperFactory: input => new NeuVectorMapper(input, true), outputFile: 'sample_jsons/neuvector_mapper/neuvector-hdf-withraw-mitre-heimdall2.json' },
    { inputFile: 'sample_jsons/neuvector_mapper/sample_input_report/neuvector-mitre-heimdall.json', isAsync: false, mapperFactory: input => new NeuVectorMapper(input), outputFile: 'sample_jsons/neuvector_mapper/neuvector-hdf-mitre-heimdall.json' },
    { inputFile: 'sample_jsons/neuvector_mapper/sample_input_report/neuvector-mitre-heimdall.json', isAsync: false, mapperFactory: input => new NeuVectorMapper(input, true), outputFile: 'sample_jsons/neuvector_mapper/neuvector-hdf-withraw-mitre-heimdall.json' },
    { inputFile: 'sample_jsons/neuvector_mapper/sample_input_report/neuvector-mitre-vulcan.json', isAsync: false, mapperFactory: input => new NeuVectorMapper(input), outputFile: 'sample_jsons/neuvector_mapper/neuvector-hdf-mitre-vulcan.json' },
    { inputFile: 'sample_jsons/neuvector_mapper/sample_input_report/neuvector-mitre-vulcan.json', isAsync: false, mapperFactory: input => new NeuVectorMapper(input, true), outputFile: 'sample_jsons/neuvector_mapper/neuvector-hdf-withraw-mitre-vulcan.json' },
    { inputFile: 'sample_jsons/neuvector_mapper/sample_input_report/neuvector-mitre-caldera.json', isAsync: false, mapperFactory: input => new NeuVectorMapper(input), outputFile: 'sample_jsons/neuvector_mapper/neuvector-hdf-mitre-caldera.json' },
    { inputFile: 'sample_jsons/neuvector_mapper/sample_input_report/neuvector-mitre-caldera.json', isAsync: false, mapperFactory: input => new NeuVectorMapper(input, true), outputFile: 'sample_jsons/neuvector_mapper/neuvector-hdf-withraw-mitre-caldera.json' },
  ]],
  ['nikto', [
    { inputFile: 'sample_jsons/nikto_mapper/sample_input_report/zero.webappsecurity.json', isAsync: false, mapperFactory: input => new NiktoMapper(input), outputFile: 'sample_jsons/nikto_mapper/nikto-hdf.json' },
    { inputFile: 'sample_jsons/nikto_mapper/sample_input_report/zero.webappsecurity.json', isAsync: false, mapperFactory: input => new NiktoMapper(input, true), outputFile: 'sample_jsons/nikto_mapper/nikto-hdf-withraw.json' },
  ]],
  ['sarif', [
    { inputFile: 'sample_jsons/sarif_mapper/sample_input_report/sarif_input.sarif', isAsync: false, mapperFactory: input => new SarifMapper(input), outputFile: 'sample_jsons/sarif_mapper/sarif-hdf.json' },
    { inputFile: 'sample_jsons/sarif_mapper/sample_input_report/sarif_input.sarif', isAsync: false, mapperFactory: input => new SarifMapper(input, true), outputFile: 'sample_jsons/sarif_mapper/sarif-hdf-withraw.json' },
  ]],
  ['scoutsuite', [
    { inputFile: 'sample_jsons/scoutsuite_mapper/sample_input_report/scoutsuite_sample.js', isAsync: false, mapperFactory: input => new ScoutsuiteMapper(input), outputFile: 'sample_jsons/scoutsuite_mapper/scoutsuite-hdf.json' },
    { inputFile: 'sample_jsons/scoutsuite_mapper/sample_input_report/scoutsuite_sample.js', isAsync: false, mapperFactory: input => new ScoutsuiteMapper(input, true), outputFile: 'sample_jsons/scoutsuite_mapper/scoutsuite-hdf-withraw.json' },
  ]],
  ['snyk', [
    { inputFile: 'sample_jsons/snyk_mapper/sample_input_report/nodejs-goof-local.json', isAsync: false, mapperFactory: input => new SnykMapper(JSON.parse(input)), outputFile: 'sample_jsons/snyk_mapper/nodejs-goof-local-hdf.json' },
    { inputFile: 'sample_jsons/snyk_mapper/sample_input_report/nodejs-goof-remote.json', isAsync: false, mapperFactory: input => new SnykMapper(JSON.parse(input)), outputFile: 'sample_jsons/snyk_mapper/nodejs-goof-remote-hdf.json' },
  ]],
  ['sonarqube', [
    { inputFile: '', isAsync: true, isExternal: true, mapperFactory: () => { throw new Error('sonarqube requires external service'); }, outputFile: 'sample_jsons/sonarqube_mapper/sonarqube-hdf.json' },
  ]],
  ['splunk-reverse', [
    { inputFile: '', isAsync: true, isExternal: true, mapperFactory: () => { throw new Error('splunk requires external service'); }, outputFile: 'sample_jsons/splunk_reverse_mapper/splunk-hdf.json' },
  ]],
  ['trufflehog', [
    { inputFile: 'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog.json', isAsync: false, mapperFactory: input => new TrufflehogResults(input), outputFile: 'sample_jsons/trufflehog_mapper/trufflehog-hdf.json' },
    { inputFile: 'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog.json', isAsync: false, mapperFactory: input => new TrufflehogResults(input, true), outputFile: 'sample_jsons/trufflehog_mapper/trufflehog-hdf-withraw.json' },
    { inputFile: 'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog_docker_example.json', isAsync: false, mapperFactory: input => new TrufflehogResults(input), outputFile: 'sample_jsons/trufflehog_mapper/trufflehog-docker-hdf.json' },
    { inputFile: 'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog_docker_example.json', isAsync: false, mapperFactory: input => new TrufflehogResults(input, true), outputFile: 'sample_jsons/trufflehog_mapper/trufflehog-docker-hdf-withraw.json' },
    { inputFile: 'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog_saf_example.json', isAsync: false, mapperFactory: input => new TrufflehogResults(input), outputFile: 'sample_jsons/trufflehog_mapper/trufflehog-saf-hdf.json' },
    { inputFile: 'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog_saf_example.json', isAsync: false, mapperFactory: input => new TrufflehogResults(input, true), outputFile: 'sample_jsons/trufflehog_mapper/trufflehog-saf-hdf-withraw.json' },
    { inputFile: 'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog-report-example.json', isAsync: false, mapperFactory: input => new TrufflehogResults(input), outputFile: 'sample_jsons/trufflehog_mapper/trufflehog-report-example-hdf.json' },
    { inputFile: 'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog-report-example.json', isAsync: false, mapperFactory: input => new TrufflehogResults(input, true), outputFile: 'sample_jsons/trufflehog_mapper/trufflehog-report-example-hdf-withraw.json' },
    { inputFile: 'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog_dup.ndjson', isAsync: false, mapperFactory: input => new TrufflehogResults(input), outputFile: 'sample_jsons/trufflehog_mapper/trufflehog-ndjson-dup-hdf.json' },
  ]],
  ['twistlock', [
    { inputFile: 'sample_jsons/twistlock_mapper/sample_input_report/twistlock-twistcli-sample-1.json', isAsync: false, mapperFactory: input => new TwistlockResults(input), outputFile: 'sample_jsons/twistlock_mapper/twistlock-hdf.json' },
    { inputFile: 'sample_jsons/twistlock_mapper/sample_input_report/twistlock-twistcli-sample-1.json', isAsync: false, mapperFactory: input => new TwistlockResults(input, true), outputFile: 'sample_jsons/twistlock_mapper/twistlock-hdf-withraw.json' },
    { inputFile: 'sample_jsons/twistlock_mapper/sample_input_report/twistlock-twistcli-coderepo-scan-sample.json', isAsync: false, mapperFactory: input => new TwistlockResults(input), outputFile: 'sample_jsons/twistlock_mapper/twistlock-coderepo-hdf.json' },
    { inputFile: 'sample_jsons/twistlock_mapper/sample_input_report/twistlock-twistcli-coderepo-scan-sample.json', isAsync: false, mapperFactory: input => new TwistlockResults(input, true), outputFile: 'sample_jsons/twistlock_mapper/twistlock-coderepo-hdf-withraw.json' },
  ]],
  ['veracode', [
    { inputFile: 'sample_jsons/veracode_mapper/sample_input_report/veracode.xml', isAsync: false, mapperFactory: input => new VeracodeMapper(input), outputFile: 'sample_jsons/veracode_mapper/veracode-hdf.json' },
  ]],
  ['zap', [
    { inputFile: 'sample_jsons/zap_mapper/sample_input_report/webgoat.json', isAsync: true, mapperFactory: input => new ZapResults(input), outputFile: 'sample_jsons/zap_mapper/zap-webgoat-hdf.json' },
    { inputFile: 'sample_jsons/zap_mapper/sample_input_report/webgoat.json', isAsync: true, mapperFactory: input => new ZapResults(input, true), outputFile: 'sample_jsons/zap_mapper/zap-webgoat-hdf-withraw.json' },
    { inputFile: 'sample_jsons/zap_mapper/sample_input_report/zero.webappsecurity.json', isAsync: true, mapperFactory: input => new ZapResults(input), outputFile: 'sample_jsons/zap_mapper/zap-webappsecurity-hdf.json' },
    { inputFile: 'sample_jsons/zap_mapper/sample_input_report/zero.webappsecurity.json', isAsync: true, mapperFactory: input => new ZapResults(input, true), outputFile: 'sample_jsons/zap_mapper/zap-webappsecurity-hdf-withraw.json' },
  ]],
]);

export function getMapperNames(options?: { includeExternal?: boolean }): string[] {
  const isIncludeExternal = options?.includeExternal ?? false;
  const names: string[] = [];
  for (const [name, entries] of FIXTURE_REGISTRY) {
    if (!isIncludeExternal && entries.some(e => e.isExternal)) {
      continue;
    }
    names.push(name);
  }
  return names.toSorted((a, b) => a.localeCompare(b));
}

export function getFixtureEntries(mapperName: string): FixtureEntry[] {
  return FIXTURE_REGISTRY.get(mapperName) ?? [];
}

async function regenerateMapper(mapperName: string, isDryRun: boolean): Promise<{ errors: string[]; skipped: string[]; written: string[] }> {
  const entries = getFixtureEntries(mapperName);
  const written: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const entry of entries) {
    if (entry.isExternal) {
      skipped.push(`${entry.outputFile} (external service required)`);
      continue;
    }

    try {
      const input = readInput(entry.inputFile);
      const mapper = entry.mapperFactory(input);
      const rawResult = entry.isAsync ? await mapper.toHdf() : mapper.toHdf();
      let result = rawResult;
      if (entry.arrayIndex !== undefined) {
        result = rawResult[entry.arrayIndex];
      } else if (entry.objectKey !== undefined) {
        result = rawResult[entry.objectKey];
      }
      const output = `${JSON.stringify(result, null, 2)}\n`;

      const validatedOutput = validateFixturePath(entry.outputFile);
      if (isDryRun) {
        const isExists = fs.existsSync(validatedOutput);
        if (isExists) {
          const current = fs.readFileSync(validatedOutput, 'utf8');
          if (current === output) {
            skipped.push(`${entry.outputFile} (unchanged)`);
          } else {
            written.push(`${entry.outputFile} (would change)`);
          }
        } else {
          written.push(`${entry.outputFile} (would create)`);
        }
      } else {
        const MAX_SIZE_RATIO = 3;
        if (fs.existsSync(validatedOutput)) {
          const originalSize = fs.statSync(validatedOutput).size;
          if (originalSize > 0 && output.length > originalSize * MAX_SIZE_RATIO) {
            errors.push(`${entry.outputFile}: REJECTED — output is ${Math.round(output.length / originalSize)}x larger than original (${output.length} vs ${originalSize} bytes). Likely wrong constructor or raw data inclusion.`);
            continue;
          }
        }
        fs.writeFileSync(validatedOutput, output);
        written.push(entry.outputFile);
      }
    } catch (error: any) {
      errors.push(`${entry.outputFile}: ${error.message}`);
    }
  }

  return { errors, skipped, written };
}

function revertMapper(mapperName: string): void {
  const entries = getFixtureEntries(mapperName);
  const files = entries.map(e => e.outputFile).map(f => validateFixturePath(f)).filter(f => fs.existsSync(f));
  if (files.length > 0) {
    execSync(`git checkout -- ${files.join(' ')}`, { stdio: 'inherit' });
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isRevert = args.includes('--revert');
  const isValidate = args.includes('--validate');
  const isAll = args.includes('--all');
  const mapperArg = args.find(a => a.startsWith('--mapper='));
  const mappersArg = args.find(a => a.startsWith('--mappers='));

  let targetMappers: string[];

  if (isAll) {
    targetMappers = getMapperNames({ includeExternal: false });
  } else if (mappersArg) {
    targetMappers = mappersArg.replace('--mappers=', '').split(',');
  } else if (mapperArg) {
    targetMappers = [mapperArg.replace('--mapper=', '')];
  } else {
    throw new Error(`Usage: regenerate-fixtures.ts [--all | --mapper=<name> | --mappers=<n1>,<n2>] [--dry-run] [--revert] [--validate]\n\nAvailable mappers: ${getMapperNames({ includeExternal: true }).join(', ')}`);
  }

  for (const name of targetMappers) {
    if (!FIXTURE_REGISTRY.has(name)) {
      throw new Error(`Unknown mapper: ${name}\nAvailable: ${getMapperNames({ includeExternal: true }).join(', ')}`);
    }
  }

  if (isRevert) {
    for (const name of targetMappers) {
      console.log(`Reverting ${name}...`);
      revertMapper(name);
    }
    console.log('Done.');
    return;
  }

  if (isValidate) {
    let totalPass = 0;
    let totalFail = 0;
    let totalSkip = 0;

    for (const name of targetMappers) {
      console.log(`[VALIDATE] ${name}...`);
      const results = await validateMapperOutput(name);
      for (const result of results) {
        if (result.verdict === 'SKIP') {
          console.log(`  - ${result.outputFile} (skipped)`);
          totalSkip++;
        } else if (result.verdict === 'PASS') {
          console.log(`  ✓ ${result.outputFile}`);
          totalPass++;
        } else {
          console.error(`  ✗ ${result.outputFile}`);
          for (const diff of result.unexpectedDiffs) {
            console.error(`    ${diff}`);
          }
          totalFail++;
        }
      }
    }

    console.log(`\n[VALIDATE] Done: ${totalPass} pass, ${totalFail} fail, ${totalSkip} skip`);
    if (totalFail > 0) {
      throw new Error(`${totalFail} fixtures have unexpected differences`);
    }
    return;
  }

  let totalWritten = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const name of targetMappers) {
    console.log(`${isDryRun ? '[DRY RUN] ' : ''}Regenerating ${name}...`);
    const { errors, skipped, written } = await regenerateMapper(name, isDryRun);
    for (const f of written) {
      console.log(`  ✓ ${f}`);
    }
    for (const f of skipped) {
      console.log(`  - ${f}`);
    }
    for (const f of errors) {
      console.error(`  ✗ ${f}`);
    }
    totalWritten += written.length;
    totalSkipped += skipped.length;
    totalErrors += errors.length;
  }

  console.log(`\n${isDryRun ? '[DRY RUN] ' : ''}Done: ${totalWritten} written, ${totalSkipped} skipped, ${totalErrors} errors`);
  if (totalErrors > 0) {
    throw new Error(`${totalErrors} fixture regeneration errors`);
  }
}

const isMainModule = process.argv[1]?.endsWith('regenerate-fixtures.mts');
if (isMainModule) {
  await main();
}
