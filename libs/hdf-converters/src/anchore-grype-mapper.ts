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

  controlMatches(
    matchesPath: string,
    idTransformer: (value: any) => unknown,
    impactTransformer: (value: any) => unknown,
    resultMessageTransformer: (value: any) => unknown
  ): MappedTransform<ExecJSON.Control & ILookupPath, ILookupPath> {
    return {
      path: matchesPath,
      key: 'id',
      tags: {
        nist: ['SA-11', 'RA-5'],
        cveid: {path: 'vulnerability.id'},
        severity: {path: 'vulnerability.severity'}
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
          const relatedVulnerabilities = _.get(data, 'relatedVulnerabilities');
          let relatedVulnerabilitiesUrls = [] as unknown as Record<
            string,
            unknown
          >[];
          if (relatedVulnerabilities) {
            relatedVulnerabilitiesUrls = (
              relatedVulnerabilities as Record<string, unknown>[]
            ).map((element) => element.urls) as Record<string, unknown>[];
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
        transformer: (data: Record<string, unknown>): string =>
          `Grype found a vulnerability to ${_.get(data, 'vulnerability.id')} in ${_.get(this.metadata, 'source.target.userInput') as string}`
      },
      id: {
        transformer: idTransformer
      },
      desc: {
        transformer: description
      },
      impact: {
        path: 'vulnerability.severity',
        transformer: impactTransformer
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
              `${JSON.stringify(_.get(data, 'matchDetails'), null, 2)}`
          },
          message: {
            transformer: resultMessageTransformer
          },
          start_time: _.get(this.metadata, 'descriptor.timestamp') as string
        }
      ]
    };
  }

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
              ...this.controlMatches(
                'wrapper.matches',
                (data: Record<string, unknown>): string =>
                  `Grype/${_.get(data, 'vulnerability.id')}`,
                impactMapping(IMPACT_MAPPING),
                (data: Record<string, unknown>): string =>
                  `${JSON.stringify(_.get(data, 'artifact'), null, 2)}`
              )
            },
            {
              ...this.controlMatches(
                'wrapper.ignoredMatches',
                (data: Record<string, unknown>): string =>
                  `Grype-Ignored-Match/${_.get(data, 'vulnerability.id')}`,
                () => 0,
                (data: Record<string, unknown>): string =>
                  `This finding is ignored due to the following applied ignored rules:\n${JSON.stringify(_.get(data, 'appliedIgnoreRules'), null, 2)}\nArtifact Information:\n${JSON.stringify(_.get(data, 'artifact'), null, 2)}`
              )
            }
          ],
          sha256: ''
        }
      ],
      passthrough: {
        transformer: (data: Record<string, any>): Record<string, unknown> => {
          return {
            ...(this.withRaw && {raw: data})
          };
        }
      }
    };
  }
  constructor(exportJson: string, withRaw = false) {
    const temp = JSON.parse(exportJson);
    super({wrapper: _.pick(temp, ['matches', 'ignoredMatches'])});
    this.metadata = _.omit(temp, ['matches', 'ignoredMatches']);
    this.withRaw = withRaw;
    this.setMappings(this.mapping());
  }
}
