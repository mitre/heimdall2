import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {getCCIsForNISTTags} from './utils/global';
import {
  RatingRepository,
  Vulnerability,
  VulnerabilityRepository
} from '@cyclonedx/cyclonedx-library/dist.d/models/vulnerability';
import {CweRepository} from '@cyclonedx/cyclonedx-library/dist.d/types';
import {Severity} from '@cyclonedx/cyclonedx-library/dist.d/enums/vulnerability';
import {
  Component,
  ComponentRepository,
  OptionalBomProperties,
  OptionalComponentProperties
} from '@cyclonedx/cyclonedx-library/dist.d/models';

type IntermediaryComponent = Omit<OptionalComponentProperties, 'components'> & {
  components?: IntermediaryComponent[];
  affectingVulnerabilities?: string[];
  name: string;
  'bom-ref'?: string;
  isDummy?: boolean;
};

type IntermediaryVulnerability = Vulnerability & {
  affectedComponents?: number[];
};

type DataStorage = {
  components?: IntermediaryComponent[];
  vulnerabilities?: IntermediaryVulnerability[];
  raw: OptionalBomProperties;
};

const CWE_NIST_MAPPING = new CweNistMapping();
const DEFAULT_NIST_TAG = ['SI-2', 'RA-5'];
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 1.0],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['info', 0.0],
  ['none', 0.0],
  ['unknown', 0.0]
]);

// Convert object type to string[] and prepend `CWE` if used directly for tag display
function formatCWETags(input: CweRepository, addPrefix = true): string[] {
  return [...input].map((cwe) => (addPrefix ? `CWE-${cwe}` : `${cwe}`));
}

// Convert gathered CWEs to corresponding NIST 800-53s
function getNISTTags(input: CweRepository): string[] {
  return CWE_NIST_MAPPING.nistFilter(
    formatCWETags(input, false),
    DEFAULT_NIST_TAG
  );
}

// A single SBOM vulnerability can contain multiple security ratings
// Find the max of any existing ratings and then pass to `impact`
function maxImpact(ratings: RatingRepository): number {
  let impact = 0;
  for (const rating of ratings) {
    // Prefer to use CVSS-based `score` field when possible
    if (rating.score && _.get(rating, 'method') == 'CVSSv31') {
      impact = rating.score / 10 > impact ? rating.score / 10 : impact;
    } else {
      // Else interpret it from `severity` field
      const severity = IMPACT_MAPPING.get(
        (rating.severity as Severity).toLowerCase()
      ) as number;
      impact = severity > impact ? severity : impact;
    }
  }
  return impact;
}

export class CycloneDXSBOMResults {
  data: DataStorage;
  withRaw: boolean;
  constructor(sbomJson: string, withRaw = false) {
    this.data = {
      raw: JSON.parse(sbomJson)
    };
    this.withRaw = withRaw;

    if (this.data.raw.components) {
      // We know this is SBOM data
      this.flattenComponents(this.data);
      if (this.data.raw.vulnerabilities) {
        // If this SBOM data has a vulnerabilities field, we can create an intermediary object
        this.generateIntermediary(this.data);
      }
    } else if (this.data.raw.vulnerabilities) {
      // Back up in case we ingest VEX data instead
      this.formatVEX(this.data);
    } else {
      throw new Error(
        'Unrecognized CycloneDX format detected. We currently only support SBOM and VEX formats.'
      );
    }
  }

  // Flatten any arbitrarily nested components list
  flattenComponents(data: DataStorage) {
    // Pull components from raw data
    data.components = [
      ...(_.cloneDeep(data.raw.components) as ComponentRepository)
    ] as unknown as IntermediaryComponent[];

    // Look through every component at the top level of the list
    for (const component of data.components) {
      // Identify if subcomponents exist
      if (component.components) {
        // If so, pull out the subcomponents and push them to end of top level component list for further flattening
        for (const subcomponent of component.components) {
          data.components.push(subcomponent);
        }
        delete component.components;
      }
    }
  }

  /*
  Copy the indices of all components that are affected by a vulnerability and place them under that corresponding vulnerability
  Also note in each component the IDs of the vulnerabilities that affect them
  This allows for bidirectional traversal in SBOM view

  Should result in the following general structure:
  {
    components: [
      component: {
        affectingVulnerabilities: [ // Added field
          vulnID,
          ...
        ],
        ...
      },
      ...
    ],
    vulnerabilities: [
      vulnerability: {
        affectedComponents: [       // Added field
          componentIndex,
          ...
        ],
        ...
      },
      ...
    ],
    ...
  }
  */
  generateIntermediary(data: DataStorage) {
    // Pull vulnerabilities from raw data
    data.vulnerabilities = [
      ...(_.cloneDeep(data.raw.vulnerabilities) as VulnerabilityRepository)
    ] as unknown as IntermediaryVulnerability[];

    for (const vulnerability of data.vulnerabilities) {
      vulnerability.affectedComponents = [];
      for (const id of vulnerability.affects) {
        for (const component of data.components as IntermediaryComponent[]) {
          // Find every component that is affected via listed bom-refs
          if (_.get(component, 'bom-ref') === id.ref.toString()) {
            // Add the index of that affected component to the corresponding vulnerability object
            vulnerability.affectedComponents.push(
              (data.components as IntermediaryComponent[]).indexOf(component)
            );

            if (!component.affectingVulnerabilities) {
              component.affectingVulnerabilities = [];
            }
            // Also record the ID of the vulnerability in the component for use in bidirectional traversal
            component.affectingVulnerabilities.push(
              _.get(vulnerability, 'bom-ref') as unknown as string
            );
          }
        }
      }
    }
  }

