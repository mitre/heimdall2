import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';

function formatName(input: Record<string, unknown>): string {
  return `${input.type}/${input['bom-ref']}`;
}

function formatTitle(input: Record<string, unknown>): string {
  const group = input.group ? `${input.group}/` : '';
  return `${group}${input.name}`;
}

function formatLicense(input: Record<string, unknown>): string {
  let message = '';
  if (Array.isArray(input.licenses)) {
    // Join together all applicable licenses for this component
    input.licenses.map((license) => {
      message = message.concat(`${license.license.id}, `);
    });
  }
  return message.slice(0, -2);
}

function formatCodeDesc(input: Record<string, unknown>): string {
  const group = input.group ? `${input.group}/` : '';
  const version = input.version ? `@${input.version}` : '';
  return `Component ${group}${input.name}${version} is vulnerable`;
}

function formatMessage(input: Record<string, unknown>): string {
  return `Component Summary\nType: ${input.type}\nName: ${input.name}\nGroup: ${input.group}`
}

export class SBOMResults {
  data: Record<string, unknown>;
  withRaw: boolean;
  constructor(SBOMJson: string, withRaw = false) {
    this.data = JSON.parse(SBOMJson);
    this.withRaw = withRaw;
    // In-place manipulations on ingested SBOM data
    this.flattenComponents(this.data);
    this.generateIntermediary(this.data);
  }

  // Flatten any arbitrarily nested components list
  flattenComponents(data: Record<string, unknown>) {
    // Look through every component at the top level of the list
    for (const component of data.components as Record<string, unknown>[]) {
      // Identify if subcomponents exist
      if (_.has(component, 'components')) {
        // If so, pull out the subcomponents and push them to end of top level component list for further flattening
        for (const subcomponent of component.components as Record<
          string,
          unknown
        >[]) {
          (data.components as Record<string, unknown>[]).push(subcomponent);
        }
        delete component.components;
      }
    }
  }

  /*
  Copy all components that are affected by a vulnerability and place them under that corresponding vulnerability
  In-place operation on `vulnerabilities` structure but will not affect `components` structure

  Should result in the following general structure:
  {
    components: [...],
    vulnerabilities: [
      vulnerability: {
        affectedComponents: [
          component: {...},
          ...
        ],
        ...
      },
      ...
    ],
    ...
  }
  */
  generateIntermediary(data: Record<string, unknown>) {
    // Find if vulnerabilities structure exists, else skip vulnerability restructuring
    if (_.has(data, 'vulnerabilities')) {
      for (const vulnerability of data.vulnerabilities as (Record<
        string,
        unknown
      > & {affects: Record<string, unknown>[]})[]) {
        for (const id of vulnerability.affects) {
          const components = [];
          for (const component of data.components as Record<
            string,
            unknown
          >[]) {
            // Find every comoponent that is affected via listed bom-refs and copy to an affected components list
            if (component['bom-ref'] === id.ref) {
              components.push(component);
            }
          }
          // Add that affected components list to the corresponding vulnerability object
          vulnerability.affectedComponents = components;
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
            tags: {
              cweid: {path: 'cwes'}
            },
            descriptions: [
              {
                data: {path: 'published'},
                label: 'Date published'
              },
              {
                data: {path: 'updated'},
                label: 'Date updated'
              }
            ], //Insert data
            refs: [], //Insert data
            source_location: {}, //Insert data
            title: {path: 'bom-ref'},
            id: {path: 'id'},
            desc: {path: 'description'},
            impact: 0.5, //Insert data
            code: null, //Insert data
            results: [
              {
                path: 'affectedComponents',
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {transformer: formatCodeDesc},
                message: {transformer: formatMessage},
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
          auxiliary_data: [
            {
              name: 'SBOM',
              components: _.get(data, 'components'),
              dependencies: _.get(data, 'dependencies'),
              data: _.omit(data, ['components', 'dependencies'])
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
