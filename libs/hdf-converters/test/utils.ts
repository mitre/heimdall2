import {ExecJSON} from 'inspecjs';
import xmlFormat from 'xml-formatter';
import {XmlParserCommentNode} from 'xml-parser-xo';
import * as _ from 'lodash';
import {IFindingASFF} from '../src/converters-from-hdf/asff/asff-types';
import {ExecJSONProfile} from 'inspecjs/src/generated_parsers/v_1_0/exec-json';

export function omitVersions(
  input: Omit<Partial<ExecJSON.Execution>, 'profiles'> & {
    profiles?: Partial<ExecJSONProfile>[];
  }
): Omit<Partial<ExecJSON.Execution>, 'profiles'> & {
  profiles?: Partial<ExecJSONProfile>[];
} {
  const output = _.omit(input, ['version', 'platform.release']);

  output.profiles = _.map(output.profiles, (profile) => {
    return _.omit(profile, ['sha256', 'version']);
  });

  return output;
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
  input: Omit<Partial<ExecJSON.Execution>, 'profiles'> & {
    profiles?: Partial<ExecJSONProfile>[];
  }
) {
  return {
    ...input,
    profiles: input.profiles?.map((profile) => {
      return {
        ...profile,
        controls: profile.controls?.map((control) => {
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

export function omitCklVersion(input: string): string {
  return xmlFormat(input, {
    lineSeparator: '\n',
    collapseContent: true,
    indentation: '\t',
    filter: (node) =>
      node.type === 'Comment' &&
      (node as XmlParserCommentNode).content.startsWith('Heimdall Version')
  });
}
