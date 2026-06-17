import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type { ILookupPath, MappedTransform } from './base-converter';
import { BaseConverter } from './base-converter';
import { NiktoNistMapping } from './mappings/NiktoNistMapping';
import { getCCIsForNISTTags, HeimdallToolsVersion } from './utils/global';

const NIKTO_NIST_MAPPING = new NiktoNistMapping();

export class NiktoMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        return {
          auxiliary_data: [
            {
              data: _.omit(data, ['banner', 'host', 'port', 'vulnerabilities']),
              name: 'Nikto',
            },
          ],
          ...(this.withRaw && { raw: data }),
        };
      },
    },
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: { transformer: projectName },
    },
    profiles: [
      {
        attributes: [],
        controls: [
          {
            code: {
              transformer: (vulnerability: Record<string, unknown>): string =>
                JSON.stringify(vulnerability, null, 2),
            },
            desc: { path: 'msg' },
            id: { path: 'id' },
            impact: 0.5,
            key: 'id',
            path: 'vulnerabilities',
            refs: [],
            results: [
              {
                code_desc: { transformer: formatCodeDesc },
                start_time: '',
                status: ExecJSON.ControlResultStatus.Failed,
              },
            ],
            source_location: {},
            tags: {
              cci: {
                path: 'id',
                transformer: (id: string) => getCCIsForNISTTags(nistTag(id)),
              },
              nist: { path: 'id', transformer: nistTag },
              ösvdb: { path: 'OSVDB' },
            },
            title: { path: 'msg' },
          },
        ],
        groups: [],
        name: 'Nikto Website Scanner',
        sha256: '',
        status: 'loaded',
        summary: {
          path: 'banner',
          transformer: (input: unknown): string => {
            return `Banner: ${input}`;
          },
        },
        supports: [],
        title: { transformer: formatTitle },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  constructor(niktoJson: string, withRaw = false) {
    super(JSON.parse(niktoJson));
    this.withRaw = withRaw;
  }
}
function formatCodeDesc(vulnerability: unknown): string {
  return `URL : ${_.get(vulnerability, 'url')} Method: ${_.get(
    vulnerability,
    'method',
  )}`;
}
function formatTitle(file: unknown): string {
  return `Nikto Target: ${projectName(file)}`;
}
function nistTag(id: string): string[] {
  return NIKTO_NIST_MAPPING.nistTag(id);
}

function projectName(file: unknown): string {
  return `Host: ${_.get(file, 'host')} Port: ${_.get(file, 'port')}`;
}
