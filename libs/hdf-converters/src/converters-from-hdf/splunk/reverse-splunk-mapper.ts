import splunkjs from '@mitre/splunk-sdk-no-env';
import {
  ContextualizedControl,
  ContextualizedEvaluation,
  ContextualizedProfile,
  contextualizeEvaluation,
  ExecJSON
} from 'inspecjs';
import winston from 'winston';
import {MappedTransform} from '../../base-converter';
import {createWinstonLogger} from '../../utils/global';
import {FromAnyBaseConverter} from '../reverse-any-base-converter';
import {ILookupPathFH} from '../reverse-base-converter';
import {SplunkControl} from './splunk-control-types';
import {SplunkProfile} from './splunk-profile-types';
import {SplunkReport} from './splunk-report-types';

export const HDF_SPLUNK_SCHEMA = '1.1';
export const MAPPER_NAME = 'HDF2Splunk';

export type SplunkConfig = {
  scheme?: 'http' | 'https';
  host: string;
  port?: number;
  username: string;
  password: string;
  index: string;
  owner?: string;
  app?: string;
  sessionKey?: string;
  autologin?: boolean;
  version?: string;
  insecure?: boolean;
};

export type SplunkData = {
  profiles: SplunkProfile[];
  controls: SplunkControl[];
  reports: SplunkReport[];
};

let logger: winston.Logger = winston.createLogger();

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
    profiles: [],
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
      is_baseline: {
        path: 'data.depends[0].name',
        transformer: (value?: string) => {
          return !Boolean(value);
        }
      },
      profile_sha256: {
        path: 'data.sha256'
      },
      subtype: 'profile'
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
      path: 'data.title'
    },
    controls: [],
    parent_profile: {
      path: 'data.parent_profile',
      default: undefined
    },
    depends: {
      path: 'data.depends',
      default: []
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
    title: control.data.title,
    code: control.data.code || '',
    desc: control.data.desc || '',
    descriptions: {
      path: 'data.descriptions',
      transformer: (data: {label: string; data: string}[]) => {
        const descObjects: Record<string, string> = {};
        if (Array.isArray(data)) {
          data.forEach((item) => {
            descObjects[item['label']] = item['data'];
          });
        }
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

  constructor(
    data: ExecJSON.Execution | ContextualizedEvaluation,
    logService?: winston.Logger,
    loggingLevel?: string
  ) {
    if (logService) {
      logger = logService;
    } else {
      logger = createWinstonLogger(MAPPER_NAME, loggingLevel || 'debug');
    }

    super(contextualizeIfNeeded(data));
  }

  createSplunkData(guid: string, filename: string) {
    const splunkData: SplunkData = {
      controls: [],
      profiles: [],
      reports: []
    };
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
    return splunkData;
  }

  uploadSplunkData(targetIndex: any, splunkData: SplunkData) {
    // Upload execution event
    splunkData.reports.forEach((report) => {
      targetIndex.submitEvent(
        JSON.stringify(report),
        {
          sourcetype: MAPPER_NAME,
          index: targetIndex.name
        },
        (err: any) => {
          if (err) {
            console.error(err);
            throw err;
          }
          logger.debug(
            `Successfully uploaded execution for ${report.meta.filename}`
          );
        }
      );
    });
    // Upload profile event(s)
    // \r\n Is the default LINE_BREAKER for splunk, this is very poorly documented.
    // See https://docs.splunk.com/Documentation/StreamProcessor/standard/FunctionReference/LineBreak
    targetIndex.submitEvent(
      splunkData.profiles.map((profile) => JSON.stringify(profile)).join('\n'),
      {
        sourcetype: MAPPER_NAME,
        index: targetIndex.name
      },
      (err: any) => {
        if (err) {
          console.error(err);
          throw err;
        }
        logger.debug(
          `Successfully uploaded ${splunkData.profiles.length} profile layer(s)`
        );
      }
    );

    // Upload control event(s)
    targetIndex.submitEvent(
      splunkData.controls.map((control) => JSON.stringify(control)).join('\n'),
      {
        sourcetype: MAPPER_NAME,
        index: targetIndex.name
      },
      (err: any) => {
        if (err) {
          console.error(err);
          throw err;
        }
        logger.debug(
          `Successfully uploaded ${splunkData.controls.length} control(s)`
        );
      }
    );
  }

  toSplunk(config: SplunkConfig, filename: string) {
    const service = new splunkjs.Service(config);
    if (!config.insecure) {
      service.requestOptions.strictSSL = true;
    } else {
      logger.info(`SSL Verification Disabled`);
    }
    logger.info(
      `Logging into Splunk Service: ${config.host} with user ${config.username}`
    );
    logger.debug('Got Execution: ' + filename);
    const guid = createGUID(30);
    logger.debug('Using GUID: ' + guid);

    service.login((err: any, success: any) => {
      if (err) {
        throw err;
      }
      logger.info('Login was successful: ' + success);
      service.indexes().fetch((err: any, indexes: any) => {
        const availableIndexes: string[] = indexes
          .list()
          .map((index: {name: string}) => index.name);
        logger.debug(`Available Indexes:  + ${availableIndexes.join(', ')}`);
        if (availableIndexes.includes(config.index)) {
          const targetIndex = indexes.item(config.index);
          const splunkData = this.createSplunkData(guid, filename);
          this.uploadSplunkData(targetIndex, splunkData);
          logger?.debug(`Have index ${targetIndex.name}`);
        } else {
          logger.error(`Invalid Index: ${config.index}`);
          throw new Error(`Invalid Index: ${config.index}`);
        }
      });
    });
    return guid;
  }
}
