import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {filterString} from './utils/global';
import {
  CycloneDXSoftwareBillOfMaterialSpecification,
  CycloneDXSoftwareBillOfMaterialsStandard,
  CycloneDXBillOfMaterialsStandardVulnerability,
  CycloneDXSoftwareBillOfMaterialsStandardVulnerability,
  FluffyCredits,
  PurpleCredits,
  FluffyRating,
  PurpleRating,
  MethodEnum,
  Response,
  CreationToolsLegacyElement,
  ToolsTools,
  ToolsToolsLegacy,
  FluffyTools,
  ComponentClass,
  ComponentObject
} from '../types/cyclonedx';
import {getCCIsForNISTTags} from './mappings/CciNistMapping';

const cvssMethods = ['CVSSv2', 'CVSSv3', 'CVSSv31', 'CVSSv4'] as const;
type CVSSMethodEnum = Extract<MethodEnum, (typeof cvssMethods)[number]>;

type IntermediaryComponent = Omit<
  ComponentClass | ComponentObject,
  'components'
> & {
  components?: IntermediaryComponent[];
  affectingVulnerabilities?: string[];
  isDummy?: boolean;
};

type IntermediaryVulnerability = (
  | CycloneDXBillOfMaterialsStandardVulnerability
  | CycloneDXSoftwareBillOfMaterialsStandardVulnerability
) & {
  affectedComponents?: number[];
};

type DataStorage = {
  components: IntermediaryComponent[];
  vulnerabilities: IntermediaryVulnerability[];
  raw:
    | CycloneDXSoftwareBillOfMaterialSpecification
    | CycloneDXSoftwareBillOfMaterialsStandard;
};

const CWE_NIST_MAPPING = new CweNistMapping();
const DEFAULT_NIST_TAG = ['SI-2', 'RA-5'];
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 1.0],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['info', 0.5],
  ['none', 0.0],
  ['unknown', 0.5]
]);

// Convert object type to string[] and prepend `CWE` if used directly for tag display
function formatCWETags(
  input:
    | CycloneDXBillOfMaterialsStandardVulnerability['cwes']
    | CycloneDXSoftwareBillOfMaterialsStandardVulnerability['cwes'],
  addPrefix = true
): string[] {
  return input && Array.isArray(input)
    ? input.map((cwe) => (addPrefix ? `CWE-${cwe}` : `${cwe}`))
    : [];
}

// Convert gathered CWEs to corresponding NIST 800-53s
function getNISTTags(
  input:
    | CycloneDXBillOfMaterialsStandardVulnerability['cwes']
    | CycloneDXSoftwareBillOfMaterialsStandardVulnerability['cwes']
): string[] {
  return CWE_NIST_MAPPING.nistFilter(
    formatCWETags(input, false),
    DEFAULT_NIST_TAG
  );
}

// A single SBOM vulnerability can contain multiple security ratings
// Find the max of any existing ratings and then pass to `impact`
function maxImpact(ratings: FluffyRating[] | PurpleRating[]): number {
  return ratings
    .map((rating) =>
      rating.score &&
      rating.method &&
      cvssMethods.includes(rating.method as CVSSMethodEnum) // cast required since .includes expects the parameter to be a subtype
        ? // Prefer to use CVSS-based `score` field when possible
          rating.score / 10
        : // Else interpret it from `severity` field, defaulting to medium/0.5
          (IMPACT_MAPPING.get(rating.severity?.toLowerCase() ?? '') ?? 0.5)
    )
    .reduce(
      (maxValue, newValue) =>
        // Find max of existing ratings
        maxValue > newValue ? maxValue : newValue,
      0
    );
}

// If the highest rating severity for a control is `info` or `unknown`, set the results to skipped and request a manual review
function skipSeverityInfoOrUnknown(controls: unknown[]): unknown[] {
  if (controls) {
    (controls as ExecJSON.Control[])
      // Filter to controls whose highest rating severity is either `info` or `unknown`
      .filter((control) => {
        const ratings = (_.get(control, 'tags.ratings', '') as string).split(
          / - |, /
        );
        return (
          (ratings.includes('info') || ratings.includes('unknown')) &&
          !(
            ratings.includes('critical') ||
            ratings.includes('high') ||
            ratings.includes('medium') ||
            ratings.includes('low') ||
            ratings.includes('none')
          )
        );
      })
      // For every result contained by that control, set the status to skipped and request a manual review
      .map((control) =>
        control.results.map((result) => {
          result.status = ExecJSON.ControlResultStatus.Skipped;
          result.skip_message =
            'Manual review required because a CycloneDX rating severity is set to `info` or `unknown`.';
        })
      );
  }
  return controls;
}

