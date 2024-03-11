import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {NiktoNistMapping} from './mappings/NiktoNistMapping';
import {getCCIsForNISTTags} from './utils/global';

const NIKTO_NIST_MAPPING = new NiktoNistMapping();

function formatTitle(file: unknown): string {
  return `Nikto Target: ${projectName(file)}`;
}
function projectName(file: unknown): string {
  return `Host: ${_.get(file, 'host')} Port: ${_.get(file, 'port')}`;
}
function formatCodeDesc(vulnerability: unknown): string {
  return `URL : ${_.get(vulnerability, 'url')} Method: ${_.get(
    vulnerability,
    'method'
  )}`;
}
function nistTag(id: string): string[] {
  return NIKTO_NIST_MAPPING.nistTag(id);
}

export class NiktoMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: {transformer: projectName}
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        name: 'Nikto Website Scanner',
        title: {transformer: formatTitle},
        summary: {
          path: 'banner',
          transformer: (input: unknown): string => {
            return `Banner: ${input}`;
          }
        },
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'vulnerabilities',
            key: 'id',
            tags: {
              nist: {path: 'id', transformer: nistTag},
              cci: {
                path: 'id',
                transformer: (id: string) => getCCIsForNISTTags(nistTag(id))
              },
              ösvdb: {path: 'OSVDB'}
            },
            refs: [],
            source_location: {},
            title: {path: 'msg'},
            id: {path: 'id'},
            desc: {path: 'msg'},
            impact: 0.5,
            code: {
              transformer: (vulnerability: Record<string, unknown>): string =>
                JSON.stringify(vulnerability, null, 2)
            },
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {transformer: formatCodeDesc},
                start_time: ''
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        return {
          auxiliary_data: [
            {
              name: 'Nikto',
              data: _.omit(data, ['banner', 'host', 'port', 'vulnerabilities'])
            }
          ],
          ...(this.withRaw && {raw: data})
        };
      }
    }
  };
  constructor(niktoJson: string, withRaw = false) {
    super(JSON.parse(niktoJson));
    this.withRaw = withRaw;
  }
}