  // VEX by default has no component info, resulting in profile errors when parsing the vulnerabilities for OHDF
  // Fix that by adding a temporary result that refers the vulnerability back to its associated BOM
  formatVEX(data: DataStorage) {
    // Pull vulnerabilities from raw data
    data.vulnerabilities = [
      ...(_.cloneDeep(data.raw.vulnerabilities) as VulnerabilityRepository)
    ] as unknown as IntermediaryVulnerability[];
    // Have an empty components listing since this is a VEX
    data.components = [];

    for (const vulnerability of data.vulnerabilities) {
      vulnerability.affectedComponents = [...vulnerability.affects].map(
        (id) => {
          // Build a dummy component for each bom-ref identified as being affected by the vulnerability
          const dummy: IntermediaryComponent = {
            name: `${id.ref}`,
            'bom-ref': `${id.ref}`,
            isDummy: true
          };
          // Add that component to the corresponding vulnerability object
          (data.components as IntermediaryComponent[]).push(dummy);
          // Return the index of that dummy object
          return (data.components as IntermediaryComponent[]).indexOf(dummy);
        }
      );
    }
  }

  toHdf(): ExecJSON.Execution {
    return new CycloneDXSBOMMapper(this.data, this.withRaw).toHdf();
  }
}

export class CycloneDXSBOMMapper extends BaseConverter {
  withRaw: boolean;

