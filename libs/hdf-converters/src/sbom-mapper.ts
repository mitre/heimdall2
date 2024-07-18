import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';

function formatName(input: Record<string, unknown>): string {
  return `${_.get(input, 'type')}/${_.get(input, 'bom-ref')}`;
}

function formatTitle(input: Record<string, unknown>): string {
  const group = _.get(input, 'group') ? `${_.get(input, 'group')}/` : '';
  return `${group}${_.get(input, 'name')}`;
}

function formatLicense(input: Record<string, unknown>): string {
  let message = '';
  const licenses = _.get(input, 'licenses');
  if (Array.isArray(licenses)) {
    licenses.map((license) => {
      message = message.concat(`${license.license.id}, `);
    });
  }
  return message.slice(0, -2);
}

export class SbomMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: null //Insert data
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        name: {path: 'metadata.component', transformer: formatName},
        title: {path: 'metadata.component', transformer: formatTitle},
        version: {path: 'metadata.component.version'},
        maintainer: {path: 'metadata.component.author'},
        summary: null, //Insert data
        description: {path: 'metadata.component.description'},
        license: {path: 'metadata.component', transformer: formatLicense},
        supports: [], //Insert data
        attributes: [], //Insert data
        copyright: null, //Insert data
        copyright_email: null, //Insert data
        depends: [], //Insert data
        groups: [], //Insert data
        status: 'loaded',
        controls: [
          {
            key: 'id',
            tags: {}, //Insert data
            descriptions: [], //Insert data
            refs: [], //Insert data
            source_location: {}, //Insert data
            title: null, //Insert data
            id: '', //Insert data
            desc: null, //Insert data
            impact: 0, //Insert data
            code: null, //Insert data
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed, //Insert data
                code_desc: '', //Insert data
                message: null, //Insert data
                run_time: null, //Insert data
                start_time: '' //Insert data
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
          auxiliary_data: [
            {name: 'SBOM', data: _.omit(data, ['metadata', 'components'])}
          ],
          ...(this.withRaw && {raw: data})
        };
      }
    }
  };
  constructor(exportJson: string, withRaw = false) {
    super(JSON.parse(exportJson), true);
    this.withRaw = withRaw;
  }
}
