import {InspecDataModule} from '@/store/data_store';
import {
  EvaluationFile,
  ProfileFile,
  SourcedContextualizedEvaluation
} from '@/store/report_intake';
import {JSONValue} from '@mitre/hdf-converters/src/utils/parseJson';
import {Result} from '@mitre/hdf-converters/src/utils/result';
import {ContextualizedControl, Severity} from 'inspecjs';
import _ from 'lodash';

export type SBOMProperty = {name: string; value: string};
/**
 * A type to represent a component from an SBOM
 * Other properties may be defined but are only determined at runtime
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
  properties?: SBOMProperty[];
  affectingVulnerabilities: string[]; // an array of bom-refs
  key: string; // used to uniquely identify the component
}

/**
 * A type to represent the metadata for an entire SBOM
 * Other properties may be defined but are only determined at runtime
 * See https://cyclonedx.org/docs/1.6/json/#components_items_properties
 */
export interface SBOMMetadata {
  component?: SBOMComponent;
  properties?: SBOMProperty[];
}

/**
 * @param evaluation The evaluation to test
 * @returns true if the given evaluation contains SBOM data in the passthrough section
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
 * @returns A Result object containing an evaluation if one is found
 */
export function getSbom(
  fileId: string
): Result<SourcedContextualizedEvaluation, null> {
  const evaluation = InspecDataModule.contextualSboms.find(
    (s) => s.from_file.uniqueId === fileId
  );
  if (evaluation) return {ok: true, value: evaluation};
  return {ok: false, error: null};
}

/**
 * Finds the vulnerability corresponding to a given bom-ref
 * @param vulnBomRef The target bom-ref
 * @param controls The search space for a vulnerability with the target bom-ref
 * @returns A Result object containing the vulnerability if found
 */
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

export function componentFitsSeverityFilter(
  component: SBOMComponent,
  severities: Severity[],
  controls: readonly ContextualizedControl[]
): boolean {
  // if there are no vulnerabilities, then severity: none must be allowed
  if (
    !component.affectingVulnerabilities ||
    component.affectingVulnerabilities.length === 0
  ) {
    return severities.includes('none');
  }

  // collect all the controls corresponding to the ids in `affectingVulnerabilities`
  for (const vulnRef of component.affectingVulnerabilities) {
    const vuln = getVulnsFromBomRef(vulnRef, controls);
    // return true if the vuln has an allowable severity
    if (vuln.ok && severities.includes(vuln.value.hdf.severity)) return true;
  }
  return false;
}

function getSbomPassthroughSection(
  evaluation: SourcedContextualizedEvaluation
): Result<JSONValue, null> {
  const passthroughSection = _.get(
    evaluation,
    'data.passthrough.auxiliary_data',
    []
  ).find(_.matchesProperty('name', 'SBOM'));
  if (passthroughSection) return {ok: true, value: passthroughSection};
  return {ok: false, error: null};
}

export function getSbomComponents(
  evaluation: SourcedContextualizedEvaluation
): Result<SBOMComponent[], null> {
  const passthroughSection = getSbomPassthroughSection(evaluation);
  if (passthroughSection.ok) {
    const components: SBOMComponent[] = _.get(
      passthroughSection.value,
      'components',
      []
    ) as SBOMComponent[];
    if (components) return {ok: true, value: components};
  }
  return {ok: false, error: null};
}

/**
 * Gets the SBOM metadata from the given evaluation
 */
export function getSbomMetadata(
  evaluation: SourcedContextualizedEvaluation
): Result<SBOMMetadata, null> {
  const passthroughSection = getSbomPassthroughSection(evaluation);
  if (passthroughSection.ok) {
    const metadata: SBOMMetadata | undefined = _.get(
      passthroughSection.value,
      'data.metadata'
    ) as SBOMMetadata | undefined;
    if (metadata) return {ok: true, value: metadata};
  }
  return {ok: false, error: null};
}
