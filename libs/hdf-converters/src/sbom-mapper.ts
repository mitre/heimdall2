import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {getCCIsForNISTTags} from './utils/global';

const CWE_NIST_MAPPING = new CweNistMapping();
const DEFAULT_NIST_TAG = ['SI-2', 'RA-5'];
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 1.0],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3]
]);

function formatCWETags(input: number[], addPrefix = true): string[] {
  const stringifiedCWE: string[] = [];
  for (const cwe of input) {
    const cweTag = addPrefix ? `CWE-${cwe}` : `${cwe}`;
    stringifiedCWE.push(cweTag);
  }
  return stringifiedCWE;
}

function getNISTTags(input: number[]): string[] {
  return CWE_NIST_MAPPING.nistFilter(
    formatCWETags(input, false),
    DEFAULT_NIST_TAG
  );
}

// A single SBOM vulnerability can contain multiple severity reports
// Need to average any existing severities and then pass to `impact`
function aggregateImpact(ratings: Record<string, unknown>[]) {
  let impact = 0;
  for (const rating of ratings) {
    const severity = IMPACT_MAPPING.get(
      (rating as {severity: string}).severity.toLowerCase()
    );
    if (severity) {
      impact += severity;
    }
  }
  // Round up aggregate impact to the 2nd decimal place
  return Math.ceil((impact / ratings.length) * 100) / 100;
}

export class SBOMResults {
  data: Record<string, unknown>;
  withRaw: boolean;
  constructor(SBOMJson: string, withRaw = false) {
    this.data = JSON.parse(SBOMJson);
    this.withRaw = withRaw;

    if (_.has(this.data, 'components')) {
      // In-place manipulations on ingested SBOM data
      this.flattenComponents(this.data);
      if (_.has(this.data, 'vulnerabilities')) {
        this.generateIntermediary(this.data);
      }
    } else if (_.has(this.data, 'vulnerabilities')) {
      // Back up operations in case we ingest VEX data instead
      this.formatVEX(this.data);
    }
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
    for (const vulnerability of data.vulnerabilities as (Record<
      string,
      unknown
    > & {affects: Record<string, unknown>[]})[]) {
      vulnerability.affectedComponents = [];
      for (const id of vulnerability.affects) {
        for (const component of data.components as Record<string, unknown>[]) {
          // Find every component that is affected via listed bom-refs and copy to an affected components list
          if (component['bom-ref'] === id.ref) {
            // Add that affected components list to the corresponding vulnerability object
            (
              vulnerability.affectedComponents as Record<string, unknown>[]
            ).push(component);
          }
        }
      }
    }
  }

  // VEX by default has no component info, resulting in profile errors when parsing the vulnerabilities for OHDF
  // Fix that by adding a temporary result that refers the vulnerability back to its associated BOM
  formatVEX(data: Record<string, unknown>) {
    for (const vulnerability of data.vulnerabilities as (Record<
      string,
      unknown
    > & {affects: Record<string, unknown>[]})[]) {
      vulnerability.affectedComponents = [];
      for (const id of vulnerability.affects) {
        // Build a dummy component for each bom-ref identified as being affected by the vulnerability
        // Add that component to the corresponding vulnerability object
        (vulnerability.affectedComponents as Record<string, unknown>[]).push({
          'bom-ref': `${id.ref}`,
          name: `${id.ref}`
        });
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
      release: HeimdallToolsVersion
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        name: {
          path: 'metadata.component',
          transformer: (input: Record<string, unknown>): string => {
            return `${input.type}/${input['bom-ref']}`;
          }
        },
        title: {
          path: 'metadata.component',
          transformer: (input: Record<string, unknown>): string => {
            const group = input.group ? `${input.group}/` : '';
            return `${group}${input.name}`;
          }
        },
        version: {path: 'metadata.component.version'},
        maintainer: {path: 'metadata.component.author'},
        description: {path: 'metadata.component.description'},
        license: {
          path: 'metadata.component',
          transformer: (input: Record<string, unknown>): string => {
            let message = '';
            if (Array.isArray(input.licenses)) {
              // Join together all applicable licenses for this component
              input.licenses.map((license) => {
                message = message.concat(`${license.license.id}, `);
              });
            }
            return message.slice(0, -2);
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
              nist: {
                path: 'cwes',
                transformer: getNISTTags
              },
              cci: {
                path: 'cwes',
                transformer: (input: number[]) =>
                  getCCIsForNISTTags(getNISTTags(input))
              },
              cwe: {path: 'cwes', transformer: formatCWETags}
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
            ],
            refs: [
              {
                path: 'source',
                transformer: (data: Record<string, unknown>) => {
                  return {ref: [data]};
                }
              }
            ],
            source_location: {},
            title: {path: 'bom-ref'},
            id: {path: 'id'},
            desc: {path: 'description'},
            impact: {path: 'ratings', transformer: aggregateImpact},
            code: {
              transformer: (vulnerability: Record<string, unknown>): string => {
                return JSON.stringify(
                  _.omit(vulnerability, 'affectedComponents'),
                  null,
                  2
                );
              }
            },
            results: [
              {
                path: 'affectedComponents',
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {
                  transformer: (input: Record<string, unknown>): string => {
                    const group = input.group ? `${input.group}/` : '';
                    const version = input.version ? `@${input.version}` : '';
                    return `Component ${group}${input.name}${version} is vulnerable`;
                  }
                },
                message: {
                  transformer: (input: Record<string, unknown>): string => {
                    let msg = 'Component Summary';
                    for (const item in input) {
                      if (input[item] instanceof Array) {
                        msg += `\n- ${item}: ${JSON.stringify(input[item], null, 2).replace(/\"/g, '')}`;
                      } else {
                        msg += `\n- ${item}: ${input[item]}`;
                      }
                    }
                    return msg;
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
          auxiliary_data: [
            {
              name: 'SBOM',
              components: _.get(data, 'components'),
              dependencies: _.get(data, 'dependencies'),
              data: _.omit(data, [
                'components',
                'vulnerabilities',
                'dependencies'
              ])
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
