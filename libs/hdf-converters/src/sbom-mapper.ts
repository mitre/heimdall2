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

export class SBOMResults {
  data: Record<string, unknown>;
  withRaw: boolean;
  constructor(SBOMJson: string, withRaw = false) {
    this.data = JSON.parse(SBOMJson);
    this.withRaw = withRaw;
    this.generateIntermediary(this.data);
  }

  generateIntermediary(data: Record<string, unknown>) {
    if (
      _.has(data, 'vulnerabilities') &&
      data.vulnerabilities instanceof Array &&
      data.components instanceof Array
    ) {
      for (let vulnerability of data.vulnerabilities) {
        for (const id of vulnerability.affects) {
          const components = [];
          for (const component of data.components) {
            if (_.get(component, 'bom-ref') === id.ref) {
              components.push(component);
            }
            vulnerability['affectedComponents'] = components;
          }
        }
      }
    }
  }

  toHdf(): ExecJSON.Execution {
    return new SBOMMapper(this.data, this.withRaw).toHdf();
  }
}

export class SBOMMapper extends BaseConverter {
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
            path: 'vulnerabilities',
            key: 'id',
            tags: {}, //Insert data
            descriptions: [], //Insert data
            refs: [], //Insert data
            source_location: {}, //Insert data
            title: null, //Insert data
            id: {path: 'id'},
            desc: null, //Insert data
            impact: 0, //Insert data
            code: null, //Insert data
            results: [
              {
                path: 'affectedComponents',
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
            {
              name: 'SBOM',
              data: _.omit(data, ['metadata', 'components', 'vulnerabilities'])
            }
          ],
          ...(this.withRaw && {raw: data})
        };
      }
    }
  };
  constructor(exportJson: Record<string, unknown>, withRaw = false) {
    super(exportJson, true);
    this.withRaw = withRaw;
  }
}
