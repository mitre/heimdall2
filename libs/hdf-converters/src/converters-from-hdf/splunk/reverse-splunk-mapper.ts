import axios, {AxiosResponse} from 'axios';
import {
  ContextualizedControl,
  ContextualizedEvaluation,
  ContextualizedProfile,
  contextualizeEvaluation,
  ExecJSON
} from 'inspecjs';
import {MappedTransform} from '../../base-converter';
import {FromAnyBaseConverter} from '../reverse-any-base-converter';
import {ILookupPathFH} from '../reverse-base-converter';
import {SplunkControl} from './splunk-control-types';
import {SplunkProfile} from './splunk-profile-types';
import {SplunkReport} from './splunk-report-types';

export const HDF_SPLUNK_SCHEMA = '1.0';
export type SplunkConfig = {
  host: string;
  port: number;
  token: string;
  protocol: string;
  index?: string;
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

export function contextualizeIfNeeded(
  data: ExecJSON.Execution | ContextualizedEvaluation
) {
  if ('contains' in data) {
    return data;
  } else {
    return contextualizeEvaluation(data);
  }
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
          event: item,
          index: config.index || 'main'
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

export function createReportMapping(
  execution: ContextualizedEvaluation,
  filename: string,
  guid: string
): MappedTransform<SplunkReport, ILookupPathFH> {
  return {
    meta: {
      guid: guid,
      filename: filename,
      subtype: 'header',
      hdf_splunk_schema: HDF_SPLUNK_SCHEMA,
      filetype: 'evaluation'
    },
    platform: execution.data.platform,
    statistics: execution.data.statistics,
    version: execution.data.version
  };
}

export function getDependencies(
  profile?: ContextualizedProfile,
  execution?: ContextualizedEvaluation
) {
  if (profile && execution) {
    const dependencies: string[] = [];
    profile.data.depends?.forEach((dependency) => {
      if (dependency.name) {
        dependencies.push(dependency.name);
        dependencies.push(
          ...getDependencies(
            execution.contains.find(
              (execProfile) => execProfile.data.name === dependency.name
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
  profile: ContextualizedProfile,
  execution: ContextualizedEvaluation
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
      profile_sha256: {
        path: 'data.sha256'
      },
      subtype: 'header'
    },
    summary: {
      path: 'data.summary'
    },
    name: {
      path: 'data.name'
    },
    sha256: {
      path: 'data.sha256'
    },
    supports: {
      path: 'data.supports'
    },
    copyright: {
      path: 'data.copyright'
    },
    copyright_email: {
      path: 'data.copyright_email'
    },
    maintainer: {
      path: 'data.maintainer'
    },
    version: {
      path: 'data.version'
    },
    license: {
      path: 'data.license'
    },
    title: {
      path: 'data.title',
      default: 'No Title'
    },
    parent_profile: {
      path: 'data.depends[0].name'
    },
    depends: {
      path: 'data.depends'
    },
    attributes: {
      path: 'data.attributes'
    },
    groups: {
      path: 'data.groups'
    },
    status: {
      path: 'data.status'
    }
  };
}

export function createControlMapping(
  control: ContextualizedControl,
  profile: ContextualizedProfile,
  execution: ContextualizedEvaluation,
  filename: string,
  guid: string
): MappedTransform<SplunkControl, ILookupPathFH> {
  return {
    meta: {
      guid: guid,
      status: control.hdf.status,
      profile_sha256: profile.data.sha256,
      filename: filename,
      subtype: 'control',
      hdf_splunk_schema: HDF_SPLUNK_SCHEMA,
      filetype: 'evaluation',
      is_baseline: getProfileRunLevel(profile, execution) === 0,
      is_waived: control.hdf.waived,
      overlay_depth: getProfileRunLevel(profile, execution) + 1
    },
    code: control.data.code || '',
    desc: control.data.desc || '',
    descriptions: {
      path: 'data.descriptions',
      transformer: (data: {label: string; data: string}[]) => {
        const descObjects: Record<string, string> = {};
        data.forEach((item) => {
          descObjects[item['label']] = item['data'];
        });
        return descObjects;
      }
    },
    id: control.data.id,
    impact: control.data.impact,
    refs: control.data.refs || [],
    source_location: control.data.source_location,
    tags: control.data.tags,
    results: control.hdf.segments
  };
}

export class FromHDFExecutionToSplunkExecutionMapper extends FromAnyBaseConverter {
  constructor(
    evaluation: ContextualizedEvaluation,
    filename: string,
    guid: string
  ) {
    super(evaluation);
    this.setMappings(createReportMapping(evaluation, filename, guid));
  }

  toSplunkExecution() {
    return this.convertInternal(this.data, this.mappings);
  }
}

export class FromHDFProfileToSplunkProfileMapper extends FromAnyBaseConverter {
  constructor(profile: ContextualizedProfile, filename: string, guid: string) {
    super(profile);
    this.setMappings(createProfileMapping(filename, guid));
  }

  toSplunkProfile() {
    return this.convertInternal(this.data, this.mappings);
  }
}

export class FromHDFControlToSplunkControlMapper extends FromAnyBaseConverter {
  constructor(
    control: ContextualizedControl,
    profile: ContextualizedProfile,
    execution: ContextualizedEvaluation,
    filename: string,
    guid: string
  ) {
    super(control);
    this.setMappings(
      createControlMapping(control, profile, execution, filename, guid)
    );
  }

  toSplunkControl() {
    return this.convertInternal(this.data, this.mappings);
  }
}

export class FromHDFToSplunkMapper extends FromAnyBaseConverter {
  mappings?: MappedTransform<SplunkData, ILookupPathFH>;
  contextualizedEvaluation?: ContextualizedEvaluation;

  constructor(data: ExecJSON.Execution | ContextualizedEvaluation) {
    super(contextualizeIfNeeded(data));
  }

  async toSplunk(config: SplunkConfig, filename: string) {
    const splunkData: SplunkData = {
      controls: [],
      profiles: [],
      reports: []
    };
    const guid = createGUID(30);
    splunkData.reports.push(
      new FromHDFExecutionToSplunkExecutionMapper(
        this.data,
        filename,
        guid
      ).toSplunkExecution() as SplunkReport
    );
    this.data.contains.forEach((profile: ContextualizedProfile) => {
      splunkData.profiles.push(
        new FromHDFProfileToSplunkProfileMapper(
          profile,
          filename,
          guid
        ).toSplunkProfile() as SplunkProfile
      );
      profile.contains.forEach((control) => {
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
