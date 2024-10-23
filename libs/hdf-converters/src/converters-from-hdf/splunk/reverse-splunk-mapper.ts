import axios, {AxiosInstance, AxiosResponse} from 'axios';
import {
  ContextualizedControl,
  ContextualizedEvaluation,
  ContextualizedProfile,
  ExecJSON
} from 'inspecjs';
import * as _ from 'lodash';
import {Logger} from 'winston';
import {SplunkConfig} from '../../../types/splunk-config-types';
import {SplunkControl} from '../../../types/splunk-control-types';
import {SplunkProfile} from '../../../types/splunk-profile-types';
import {SplunkReport} from '../../../types/splunk-report-types';
import {MappedTransform} from '../../base-converter';
import {
  createWinstonLogger,
  ensureContextualizedEvaluation
} from '../../utils/global';
import {
  checkSplunkCredentials,
  generateHostname,
  handleSplunkErrorResponse
} from '../../utils/splunk-tools';
import {FromAnyBaseConverter} from '../reverse-any-base-converter';
import {ILookupPathFH} from '../reverse-base-converter';

const HDF_SPLUNK_SCHEMA = '1.1';
const MAPPER_NAME = 'HDF2Splunk';
const UPLOAD_CHUNK_SIZE = 100;

export type SplunkData = {
  profiles: SplunkProfile[];
  controls: SplunkControl[];
  reports: SplunkReport[];
};

let logger = createWinstonLogger('HDF2Splunk', 'INFO');

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
    passthrough: _.get(execution, 'data.passthrough'),
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
    if (profile.data.depends) {
      for (const dependency of profile.data.depends) {
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
      }
    }
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
      path: 'data.parent_profile'
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
      status: {
        transformer: (data: ContextualizedControl) => {
          if (
            data.hdf.segments?.length === 0 &&
            data.extendsFrom.length !== 0
          ) {
            return 'Overlaid Control';
          } else {
            return data.hdf.status;
          }
        }
      },
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
          for (const item of data) {
            descObjects[item['label']] = item['data'];
          }
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
  declare mappings?: MappedTransform<SplunkData, ILookupPathFH>;
  contextualizedEvaluation?: ContextualizedEvaluation;
  axiosInstance: AxiosInstance;

  constructor(
    data: ExecJSON.Execution | ContextualizedEvaluation,
    logService?: Logger,
    loggingLevel?: string
  ) {
    if (logService) {
      logger = logService;
    } else {
      logger = createWinstonLogger(MAPPER_NAME, loggingLevel || 'debug');
    }
    super(ensureContextualizedEvaluation(data));
    this.axiosInstance = axios.create({params: {output_mode: 'json'}});
    logger.debug(`Initialized ${this.constructor.name} successfully`);
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
    for (const profile of this.data.contains) {
      splunkData.profiles.push(
        new FromHDFProfileToSplunkProfileMapper(
          profile,
          filename,
          guid
        ).toSplunkProfile() as SplunkProfile
      );
      for (const control of profile.contains) {
        splunkData.controls.push(
          new FromHDFControlToSplunkControlMapper(
            control,
            profile,
            this.data,
            filename,
            guid
          ).toSplunkControl() as SplunkControl
        );
      }
    }
    return splunkData;
  }

  async uploadSplunkData(
    config: SplunkConfig,
    targetIndex: any,
    splunkData: SplunkData
  ): Promise<void> {
    const hostname = generateHostname(config);
    this.axiosInstance.defaults.params['sourcetype'] = MAPPER_NAME;
    this.axiosInstance.defaults.params['index'] = targetIndex.name;

    try {
      // Upload execution event
      const execEvents = splunkData.reports.map((report) => {
        return this.axiosInstance
          .post(`${hostname}/services/receivers/simple`, JSON.stringify(report))
          .then(() => {
            logger.verbose(
              `Successfully uploaded execution for ${report.meta.filename}`
            );
          });
      });
      await Promise.all(execEvents);

      // Upload profile event(s)
      // \r\n Is the default LINE_BREAKER for splunk, this is very poorly documented.
      // See https://docs.splunk.com/Documentation/StreamProcessor/standard/FunctionReference/LineBreak
      await this.axiosInstance.post(
        `${hostname}/services/receivers/simple`,
        splunkData.profiles.map((profile) => JSON.stringify(profile)).join('\n')
      );
      logger.verbose(
        `Successfully uploaded ${splunkData.profiles.length} profile layer(s)`
      );

      // Upload control event(s)
      const controlEvents = _.chunk(splunkData.controls, UPLOAD_CHUNK_SIZE).map(
        (chunk) => {
          return this.axiosInstance
            .post(
              `${hostname}/services/receivers/simple`,
              chunk.map((control) => JSON.stringify(control)).join('\n')
            )
            .then(() =>
              logger.verbose(`Successfully uploaded ${chunk.length} control(s)`)
            );
        }
      );
      await Promise.all(controlEvents);
    } catch (error) {
      throw new Error(handleSplunkErrorResponse(error));
    }
  }

  async toSplunk(config: SplunkConfig, filename: string): Promise<string> {
    const hostname = generateHostname(config);
    // returnCount specifies the number of found results to return, if set to 0 returns all available data
    // Per https://docs.splunk.com/Documentation/Splunk/9.0.5/RESTREF/RESTintrospect#data.2Findexes
    const returnCount = 0;
    let indexResponse: AxiosResponse;

    logger.info(
      `Logging into Splunk instance at ${hostname} with user ${config.username}`
    );
    logger.verbose(`Found designated file to transfer: ${filename}`);
    const guid = createGUID(30);
    logger.verbose(`Using GUID: ${guid}`);

    // Attempt to authenticate using given credentials
    const authResponse = await checkSplunkCredentials(config);
    this.axiosInstance.defaults.headers.common['Authorization'] =
      `Bearer ${authResponse}`;

    // Request all available indexes
    try {
      indexResponse = await this.axiosInstance.get(
        `${hostname}/services/data/indexes`,
        {
          params: {count: returnCount}
        }
      );
    } catch (error) {
      throw new Error(
        `Failed to request indexes - ${handleSplunkErrorResponse(error)}`
      );
    }

    // Check if index request reponse schema is valid
    if (!_.has(indexResponse, ['data', 'entry'])) {
      throw new Error(
        'Failed to request indexes - Malformed index reponse received'
      );
    }

    // Report provided indexes
    const indexes = indexResponse.data.entry;
    if (indexes.length <= 0) {
      throw new Error(
        'Unable to retrieve available indexes, double-check your scheme configuration and try again'
      );
    } else {
      const indexNames: string[] = indexes.map(
        (index: {name: string}) => index.name
      );
      logger.verbose(`Available indexes: ${indexNames.join(', ')}`);

      // Parse available indexes for user desired index
      if (indexNames.includes(config.index)) {
        const targetIndex = indexes.filter(
          (index: {name: string}) => index.name === config.index
        )[0];
        logger.verbose(`Found index: ${targetIndex.name}`);

        // Post given file(s) to identified index
        const splunkData = this.createSplunkData(guid, filename);

        try {
          await this.uploadSplunkData(config, targetIndex, splunkData);
        } catch (error) {
          throw new Error(
            `Failed to upload to Splunk - ${handleSplunkErrorResponse(error)}`
          );
        }
        logger.info(`Successfully uploaded to ${config.index}`);
        return guid;
      } else {
        throw new Error(`Invalid index - ${config.index}`);
      }
    }
  }
}
