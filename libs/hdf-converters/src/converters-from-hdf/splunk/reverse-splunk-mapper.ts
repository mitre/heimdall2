import axios, {AxiosResponse} from 'axios';
import {
  ContextualizedEvaluation,
  contextualizeEvaluation,
  ExecJSON
} from 'inspecjs';
import {MappedTransform} from '../../base-converter';
import {FromAnyBaseConverter} from '../reverse-any-base-converter';
import {FromHdfBaseConverter, ILookupPathFH} from '../reverse-base-converter';
import {SplunkControl} from './splunk-control-types';
import {SplunkProfile} from './splunk-profile-types';
import {SplunkReport} from './splunk-report-types';

export const HDF_SPLUNK_SCHEMA = '1.0';
export type SplunkConfig = {
  host: string;
  port: number;
  token: string;
  protocol: string;
};

export type SplunkData = {
  profiles: SplunkProfile[];
  controls: SplunkControl[];
  reports: SplunkReport[];
};

export function createGUID(length: number) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function postDataToSplunkHEC(
  data: Record<string, unknown> | Record<string, unknown>[],
  config: SplunkConfig
) {
  if (Array.isArray(data)) {
    return data.map((item) =>
      axios.post(
        `${config.protocol}://${config.host}:${config.port}/services/collector`,
        {
          event: item
        },
        {
          headers: {
            Authorization: `Splunk ${config.token}`
          }
        }
      )
    );
  } else {
    return [
      axios.post(
        `${config.protocol}://${config.host}:${config.port}/services/collector`,
        {
          event: data
        },
        {
          headers: {
            Authorization: `Splunk ${config.token}`
          }
        }
      )
    ];
  }
}

export function getDependencies(
  profile?: ExecJSON.Profile,
  execution?: ExecJSON.Execution
) {
  if (profile && execution) {
    const dependencies: string[] = [];
    profile.depends?.forEach((dependency) => {
      if (dependency.name) {
        dependencies.push(dependency.name);
        dependencies.push(
          ...getDependencies(
            execution.profiles.find(
              (profile) => profile.name === dependency.name
            ),
            execution
          )
        );
      }
    });
    return dependencies;
  }

  return [];
}

export function getProfileRunLevel(
  profile: ExecJSON.Profile,
  execution: ExecJSON.Execution
): number {
  return getDependencies(profile, execution).length;
}

export function createProfileMapping(
  filename: string,
  guid: string
): MappedTransform<SplunkProfile, ILookupPathFH> {
  return {
    meta: {
      filename: filename,
      filetype: 'evaluation',
      guid: guid,
      hdf_splunk_schema: HDF_SPLUNK_SCHEMA,
      is_baseline: true,
      parse_time: new Date().toISOString(),
      profile_sha256: {
        path: 'sha256'
      },
      start_time: new Date().toISOString(),
      subtype: 'header'
    },
    summary: {
      path: 'summary'
    },
    name: {
      path: 'name'
    },
    sha256: {
      path: 'sha256'
    },
    supports: {
      path: 'supports'
    },
    copyright: {
      path: 'copyright'
    },
    copyright_email: {
      path: 'copyright_email'
    },
    maintainer: {
      path: 'maintainer'
    },
    version: {
      path: 'version'
    },
    license: {
      path: 'license',
      default: ''
    },
    title: {
      path: 'title',
      default: 'No Title'
    },
    parent_profile: {
      path: 'depends[0].name'
    },
    depends: {
      path: 'depends'
    },
    attributes: {
      path: 'attributes'
    },
    groups: {
      path: 'groups'
    },
    status: {
      path: 'status',
      default: 'loaded'
    }
  };
}

export function getSplunkFullCode(
  control: ExecJSON.Control,
  execution: ExecJSON.Execution
): string[] {
  const codes: string[] = [];
  execution.profiles.forEach((profile) =>
    profile.controls.forEach((profileControl) =>
      profileControl.id === control.id
        ? codes.push(`${profile.name}: ${control.code}`)
        : codes.push(...[])
    )
  );
  return codes;
}

export function createControlMapping(
  control: ExecJSON.Control,
  profile: ExecJSON.Profile,
  execution: ExecJSON.Execution,
  filename: string,
  guid: string
): MappedTransform<SplunkControl, ILookupPathFH> {
  return {
    meta: {
      guid: guid,
      control_id: {
        path: 'id'
      },
      status: 'Passed',
      profile_sha256: profile.sha256,
      filename: filename,
      subtype: 'control',
      start_time: new Date().toISOString(),
      parse_time: new Date().toISOString(),
      hdf_splunk_schema: HDF_SPLUNK_SCHEMA,
      filetype: 'evaluation',
      full_code: getSplunkFullCode(control, execution),
      is_baseline: getProfileRunLevel(profile, execution) === 0,
      is_waived: {
        path: 'waiver_data.skipped_due_to_waiver',
        transformer: Boolean
      },
      overlay_depth: getProfileRunLevel(profile, execution)
    },
    code: {
      path: 'code'
    },
    desc: {
      path: 'desc'
    },
    descriptions: {path: 'descriptions'},
    id: {
      path: 'id'
    },
    impact: {
      path: 'impact'
    },
    refs: {
      path: 'refs'
    },
    source_location: {
      path: 'source_location'
    },
    tags: {
      path: 'tags'
    },
    results: {
      path: 'results'
    }
  };
}

export class FromHDFControlToSplunkControlMapper extends FromAnyBaseConverter {
  constructor(
    control: ExecJSON.Control,
    profile: ExecJSON.Profile,
    execution: ExecJSON.Execution,
    filename: string,
    guid: string
  ) {
    super(control);
    this.setMappings(
      createControlMapping(control, profile, execution, filename, guid)
    );
  }

  toSplunkControl() {
    return this.convertInternal(this.data as ExecJSON.Control, this.mappings);
  }
}

export class FromHDFProfileToSplunkProfileMapper extends FromAnyBaseConverter {
  constructor(profile: ExecJSON.Profile, filename: string, guid: string) {
    super(profile);
    this.setMappings(createProfileMapping(filename, guid));
  }

  toSplunkProfile() {
    return this.convertInternal(this.data as ExecJSON.Profile, this.mappings);
  }
}

export class FromHDFToSplunkMapper extends FromHdfBaseConverter {
  mappings?: MappedTransform<SplunkData, ILookupPathFH>;
  contextualizedEvaluation?: ContextualizedEvaluation;

  constructor(data: ExecJSON.Execution) {
    super(data);
    this.contextualizedEvaluation = contextualizeEvaluation(data);
  }

  async toSplunk(config: SplunkConfig, filename: string) {
    const splunkData: SplunkData = {
      controls: [],
      profiles: [],
      reports: []
    };
    const guid = createGUID(30);
    this.data.profiles.forEach((profile) => {
      splunkData.profiles.push(
        new FromHDFProfileToSplunkProfileMapper(
          profile,
          filename,
          guid
        ).toSplunkProfile() as SplunkProfile
      );
      profile.controls.forEach((control) => {
        splunkData.controls.push(
          new FromHDFControlToSplunkControlMapper(
            control,
            profile,
            this.data,
            filename,
            guid
          ).toSplunkControl() as SplunkControl
        );
      });
    });

    const uploads: Promise<AxiosResponse>[] = [];
    uploads.push(...postDataToSplunkHEC(splunkData.reports, config));
    uploads.push(...postDataToSplunkHEC(splunkData.profiles, config));
    uploads.push(...postDataToSplunkHEC(splunkData.controls, config));

    return Promise.all(uploads).then(() => guid);
  }
}
