import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['negligible', 0.0],
  ['unknown', 0.5]
]);

// If the highest rating severity for a control is `negligible` or `unknown`, set the results to skipped and request a manual review
function skipSeverityNegligibleOrUnknown(controls: unknown[]): unknown[] {
  if (controls) {
    (controls as ExecJSON.Control[])
      // Filter to controls whose highest rating severity is either `negligible` or `unknown`
      .filter((control) => {
        const rating = _.get(control, 'tags.severity', '') as string;
        //console.log(rating)
        return rating === 'Negligible' || rating === 'Unknown';
      })
      .map((control) => {
        return control;
      })
      // For every result contained by that control, set the status to skipped and request a manual review
      .map((control) =>
        control.results.map((result) => {
          result.status = ExecJSON.ControlResultStatus.Skipped;
          result.skip_message =
            'Manual review required because a Anchore Grype rating severity is set to `negligible` or `unknown`.';
        })
      );
  }
  return controls;
}

function description(data: Record<string, unknown>): string {
  const vulnerability = data.vulnerability as Record<string, unknown>;
  const relatedVulnerabilities = data.relatedVulnerabilities as Record<
    string,
    unknown
  >[];
  if (!vulnerability.description && relatedVulnerabilities.length > 0) {
    return relatedVulnerabilities.filter(
      (relatedVulnerability) => relatedVulnerability.id === vulnerability.id
    )[0].description as string;
  } else if (vulnerability.description) {
    return vulnerability.description as string;
  }
  return 'no description found';
}

export class AnchoreGrypeMapper extends BaseConverter {
  withRaw: boolean;
  metadata: Record<string, unknown>;

  mapping(): MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > {
    return {
      platform: {
        name: 'Heimdall Tools',
        release: HeimdallToolsVersion,
        target_id: null
      },
      version: HeimdallToolsVersion,
      statistics: {
        duration: null
      },
      profiles: [
        {
          name: 'Anchore - Grype',
          title: 'Anchore Grype Matches',
          version: _.get(this.metadata, 'descriptor.version') as string,
          maintainer: null,
          summary: null,
          license: null,
          copyright: null,
          copyright_email: null,
          supports: [],
          attributes: [],
          depends: [],
          groups: [],
          status: 'loaded',
          controls: [
            {
              path: 'wrapper',
              key: 'id',
              tags: {
                nist: ['SA-11', 'RA-5'],
                cveid: {path: 'vulnerability.id'},
                severity: {path: 'vulnerability.severity'},
                containerName: {path: 'source.target.userInput'}
              },
              descriptions: [
                {
                  data: {
                    path: 'vulnerability.fix',
                    transformer: (data: Record<string, unknown>): string =>
                      data.state == 'fixed'
                        ? `vulnerability is ${_.get(data, 'state')} for versions ${(_.get(data, 'versions') as string[]).join(', ')}`
                        : `vulnerability is not known to be fixed in any versions`
                  },
                  label: 'fix'
                },
                {
                  data: {
                    path: 'relatedVulnerabilities',
                    transformer: (data: Record<string, unknown>): string =>
                      `${JSON.stringify(_.get(data, 'cvss'), null, 2)}`
                  },
                  label: 'check'
                }
              ],
              refs: {
                transformer: (data: Record<string, unknown>) => {
                  const vuln_urls = _.get(data, 'vulnerability.urls') as Record<
                    string,
                    unknown
                  >[];
                  const relatedVulnerabilities = _.get(
                    data,
                    'relatedVulnerabilities'
                  );
                  let relatedVulnerabilitiesUrls = [] as unknown as Record<
                    string,
                    unknown
                  >[];
                  if (relatedVulnerabilities) {
                    relatedVulnerabilitiesUrls = (
                      relatedVulnerabilities as Record<string, unknown>[]
                    ).map((element) => element.urls) as Record<
                      string,
                      unknown
                    >[];
                  }
                  return (
                    vuln_urls.concat(
                      ...relatedVulnerabilitiesUrls
                    ) as unknown as Record<string, unknown>[]
                  ).map((element) => ({url: element}));
                }
              } as unknown as ExecJSON.Reference[],
              source_location: {},
              title: {
                path: 'vulnerability',
                transformer: (data: Record<string, unknown>): string =>
                  `Grype found a vulnerability to ${_.get(data, 'id')} in container ${_.get(data, 'source.target.userInput')}`
              },
              id: {
                transformer: (data: Record<string, unknown>): string =>
                  `Grype/${_.get(data, 'vulnerability.id')}`
              },
              desc: {
                transformer: description
              },
              impact: {
                path: 'vulnerability.severity',
                transformer: impactMapping(IMPACT_MAPPING)
              },
              code: {
                transformer: (data: Record<string, unknown>): string =>
                  `${JSON.stringify(
                    _.omitBy(
                      _.pick(data, ['vulnerability', 'relatedVulnerabilities']),
                      (value) => value === null || value === ''
                    ),
                    null,
                    2
                  )}`
              },
              arrayTransformer: skipSeverityNegligibleOrUnknown,
              results: [
                {
                  status: ExecJSON.ControlResultStatus.Failed,
                  code_desc: {
                    transformer: (data: Record<string, unknown>): string =>
                      `${_.get(this.metadata, 'source.target.userInput')}\n${JSON.stringify(_.get(data, 'matchDetails'), null, 2)}`
                  },
                  message: {
                    transformer: (data: Record<string, unknown>): string =>
                      `${JSON.stringify(_.get(data, 'artifact'), null, 2)}`
                  },
                  start_time: _.get(
                    this.metadata,
                    'descriptor.timestamp'
                  ) as string
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
            auxiliary_data: [{name: '', data: _.omit([])}], //Insert service name and mapped fields to be removed
            ...(this.withRaw && {raw: data})
          };
        }
      }
    };
  }
  constructor(exportJson: string, withRaw = false) {
    const temp = JSON.parse(exportJson);
    super({wrapper: _.get(temp, 'matches')});
    this.metadata = _.omit(temp, 'matches');
    this.withRaw = withRaw;
    this.setMappings(this.mapping());
  }
}
