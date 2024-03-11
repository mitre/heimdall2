import {encode} from 'html-entities';
import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {DEFAULT_UPDATE_REMEDIATION_NIST_TAGS} from '../utils/global';

function findingId(finding: unknown): string {
  const generatorId = _.get(finding, 'GeneratorId');
  const cveId = _.get(finding, 'Resources[0].Details.Other.CVE ID');
  if (typeof cveId === 'string') {
    return encode(`${generatorId}/${cveId}`);
  } else {
    const id = _.get(finding, 'Id');
    return encode(`${generatorId}/${id}`);
  }
}

function findingNistTag(finding: unknown): string[] {
  const cveId = _.get(finding, 'Resources[0].Details.Other.CVE ID');
  if (typeof cveId === 'string') {
    return DEFAULT_UPDATE_REMEDIATION_NIST_TAGS;
  } else {
    return [];
  }
}

function subfindingsStatus(): ExecJSON.ControlResultStatus {
  return ExecJSON.ControlResultStatus.Failed;
}

function subfindingsMessage(finding: unknown): string | undefined {
  const cveId = _.get(finding, 'Resources[0].Details.Other.CVE ID');
  if (typeof cveId === 'string') {
    const patchedPackage = _.get(
      finding,
      'Resources[0].Details.Other.Patched Package'
    ) as unknown as string;
    const patchedVersionMessage =
      patchedPackage.length === 0
        ? 'There is no patched version of the package.'
        : `The package has been patched since version(s): ${patchedPackage}.`;
    return `For package ${_.get(
      finding,
      'Resources[0].Details.Other.PkgName'
    )}, the current version that is installed is ${_.get(
      finding,
      'Resources[0].Details.Other.Installed Package'
    )}.  ${patchedVersionMessage}`;
  } else {
    return undefined;
  }
}

function productName() {
  return 'Aqua Security - Trivy';
}

function titlePrefix() {
  return '';
}

function filename() {
  return `${productName()}.json`;
}

function meta() {
  return {name: 'Trivy', title: 'Trivy Findings'};
}

export function getTrivy(): Record<string, (...inputs: any) => any> {
  return {
    findingId,
    findingNistTag,
    subfindingsStatus,
    subfindingsMessage,
    titlePrefix,
    productName,
    filename,
    meta
  };
}
