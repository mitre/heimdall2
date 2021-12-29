import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {IFindingASFF} from '../src/converters-from-hdf/asff/asff-types';

export function omitVersions(
  input: ExecJSON.Execution
): Partial<ExecJSON.Execution> {
  return _.omit(input, ['version', 'platform.release', 'profiles[0].sha256']);
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
