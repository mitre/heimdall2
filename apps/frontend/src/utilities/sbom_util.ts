import {InspecDataModule} from '@/store/data_store';
import {
  EvaluationFile,
  ProfileFile,
  SourcedContextualizedEvaluation
} from '@/store/report_intake';
import {Result} from '@mitre/hdf-converters/src/utils/result';
import {ContextualizedControl} from 'inspecjs';
import _ from 'lodash';

/**
 * A type to reprsent a component from an SBOM
 * Other properties maybe defined but are only determined at runtime
 * See https://cyclonedx.org/docs/1.6/json/#components
 */
export interface SBOMComponent {
  name: string;
  externalReferences?: {
    url: string;
    comment?: string;
    type: string;
    hashes: Record<string, unknown>[];
  }[];
  'bom-ref'?: string;
  properties?: {name: string; value: string}[];
  affectingVulnerabilities: string[]; // an array of bom-refs
  key: string; // used to uniquely identify the component
}

/**
 * @param evaluation The evaulation to test
 * @returns ture if the given evaluation contains SBOM data in the passthrough section
 */
export function isSbom(evaluation?: SourcedContextualizedEvaluation): boolean {
  return _.get(evaluation, 'data.passthrough.auxiliary_data', []).some(
    _.matchesProperty('name', 'SBOM')
  );
}

/**
 * @param file The file to test
 * @returns true if the given file contains SBOM data in the passthrough section
 */
export function isSbomFile(file: EvaluationFile | ProfileFile) {
  const evaluation = _.get(file, 'evaluation');
  return evaluation !== undefined && isSbom(evaluation);
}

/**
 * @param fileId The id to test
 * @returns true if the given file id is associated with an SBOM
 */
export function isSbomFileId(fileId: string): boolean {
  return getSbom(fileId).ok;
}

/**
 * @param file The file to evaluate
 * @returns true if `file` is an SBOM and does not hae any controls/results/vulnerabilities
 */
export function isOnlySbom(evaluation: SourcedContextualizedEvaluation) {
  const hasResults: boolean = evaluation.data.profiles.some(
    (p) => p.controls.length > 0
  );
  return !hasResults && isSbom(evaluation);
}

/**
 * @param file The file to evaluate
 * @returns true if `file` is an SBOM and does not hae any controls/results/vulnerabilities
 */
export function isOnlySbomFile(file: EvaluationFile | ProfileFile) {
  const evaluation = _.get(file, 'evaluation');
  return evaluation !== undefined && isOnlySbom(evaluation);
}

/**
 * @param fileId The file id to search for
 * @returns true if `fileId` corresponds to an SBOM with no controls/results/vulnerabilities
 */
export function isOnlySbomFileId(fileId: string): boolean {
  const sbom = getSbom(fileId);
  if (sbom.ok) return isOnlySbom(sbom.value);
  return false;
}

/**
 * @param fileId The id to search for
 * @returns A Result object contianing an evaluation if one is found
 */
export function getSbom(
  fileId: string
): Result<SourcedContextualizedEvaluation, false> {
  const evaluation = InspecDataModule.contextualSboms.find(
    (s) => s.from_file.uniqueId === fileId
  );
  if (evaluation) return {ok: true, value: evaluation};
  return {ok: false, error: false};
}

export function getVulnsFromBomRef(
  vulnBomRef: string,
  controls: readonly ContextualizedControl[]
): Result<ContextualizedControl, null> {
  const vuln = controls.find((c) => {
    // regex to get the value of bom-ref from the vuln code stored as JSON
    const match = c.full_code.match(/"bom-ref": "(?<ref>.*?)"/);
    return match ? match.groups?.ref === vulnBomRef : false;
  });
  if (vuln) return {ok: true, value: vuln};
  return {ok: false, error: null};
}
