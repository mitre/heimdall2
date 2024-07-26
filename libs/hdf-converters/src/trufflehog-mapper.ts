import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';

export class TrufflehogMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        name: {path: 'wrapper[0].SourceName'},
        title: {path: 'wrapper[0].SourceName'},
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'wrapper',
            key: 'id',
            tags: {
              nist: 'IA-5(7)',
              cci: ['CCI-004069', 'CCI-000202', 'CCI-000203', 'CCI-002367'],
              severity: 'medium'
            },
            refs: [],
            source_location: {},
            title: {
              transformer: (data: Record<string, unknown>): string => {
                return (
                  _.get(data, 'DetectorName') + '_' + _.get(data, 'DecoderName')
                );
              }
            },
            id: {
              transformer: (data: Record<string, unknown>): string => {
                return (
                  _.get(data, 'DetectorType') + '_' + _.get(data, 'DecoderName')
                );
              }
            },
            desc: {
              transformer: (data: Record<string, unknown>): string => {
                return (
                  'Found ' +
                  _.get(data, 'DetectorName') +
                  ' secret using ' +
                  _.get(data, 'DecoderName') +
                  ' decoder'
                );
              }
            },
            impact: 0.5,
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {
                  transformer: (data: Record<string, unknown>): string => {
                    return `${JSON.stringify(_.get(data, 'SourceMetadata'), null, 2)}`;
                  }
                },
                message: {
                  transformer: (data: Record<string, unknown>): string => {
                    return `${JSON.stringify(_.omit(data, 'SourceMetadata'), null, 2)}`;
                  }
                },
                start_time: ''
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (data: Record<string, any>): Record<string, unknown> => {
        return {
          ...(this.withRaw && {raw: data})
        };
      }
    }
  };
  constructor(exportJson: string, withRaw = false) {
    super({wrapper: JSON.parse(exportJson)}, true);
    this.withRaw = withRaw;
  }
}
