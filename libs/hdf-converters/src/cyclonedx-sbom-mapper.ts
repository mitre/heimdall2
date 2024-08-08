import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {getCCIsForNISTTags} from './utils/global';
import {RatingRepository} from '@cyclonedx/cyclonedx-library/dist.d/models/vulnerability';
import {CweRepository} from '@cyclonedx/cyclonedx-library/dist.d/types';

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

function formatCWETags(input: CweRepository, addPrefix = true): string[] {
  return [...input].map((cwe) => (addPrefix ? `CWE-${cwe}` : `${cwe}`));
}

function getNISTTags(input: CweRepository): string[] {
  return CWE_NIST_MAPPING.nistFilter(
    formatCWETags(input, false),
    DEFAULT_NIST_TAG
  );
}

// A single SBOM vulnerability can contain multiple security ratings
// Find the max of any existing ratings and then pass to `impact`
function aggregateImpact(ratings: RatingRepository): number {
  let impact = 0;
  for (const rating of ratings) {
    // Prefer to use CVSS-based `score` field when possible
    if (rating.score && _.get(rating, 'method') == 'CVSSv31') {
      impact = rating.score / 10 > impact ? rating.score / 10 : impact;
    } else {
      // Else interpret it from `severity` field
      if (rating.severity) {
        const severity = IMPACT_MAPPING.get(
          rating.severity.toLowerCase()
        ) as number;
        impact = severity > impact ? severity : impact;
      }
    }
  }
  return impact;
}