export class CycloneDXSBOMResults {
  data: DataStorage;
  withRaw: boolean;
  constructor(sbomJson: string, withRaw = false) {
    this.data = {
      components: [],
      vulnerabilities: [],
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
    data.components = _.cloneDeep(
      data.raw.components
    ) as IntermediaryComponent[];

    // Look through every component at the top level of the list
    for (const component of data.components) {
      // Identify if subcomponents exist
      if (component.components) {
        // If so, pull out the subcomponents and push them to end of top level component list for further flattening
        data.components.push(...component.components);
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
    data.vulnerabilities = _.cloneDeep(
      data.raw.vulnerabilities
    ) as IntermediaryVulnerability[];

    for (const vulnerability of data.vulnerabilities) {
      vulnerability.affectedComponents = [];

      vulnerability.affectedComponents.push(
        ...Array.from(data.components.entries())
          // Find every component that is affected via listed bom-refs
          .filter(([_index, component]) =>
            vulnerability.affects
              ?.map((id) => id.ref.toString())
              .includes(component['bom-ref'] as string)
          )
          // Add the index of that affected component to the corresponding vulnerability object
          .map(([index, _component]) => index)
      );

      // Also record the ID of the vulnerability in the component for use in bidirectional traversal
      for (const index of vulnerability.affectedComponents) {
        if (!data.components[index].affectingVulnerabilities) {
          data.components[index].affectingVulnerabilities = [];
        }
        (data.components[index].affectingVulnerabilities as string[]).push(
          _.get(vulnerability, 'bom-ref') as unknown as string
        );
      }
    }
  }

  // VEX by default has no component info, resulting in profile errors when parsing the vulnerabilities for OHDF
  // Fix that by adding a temporary result that refers the vulnerability back to its associated BOM
  formatVEX(data: DataStorage) {
    // Pull vulnerabilities from raw data
    data.vulnerabilities = [
      ...(_.cloneDeep(data.raw.vulnerabilities) as
        | CycloneDXBillOfMaterialsStandardVulnerability[]
        | CycloneDXSoftwareBillOfMaterialsStandardVulnerability[])
    ] as unknown as IntermediaryVulnerability[];

    for (const vulnerability of data.vulnerabilities) {
      vulnerability.affectedComponents = vulnerability.affects?.map((id) => {
        // Build a dummy component for each bom-ref identified as being affected by the vulnerability
        const dummy: IntermediaryComponent = {
          name: `${id.ref}`,
          'bom-ref': `${id.ref}`,
          isDummy: true,
          type: 'application' // a type must be provided, and "application" is the default classification
        };
        // Add that component to the corresponding vulnerability object
        data.components.push(dummy);
        // Return the index of that dummy object
        return data.components.length - 1;
      });
    }
  }

  toHdf(): ExecJSON.Execution {
    return new CycloneDXSBOMMapper(this.data, this.withRaw).toHdf();
  }
}

export class CycloneDXSBOMMapper extends BaseConverter<DataStorage> {
  withRaw: boolean;

  // Pull any keys from a given index for the stored components listing
  getComponentValueAtIndex(
    index: number,
    keys: string[]
  ): Record<string, unknown> {
    return _.pick(this.data.components[index], keys);
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
          transformer: (input: ComponentClass | ComponentObject): string =>
            _.has(input, 'bom-ref')
              ? `CycloneDX BOM Report: ${input.type}/${input['bom-ref']}`
              : 'CycloneDX BOM Report'
        },
        title: {
          path: 'raw.metadata.component',
          transformer: (input: ComponentClass | ComponentObject): string => {
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
          transformer: filterString
        },
        maintainer: {
          path: 'raw.metadata.component',
          transformer: (
            input: ComponentClass | ComponentObject
          ): string | undefined => {
            // Find organization of authors if possible
            const manufacturer = _.has(input, 'manufacturer')
              ? ` (${(input.manufacturer as Record<string, unknown>).name})`
              : '';
            // Check through every single possible field which may hold ownership over this component
            if (_.has(input, 'authors')) {
              // Join list of component authors
              return (input.authors as Record<string, unknown>[])
                .map((author) => `${author.name}${manufacturer}`)
                .join(', ');
            } else if (input.author) {
              // `author` is deprecated in v1.6 but may still appear
              return `${input.author}${manufacturer}`;
            } else {
              return undefined;
            }
          }
        },
        summary: {
          path: 'raw.metadata.component.description',
          transformer: filterString
        },
        copyright: {
          path: 'raw.metadata.component.copyright',
          transformer: filterString
        },
        license: {
          path: 'raw.metadata.component',
          transformer: (
            input: ComponentClass | ComponentObject
          ): string | undefined => {
            if (!input.licenses) {
              return undefined;
            }
            // Certain license reports only provide the license name in the `name` field
            // Check there first and then default to `id`
            return input.licenses
              ?.map((license) =>
                license?.license?.name
                  ? license.license.name
                  : license?.license?.id
              )
              .filter((identifier) => identifier)
              .join(', ');
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
                transformer: (
                  input:
                    | CycloneDXBillOfMaterialsStandardVulnerability['cwes']
                    | CycloneDXSoftwareBillOfMaterialsStandardVulnerability['cwes']
                ): string[] => getCCIsForNISTTags(getNISTTags(input))
              },
              cwe: {path: 'cwes', transformer: formatCWETags},
              'bom-ref': {
                path: 'bom-ref',
                transformer: filterString
              },
              ratings: {
                path: 'ratings',
                transformer: (
                  input: FluffyRating[] | PurpleRating[]
                ): string | undefined =>
                  input
                    ? [...input]
                        .map((rating) => {
                          const ratingSource = rating.source?.name
                            ? `${rating.source?.name} - `
                            : 'Unidentified Source - ';
                          return `${ratingSource}${rating.severity}`;
                        })
                        .join(', ')
                    : undefined
              },
              created: {
                path: 'created',
                transformer: filterString
              },
              published: {
                path: 'published',
                transformer: filterString
              },
              updated: {
                path: 'updated',
                transformer: filterString
              },
              // Workflow items will not affect `impact`
              rejected: {
                path: 'rejected',
                transformer: filterString
              },
              credits: {
                path: 'credits',
                transformer: (
                  input: FluffyCredits | PurpleCredits
                ): string | undefined =>
                  input
                    ? `${input.individuals
                        ?.map((individual) => individual.name)
                        .filter((name) => name)
                        .join(', ')}`
                    : undefined
              },
              tools: {
                path: 'tools',
                transformer: (
                  input:
                    | CreationToolsLegacyElement[]
                    | ToolsToolsLegacy[]
                    | ToolsTools
                    | FluffyTools
                ): string | undefined => {
                  if (!input) {
                    return undefined;
                  }
                  if (Array.isArray(input)) {
                    return input
                      .map((tool) => tool.name)
                      .filter((name) => name)
                      .join(', ');
                  }
                  return [
                    ...(input.components?.map((component) => component.name) ??
                      []),
                    ...(input.services?.map((component) => component.name) ??
                      [])
                  ].join(', ');
                }
              },
              // Workflow items will not affect `impact`
              'analysis.state': {
                path: 'analysis.state',
                transformer: filterString
              },
              'analysis.justification': {
                path: 'analysis.justification',
                transformer: filterString
              },
              'analysis.response': {
                path: 'analysis.response',
                transformer: (input: Response[]): string | undefined =>
                  input && input.length > 0 ? input.join(', ') : undefined
              },
              'analysis.detail': {
                path: 'analysis.detail',
                transformer: filterString
              },
              'analysis.firstIssued': {
                path: 'analysis.firstIssued',
                transformer: filterString
              },
              'analysis.lastUpdated': {
                path: 'analysis.lastUpdated',
                transformer: filterString
              }
            },
            descriptions: {
              transformer: (
                input:
                  | CycloneDXBillOfMaterialsStandardVulnerability
                  | CycloneDXSoftwareBillOfMaterialsStandardVulnerability
              ) => {
                const recommendation = input.recommendation
                  ? `Recommendation: ${input.recommendation}`
                  : '';
                // Workaround not defined by types? Use lodash for now until proper type is implemented
                const workaround = _.has(input, 'workaround')
                  ? `Workaround: ${input.workaround}`
                  : '';
                return [
                  recommendation || workaround
                    ? {
                        data: `${recommendation}\n\n${workaround}`.trim(),
                        label: 'fix'
                      }
                    : undefined,
                  _.has(input, 'proofOfConcept')
                    ? {
                        data: `Proof of concept: ${JSON.stringify(
                          _.get(input, 'proofOfConcept'),
                          null,
                          2
                        )}`,
                        label: 'check'
                      }
                    : undefined
                ].filter((subdescription) => subdescription);
              }
            } as unknown as ExecJSON.ControlDescription[],
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
              transformer: (
                input:
                  | CycloneDXBillOfMaterialsStandardVulnerability
                  | CycloneDXSoftwareBillOfMaterialsStandardVulnerability
              ): string =>
                input.description ? `${input.description}` : `${input.id}`
            },
            id: {path: 'id'},
            desc: {
              transformer: (
                input:
                  | CycloneDXBillOfMaterialsStandardVulnerability
                  | CycloneDXSoftwareBillOfMaterialsStandardVulnerability
              ): string | undefined => {
                const description = input.description
                  ? `Description: ${input.description}`
                  : '';
                const detail = input.detail ? `Detail: ${input.detail}` : '';
                return filterString(`${description}\n\n${detail}`.trim());
              }
            },
            impact: {
              transformer: (
                input:
                  | CycloneDXBillOfMaterialsStandardVulnerability
                  | CycloneDXSoftwareBillOfMaterialsStandardVulnerability
              ): number => maxImpact(input.ratings ?? [])
            },
            code: {
              transformer: (vulnerability: Record<string, unknown>): string =>
                JSON.stringify(
                  _.omit(vulnerability, 'affectedComponents'),
                  null,
                  2
                )
            },
            arrayTransformer: skipSeverityInfoOrUnknown,
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
                    const msg = Object.keys(selectComponentValues)
                      .map((key) => {
                        return Array.isArray(selectComponentValues[key])
                          ? `\n\n- ${_.capitalize(key)}: ${JSON.stringify(selectComponentValues[key], null, 2)}`
                          : `\n\n- ${_.capitalize(key)}: ${selectComponentValues[key]}`;
                      })
                      .join('');
                    return `-Component Summary-${msg}`;
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
        const components = input.components.filter(
          (component) => !component.isDummy
        );
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
