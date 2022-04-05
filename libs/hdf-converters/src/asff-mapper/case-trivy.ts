import {encode} from 'html-entities';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';

// eslint-disable-next-line @typescript-eslint/ban-types
export function getTrivy(): Record<string, Function> {
  const findingId = (finding: unknown): string => {
    const generatorId = _.get(finding, 'GeneratorId');
    const cveId = _.get(finding, 'Resources[0].Details.Other.CVE ID');
    if (typeof cveId === 'string') {
      return encode(`${generatorId}/${cveId}`);
    } else {
      const id = _.get(finding, 'Id');
      return encode(`${generatorId}/${id}`);
    }
  };
  const findingNistTag = (finding: unknown): string[] => {
    const cveId = _.get(finding, 'Resources[0].Details.Other.CVE ID');
    if (typeof cveId === 'string') {
      return ['SI-2', 'RA-5'];
    } else {
      return [];
    }
  };
  const subfindingsStatus = (): ExecJSON.ControlResultStatus => {
    return ExecJSON.ControlResultStatus.Failed;
  };
  const subfindingsMessage = (finding: unknown): string | undefined => {
    const cveId = _.get(finding, 'Resources[0].Details.Other.CVE ID');
    if (typeof cveId === 'string') {
      const patchedPackage = _.get(
        finding,
        'Resources[0].Details.Other.Patched Package'
      );
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
  };
  const productName = (): string => {
    return 'Aqua Security - Trivy';
  };
  const doesNotHaveFindingTitlePrefix = (): boolean => true;
  const filename = (): string => {
    return `${productName()}.json`;
  };
  const meta = (): Record<string, string> => {
    return {name: 'Trivy', title: 'Trivy Findings'};
  };
  return {
    findingId,
    findingNistTag,
    subfindingsStatus,
    subfindingsMessage,
    doesNotHaveFindingTitlePrefix,
    productName,
    filename,
    meta
  };
}
