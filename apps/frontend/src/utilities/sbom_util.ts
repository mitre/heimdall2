import {InspecDataModule} from '@/store/data_store';
import {
  EvaluationFile,
  ProfileFile,
  SourcedContextualizedEvaluation
} from '@/store/report_intake';
import {Result} from '@mitre/hdf-converters/src/utils/result';
import {ContextualizedControl, Severity} from 'inspecjs';
import _ from 'lodash';
import {execution_unique_key} from './format_util';

export type SBOMProperty = {name: string; value: string};
/**
 * A type to represent a component from an SBOM
 * Other properties may be defined but are only determined at runtime
 * See https://cyclonedx.org/docs/1.6/json/#components
 */
export interface ContextualizedSBOMComponent {
  name: string;
  description?: string;
  externalReferences?: {
    url: string;
    comment?: string;
    type: string;
    hashes: Record<string, unknown>[];
  }[];
  'bom-ref': string;
  properties?: SBOMProperty[];

  // custom SBOM component data not included in CycloneDX Schema

  /** A list of bom-refs that link to controls (vulnerabilities) */
  affectingVulnerabilities: string[];
  /** a string to uniquely identify the component. It won't show in UI */
  key: string;
  /** a list of this component's dependencies */
  children: ContextualizedSBOMComponent[];
  /** a list of components dependent on this component */
  parents: ContextualizedSBOMComponent[];
  /** the file that the component originated from */
  fileName: string;
}

/**
 * A type to represent the metadata for an entire SBOM
 * Other properties may be defined but are only determined at runtime
 * See https://cyclonedx.org/docs/1.6/json/#components_items_properties
 */
export interface SBOMMetadata {
  component?: ContextualizedSBOMComponent;
  properties?: SBOMProperty[];
}

export interface SBOMData {
  components: Readonly<ContextualizedSBOMComponent>[];
  metadata?: Readonly<SBOMMetadata>;
  componentMap: Map<string, Readonly<ContextualizedSBOMComponent>>;
}

export interface SbomViewSettings {
  severities: Severity[];
  currentHeaders: string[];
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
  component: ContextualizedSBOMComponent,
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

/**
 * Takes the raw passthrough section and extracts the important SBOM data and relationships from them
 *
 * @param evaluation The evaluation to parse the passthrough of
 * @returns An object containing all the important information and relationships about an SBOM
 */
export function parseSbomPassthrough(
  evaluation: SourcedContextualizedEvaluation
): SBOMData {
  const passthroughSection = _.get(
    evaluation,
    'data.passthrough.auxiliary_data',
    []
  ).find(_.matchesProperty('name', 'SBOM'));

  const componentMap = new Map<string, Readonly<ContextualizedSBOMComponent>>();
  if (!passthroughSection) {
    return {
      components: [],
      componentMap: componentMap
    };
  }

  const rawMetadata = _.get(passthroughSection, 'data.metadata');

  let rootComponent;
  if (_.has(rawMetadata, 'component')) {
    rootComponent = processRawComponent(
      _.get(rawMetadata, 'component'),
      evaluation
    );
    componentMap.set(rootComponent['bom-ref'], rootComponent);
  }
  const metadata: SBOMMetadata = {
    ...(rawMetadata as Object),
    component: rootComponent
  };
  const rawComponents = _.get(passthroughSection, 'components', []);
  const components: ContextualizedSBOMComponent[] = [];

  for (const rawComponent of rawComponents) {
    const component: ContextualizedSBOMComponent = processRawComponent(
      rawComponent,
      evaluation
    );
    components.push(component);
    componentMap.set(component['bom-ref'], component);
  }

  for (const rawDependency of _.get(passthroughSection, 'dependencies', [])) {
    const ref = _.get(rawDependency, 'ref');
    const parentComponent = componentMap.get(ref);
    if (!ref || !parentComponent) {
      continue;
    }
    for (const childRef of _.get(rawDependency, 'dependsOn', [])) {
      const childComponent = componentMap.get(childRef);
      if (childComponent) {
        childComponent.parents.push(parentComponent);
        parentComponent.children.push(childComponent);
      }
    }
  }
  if (rootComponent) {
    // take any components that are still not part of the dependency
    // tree structure and place them as children of the root component
    const parentlessComponents = components.filter(
      (c) => c.parents.length === 0
    );
    for (const child of parentlessComponents) {
      if (child === rootComponent) {
        continue;
      }
      child.parents.push(rootComponent);
      rootComponent.children.push(child);
    }
  }

  return {
    metadata,
    components,
    componentMap
  };
}

function processRawComponent(
  rawComponent: Object,
  evaluation: SourcedContextualizedEvaluation
): ContextualizedSBOMComponent {
  // only generate UUID for bom-ref if needed
  const bomRef = _.get(rawComponent, 'bom-ref') || _.uniqueId();
  const key = `${execution_unique_key(evaluation)}-${bomRef}`;
  return {
    ...(_.omit(rawComponent, [
      'name',
      'bom-ref',
      'affectingVulnerabilities'
    ]) as Object),
    name: _.get(rawComponent, 'name', ''),
    'bom-ref': bomRef,
    affectingVulnerabilities: _.get(
      rawComponent,
      'affectingVulnerabilities',
      []
    ),
    key,
    children: [], // will be populated later
    parents: [], // will be populated later
    fileName: evaluation.from_file.filename
  };
}
