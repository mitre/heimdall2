import fs from 'fs';
import { createConnection } from 'net';
import { type ExecJSON } from 'inspecjs';
import { type ExecJSONProfile } from 'inspecjs/src/generated_parsers/v_1_0/exec-json';
import _ from 'lodash';
import { version as hdfConvertersVersion } from '../package.json';
import { type IFindingASFF } from '../src/converters-from-hdf/asff/asff-types';

export function loadFixture(path: string): unknown {
  return JSON.parse(fs.readFileSync(path, { encoding: 'utf8' }));
}

export function isServiceAvailable(host: string, port: number, timeoutMs = 1000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeoutMs);
    socket.on('connect', () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(false);
    });
  });
}

export function omitVersions(
  input: Omit<Partial<ExecJSON.Execution>, 'profiles'> & { profiles?: Partial<ExecJSONProfile>[] },
): Omit<Partial<ExecJSON.Execution>, 'profiles'> & { profiles?: Partial<ExecJSONProfile>[] } {
  const output = _.omit(input, ['version', 'platform.release']);

  output.profiles = _.map(output.profiles, (profile) => {
    return _.omit(profile, ['sha256', 'version']);
  });

  return output;
}

export function omitHDFTitle(
  input: Omit<Partial<ExecJSON.Execution>, 'profiles'> & { profiles?: Partial<ExecJSONProfile>[] },
): Omit<Partial<ExecJSON.Execution>, 'profiles'> & { profiles?: Partial<ExecJSONProfile>[] } {
  input.profiles = _.map(input.profiles, (profile) => {
    return _.omit(profile, ['title']);
  });

  return input;
}

// Profile information title contains a changing value
export function omitASFFTitle(
  input: Partial<IFindingASFF>[],
): Partial<IFindingASFF>[] {
  return input.map(finding => _.omit(finding, 'Title'));
}

export function omitASFFTimes(
  input: Partial<IFindingASFF>[],
): Partial<IFindingASFF>[] {
  return input.map(finding => _.omit(finding, ['UpdatedAt', 'CreatedAt']));
}

export function omitASFFVersions(
  input: Partial<IFindingASFF>[],
): Partial<IFindingASFF>[] {
  return input.map((finding) => {
    if (_.has(finding, 'FindingProviderFields.Types')) {
      const typesArray = _.reject(
        _.get(finding, 'FindingProviderFields.Types') as unknown as string[],
        type => _.startsWith(type, 'MITRE/SAF/'),
      );
      _.set(finding, 'FindingProviderFields.Types', typesArray);
    }
    return finding;
  });
}

export function omitHDFTimes(
  input: Omit<Partial<ExecJSON.Execution>, 'profiles'> & { profiles?: Partial<ExecJSONProfile>[] },
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
                message: result.message?.replaceAll(/Updated:.*\n/gv, ''),
              };
            }),
          };
        }),
      };
    }),
  };
}

// replaces the version in the checklist file with the
// actual hdf-converters version
export function replaceCKLVersion(input: string): string {
  return input.replace(
    /(?<=<!--Heimdall Version :: )\S+(?=-->)/v,
    hdfConvertersVersion,
  );
}

// replaces the version in the checklist file with the
// actual hdf-converters version
export function replaceXCCDFVersion(input: string): string {
  return input.replace(
    /(?<=<version>)\S+(?=<\/version>)/v,
    hdfConvertersVersion,
  );
}

export function omitHTMLStyleTag(input: string): string {
  return input.replace(/(<style>)[\s\S]*?(?=<\/style>)/v, '$1');
}