export class CycloneDXSBOMResults {
  data: Record<string, unknown>;
  withRaw: boolean;
  constructor(sbomJson: string, withRaw = false) {
    this.data = JSON.parse(sbomJson);
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
    } else {
      throw new Error(
        'Unrecognized CycloneDX format detected. We currently only support SBOM and VEX formats.'
      );
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
          // Find every component that is affected via listed bom-refs
          if (component['bom-ref'] === id.ref) {
            // Add that affected component to the corresponding vulnerability object
            // Selectively pick out fields to display; full components are listed in full component structure
            (
              vulnerability.affectedComponents as Record<string, unknown>[]
            ).push(
              _.pick(component, [
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
              ])
            );

            if (!component.affectingVulnerabilities) {
              component.affectingVulnerabilities = [];
            }
            // Also record the ID of the vulnerability in the component for use in bidirectional traversal
            (component.affectingVulnerabilities as string[]).push(
              vulnerability['bom-ref'] as string
            );
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
    return new CycloneDXSBOMMapper(this.data, this.withRaw).toHdf();
  }
}

export class CycloneDXSBOMMapper extends BaseConverter {
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
          transformer: (input: Record<string, unknown>): string =>
            input['bom-ref']
              ? `CycloneDX BOM Report: ${input.type}/${input['bom-ref']}`
              : 'CycloneDX BOM Report'
        },
        title: {
          path: 'metadata.component',
          transformer: (input: Record<string, unknown>): string => {
            if (input.name) {
              const group = input.group ? `${input.group}/` : '';
              return `${group}${input.name} CycloneDX BOM Report`;
            } else {
              return 'CycloneDX BOM Report';
            }
          }
        },
        version: {
          path: 'metadata.component.version',
          transformer: (input: Record<string, unknown>): string | undefined =>
            input ? `${input}` : undefined
        },
        maintainer: {
          path: 'metadata.component',
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
          path: 'metadata.component',
          transformer: (input: Record<string, unknown>): string | undefined =>
            input.description ? `${input.description}` : undefined
        },
        copyright: {
          path: 'metadata.component',
          transformer: (input: Record<string, unknown>): string | undefined =>
            input.copyright ? `${input.copyright}` : undefined
        },
        license: {
          path: 'metadata.component',
          transformer: (input: Record<string, unknown>): string | undefined => {
            let message = '';
            if (Array.isArray(input.licenses)) {
              // Join together all applicable licenses for this component
              input.licenses.map((license) => {
                message = message.concat(`${license.license.id}, `);
              });
              return message.slice(0, -2);
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
              cwe: {path: 'cwes', transformer: formatCWETags}
            },
            descriptions: [
              {
                path: 'detail',
                transformer: (
                  input: Record<string, unknown>
                ): Record<string, unknown> | undefined =>
                  input ? {data: input, label: 'Detail'} : undefined
              } as unknown as ExecJSON.ControlDescription,
              {
                path: 'recommendation',
                transformer: (
                  input: Record<string, unknown>
                ): Record<string, unknown> | undefined =>
                  input ? {data: input, label: 'Recommendation'} : undefined
              } as unknown as ExecJSON.ControlDescription,
              {
                path: 'workaround',
                transformer: (
                  input: Record<string, unknown>
                ): Record<string, unknown> | undefined =>
                  input ? {data: input, label: 'Workaround'} : undefined
              } as unknown as ExecJSON.ControlDescription,
              {
                path: 'proofOfConcept',
                transformer: (
                  input: Record<string, unknown>
                ): Record<string, unknown> | undefined =>
                  input
                    ? {
                        data: JSON.stringify(input, null, 2),
                        label: 'Proof of concept'
                      }
                    : undefined
              } as unknown as ExecJSON.ControlDescription,
              {
                path: 'created',
                transformer: (
                  input: Record<string, unknown>
                ): Record<string, unknown> | undefined =>
                  input ? {data: input, label: 'Date created'} : undefined
              } as unknown as ExecJSON.ControlDescription,
              {
                path: 'published',
                transformer: (
                  input: Record<string, unknown>
                ): Record<string, unknown> | undefined =>
                  input ? {data: input, label: 'Date published'} : undefined
              } as unknown as ExecJSON.ControlDescription,
              {
                path: 'updated',
                transformer: (
                  input: Record<string, unknown>
                ): Record<string, unknown> | undefined =>
                  input ? {data: input, label: 'Date updated'} : undefined
              } as unknown as ExecJSON.ControlDescription,
              {
                path: 'rejected',
                transformer: (
                  input: Record<string, unknown>
                ): Record<string, unknown> | undefined =>
                  input ? {data: input, label: 'Date rejected'} : undefined
              } as unknown as ExecJSON.ControlDescription,
              {
                path: 'credits',
                transformer: (
                  input: Record<string, unknown>
                ): Record<string, unknown> | undefined =>
                  input
                    ? {data: JSON.stringify(input, null, 2), label: 'Credits'}
                    : undefined
              } as unknown as ExecJSON.ControlDescription,
              {
                path: 'tools',
                transformer: (
                  input: Record<string, unknown>
                ): Record<string, unknown> | undefined =>
                  input
                    ? {data: JSON.stringify(input, null, 2), label: 'Tools'}
                    : undefined
              } as unknown as ExecJSON.ControlDescription,
              {
                path: 'analysis',
                transformer: (
                  input: Record<string, unknown>
                ): Record<string, unknown> | undefined =>
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
                  const ref = [];
                  for (const key of searchFor) {
                    if (input[key]) {
                      ref.push(input[key] as Record<string, unknown>);
                    }
                  }
                  return {ref: ref};
                }
              }
            ],
            source_location: {},
            title: {
              // Give description as title if possible
              // Cut off description after certain word count for frontend display on smaller screens
              transformer: (input: Record<string, unknown>): string => {
                if (input.description) {
                  return (input.description as string).split(' ').length > 20
                    ? `${(input.description as string).split(' ').splice(0, 20).join(' ')}...`
                    : `${input.description}`;
                } else {
                  return `${input.id}`;
                }
              }
            },
            id: {path: 'id'},
            desc: {
              path: 'description',
              transformer: (
                input: Record<string, unknown>
              ): string | undefined => (input ? `${input}` : undefined)
            },
            impact: {path: 'ratings', transformer: aggregateImpact},
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
                  transformer: (input: Record<string, unknown>): string => {
                    const group = input.group ? `${input.group}/` : '';
                    const version = input.version ? `@${input.version}` : '';
                    return `Component ${group}${input.name}${version} is vulnerable`;
                  }
                },
                message: {
                  transformer: (input: Record<string, unknown>): string => {
                    let msg = '-Component Summary-';
                    for (const item in input) {
                      if (input[item] instanceof Array) {
                        msg += `\n\n- ${_.capitalize(item)}: ${JSON.stringify(input[item], null, 2).replace(/"/g, '')}`;
                      } else {
                        msg += `\n\n- ${_.capitalize(item)}: ${input[item]}`;
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
      transformer: (input: Record<string, any>): Record<string, unknown> => {
        return {
          auxiliary_data: [
            {
              name: 'SBOM',
              components: _.get(input, 'components'),
              dependencies: _.get(input, 'dependencies'),
              data: _.omit(input, [
                'components',
                'vulnerabilities',
                'dependencies'
              ])
            }
          ],
          ...(this.withRaw && {raw: input})
        };
      }
    }
  };
  constructor(exportJson: Record<string, unknown>, withRaw = false) {
    super(exportJson, true);
    this.withRaw = withRaw;
  }
}