  // Pull any keys from a given index for the stored components listing
  getComponentValueAtIndex(
    index: number,
    keys: string[]
  ): Record<string, unknown> {
    return _.pick(
      (this.data.components as IntermediaryComponent[])[index],
      keys
    );
  }

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
          path: 'raw.metadata.component',
          transformer: (input: Record<string, unknown>): string =>
            input['bom-ref']
              ? `CycloneDX BOM Report: ${input.type}/${input['bom-ref']}`
              : 'CycloneDX BOM Report'
        },
        title: {
          path: 'raw.metadata.component',
          transformer: (input: Component): string => {
            if (input.name) {
              const group = input.group ? `${input.group}/` : '';
              return `${group}${input.name} CycloneDX BOM Report`;
            } else {
              return 'CycloneDX BOM Report';
            }
          }
        },
        version: {
          path: 'raw.metadata.component.version',
          transformer: (input: string): string | undefined =>
            input ? `${input}` : undefined
        },
        maintainer: {
          path: 'raw.metadata.component',
          transformer: (input: Record<string, unknown>): string | undefined => {
            // Check through every single possible field which may hold ownership over this component
            if (input.author) {
              // `author` is deprecated in v1.6 but may still appear
              return `${input.author}`;
            } else if (input.authors) {
              // Join list of component authors
              let msg = '';
              for (const author of input.authors as Record<string, unknown>[]) {
                msg += `${author.name}, `;
              }
              return msg.slice(0, -2);
            } else if (input.manufacturer) {
              // If we can't pinpoint the exact authors, resort to the organization
              return `${(input.manufacturer as Record<string, unknown>).name}`;
            } else {
              return undefined;
            }
          }
        },
        summary: {
          path: 'raw.metadata.component',
          transformer: (input: Component): string | undefined =>
            input.description ? `${input.description}` : undefined
        },
        copyright: {
          path: 'raw.metadata.component',
          transformer: (input: Component): string | undefined =>
            input.copyright ? `${input.copyright}` : undefined
        },
        license: {
          path: 'raw.metadata.component',
          transformer: (input: Component): string | undefined => {
            if (input.licenses) {
              // Certain license reports only provide the license name in the `name` field
              // Check there first and then default to `id`
              return [...input.licenses]
                .map((license) =>
                  _.has(license, 'license.name')
                    ? _.get(license, 'license.name')
                    : _.get(license, 'license.id')
                )
                .join(', ');
            }
            // If there are no found licenses, remove field
            return undefined;
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
                transformer: (input: CweRepository): string[] =>
                  getCCIsForNISTTags(getNISTTags(input))
              },
              cwe: {path: 'cwes', transformer: formatCWETags},
              created: {path: 'created'},
              published: {path: 'published'},
              updated: {path: 'updated'},
              rejected: {path: 'rejected'}
            },
            descriptions: [
              {
                path: 'detail',
                transformer: (input: Record<string, unknown>) =>
                  input ? {data: input, label: 'Detail'} : undefined
              } as unknown as ExecJSON.ControlDescription,
              {
                path: 'recommendation',
                transformer: (input: string) =>
                  input ? {data: input, label: 'Recommendation'} : undefined
              } as unknown as ExecJSON.ControlDescription,
              {
                path: 'workaround',
                transformer: (input: string) =>
                  input ? {data: input, label: 'Workaround'} : undefined
              } as unknown as ExecJSON.ControlDescription,
              {
                path: 'proofOfConcept',
                transformer: (input: Record<string, unknown>) =>
                  input
                    ? {
                        data: JSON.stringify(input, null, 2),
                        label: 'Proof of concept'
                      }
                    : undefined
              } as unknown as ExecJSON.ControlDescription,
              {
                path: 'credits',
                transformer: (input: Record<string, unknown>) =>
                  input
                    ? {data: JSON.stringify(input, null, 2), label: 'Credits'}
                    : undefined
              } as unknown as ExecJSON.ControlDescription,
              {
                path: 'tools',
                transformer: (input: Record<string, unknown>) =>
                  input
                    ? {data: JSON.stringify(input, null, 2), label: 'Tools'}
                    : undefined
              } as unknown as ExecJSON.ControlDescription,
              {
                path: 'analysis',
                transformer: (input: Record<string, unknown>) =>
                  input
                    ? {data: JSON.stringify(input, null, 2), label: 'Analysis'}
                    : undefined
              } as unknown as ExecJSON.ControlDescription
            ],
            refs: [
              {
                transformer: (
                  input: Record<string, unknown>
                ): Record<string, unknown> => {
                  const searchFor = ['source', 'references', 'advisories'];
                  const ref = searchFor
                    .filter((key) => input.hasOwnProperty(key))
                    .map((key) => _.pick(input, key));
                  return {ref: ref};
                }
              }
            ],
            source_location: {},
            title: {
              // Give description as title if possible
              transformer: (input: Record<string, unknown>): string =>
                input.description ? `${input.description}` : `${input.id}`
            },
            id: {path: 'id'},
            desc: {
              path: 'description',
              transformer: (
                input: Record<string, unknown>
              ): string | undefined => (input ? `${input}` : undefined)
            },
            impact: {path: 'ratings', transformer: maxImpact},
            code: {
              transformer: (vulnerability: Record<string, unknown>): string =>
                JSON.stringify(
                  _.omit(vulnerability, 'affectedComponents'),
                  null,
                  2
                )
            },
            results: [
              {
                path: 'affectedComponents',
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {
                  transformer: (index: number): string => {
                    const selectComponentValues = this.getComponentValueAtIndex(
                      index,
                      ['group', 'version', 'name']
                    );
                    const group = _.has(selectComponentValues, 'group')
                      ? `${selectComponentValues.group}/`
                      : '';
                    const version = _.has(selectComponentValues, 'version')
                      ? `@${selectComponentValues.version}`
                      : '';
                    return `Component ${group}${_.get(selectComponentValues, 'name')}${version} is vulnerable`;
                  }
                },
                message: {
                  transformer: (index: number): string => {
                    // Selectively pick out fields to display; full components are listed in full component structure
                    const selectComponentValues = this.getComponentValueAtIndex(
                      index,
                      [
                        'type',
                        'mime-type',
                        'bom-ref',
                        'supplier',
                        'manufacturer',
                        'authors', // Replaces `author` in v1.6
                        'author', // Deprecated in v1.6
                        'publisher',
                        'group',
                        'name',
                        'version',
                        'description',
                        'licenses',
                        'copyright'
                      ]
                    );
                    let msg = '-Component Summary-';
                    for (const item in selectComponentValues) {
                      if (_.get(selectComponentValues, item) instanceof Array) {
                        msg += `\n\n- ${_.capitalize(item)}: ${JSON.stringify(_.get(selectComponentValues, item), null, 2).replace(/"/g, '')}`;
                      } else {
                        msg += `\n\n- ${_.capitalize(item)}: ${_.get(selectComponentValues, item)}`;
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
      transformer: (input: DataStorage): Record<string, unknown> => {
        // VEX files will generate dummy components for control results
        // Filter them out for the proper components listing
        const components = (
          _.get(input, 'components') as IntermediaryComponent[]
        ).filter((component) => !component.isDummy);
        return {
          auxiliary_data: [
            {
              name: 'SBOM',
              components: components.length ? components : undefined,
              dependencies: _.get(input, 'raw.dependencies'),
              data: _.omit(input.raw, [
                'components',
                'vulnerabilities',
                'dependencies'
              ])
            }
          ],
          ...(this.withRaw && {raw: input.raw})
        };
      }
    }
  };
  constructor(exportJson: DataStorage, withRaw = false) {
    super(exportJson, true);
    this.withRaw = withRaw;
  }
}
