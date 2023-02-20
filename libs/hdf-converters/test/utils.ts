import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {IFindingASFF} from '../src/converters-from-hdf/asff/asff-types';

export function omitVersions(
  input: ExecJSON.Execution
): Partial<ExecJSON.Execution> & {profiles: ExecJSON.Profile} {
  return _.omit(input, [
    'version',
    'platform.release',
    'profiles[0].sha256'
  ]) as unknown as Partial<ExecJSON.Execution> & {profiles: ExecJSON.Profile};
}

// Profile information title contains a changing value
export function omitASFFTitle(
  input: Partial<IFindingASFF>[]
): Partial<IFindingASFF>[] {
  return input.map((finding) => _.omit(finding, 'Title'));
}

export function omitASFFTimes(
  input: Partial<IFindingASFF>[]
): Partial<IFindingASFF>[] {
  return input.map((finding) => _.omit(finding, ['UpdatedAt', 'CreatedAt']));
}

export function omitASFFVersions(
  input: Partial<IFindingASFF>[]
): Partial<IFindingASFF>[] {
  return input.map((finding) => {
    if (_.has(finding, 'FindingProviderFields.Types')) {
      const typesArray = _.reject(
        _.get(finding, 'FindingProviderFields.Types') as unknown as string[],
        (type) => _.startsWith(type, 'MITRE/SAF/')
      );
      _.set(finding, 'FindingProviderFields.Types', typesArray);
    }
    return finding;
  });
}

export function omitHDFTimes(
  input: Partial<ExecJSON.Execution> & {profiles: ExecJSON.Profile[]}
) {
  return {
    ...input,
    profiles: input.profiles.map((profile) => {
      return {
        ...profile,
        controls: profile.controls.map((control) => {
          return {
            ...control,
            attestation_data: _.omit(control.attestation_data, 'updated'),
            results: control.results.map((result) => {
              return {
                ..._.omit(result, 'start_time'),
                message: result.message?.replace(/Updated:.*\n/g, '')
              };
            })
          };
        })
      };
    })
  };
}
