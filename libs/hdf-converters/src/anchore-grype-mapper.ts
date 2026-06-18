import { ExecJSON } from 'inspecjs';
import _ from 'lodash';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import {
  BaseConverter,
  impactMapping,
} from './base-converter';
import { HeimdallToolsVersion } from './utils/global';

const IMPACT_MAPPING = new Map<string, number>([
  ['critical', 0.9],
  ['high', 0.7],
  ['low', 0.3],
  ['medium', 0.5],
  ['negligible', 0],
  ['unknown', 0.5],
]);

// If the highest rating severity for a control is `negligible` or `unknown`, set the results to skipped and request a manual review
function skipSeverityNegligibleOrUnknown(controls: unknown[]): unknown[] {
  if (controls) {
    (controls as ExecJSON.Control[])
      // Filter to controls whose highest rating severity is either `negligible` or `unknown`
      .filter((control) => {
        const rating = _.get(control, 'tags.severity', '') as string;
        // console.log(rating)
        return rating === 'Negligible' || rating === 'Unknown';
      })
      // For every result contained by that control, set the status to skipped and request a manual review
      .map(control =>
        control.results.map((result) => {
          result.status = ExecJSON.ControlResultStatus.Skipped;
          result.skip_message
            = 'Manual review required because a Anchore Grype rating severity is set to `negligible` or `unknown`.';
        }),
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
    return (relatedVulnerabilities.find(
      relatedVulnerability => relatedVulnerability.id === vulnerability.id,
    )?.description ?? '') as string;
  } else if (vulnerability.description) {
    return vulnerability.description as string;
  }
  return 'no description found';
}

export class AnchoreGrypeMapper extends BaseConverter {
  metadata: Record<string, unknown>;
  withRaw: boolean;

  constructor(exportJson: string, withRaw = false) {
    const temp = JSON.parse(exportJson);
    super({ wrapper: _.pick(temp, ['matches', 'ignoredMatches']) });
    this.metadata = _.omit(temp, ['matches', 'ignoredMatches']);
    this.withRaw = withRaw;
    this.setMappings(this.mapping());
  }

  controlMatches(
    matchesPath: string,
    idTransformer: (value: any) => unknown,
    impactTransformer: (value: any) => unknown,
    resultMessageTransformer: (value: any) => unknown,
  ): MappedTransform<ExecJSON.Control & ILookupPath, ILookupPath> {
    return {
      arrayTransformer: skipSeverityNegligibleOrUnknown,
      code: {
        transformer: (data: Record<string, unknown>): string =>
          `${JSON.stringify(
            _.omitBy(
              _.pick(data, ['vulnerability', 'relatedVulnerabilities']),
              value => value === null || value === '',
            ),
            null,
            2,
          )}`,
      },
      desc: { transformer: description },
      descriptions: [
        {
          data: {
            path: 'vulnerability.fix',
            transformer: (data: Record<string, unknown>): string =>
              data.state == 'fixed'
                ? `vulnerability is ${_.get(data, 'state')} for versions ${(_.get(data, 'versions') as string[]).join(', ')}`
                : 'vulnerability is not known to be fixed in any versions',
          },
          label: 'fix',
        },
        {
          data: {
            path: 'relatedVulnerabilities',
            transformer: (data: Record<string, unknown>): string =>
              `${JSON.stringify(_.get(data, 'cvss'), null, 2)}`,
          },
          label: 'check',
        },
      ],
      id: { transformer: idTransformer },
      impact: {
        path: 'vulnerability.severity',
        transformer: impactTransformer,
      },
      key: 'id',
      path: matchesPath,
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
            ).map(element => element.urls) as Record<string, unknown>[];
          }
          return (
            [...vuln_urls, ...relatedVulnerabilitiesUrls].flat()
          ).map(element => ({ url: element }));
        },
      } as unknown as ExecJSON.Reference[],
      results: [
        {
          code_desc: {
            transformer: (data: Record<string, unknown>): string =>
              `${JSON.stringify(_.get(data, 'matchDetails'), null, 2)}`,
          },
          message: { transformer: resultMessageTransformer },
          start_time: _.get(this.metadata, 'descriptor.timestamp') as string,
          status: ExecJSON.ControlResultStatus.Failed,
        },
      ],
      source_location: {},
      tags: {
        cveid: { path: 'vulnerability.id' },
        nist: ['SA-11', 'RA-5'],
        severity: { path: 'vulnerability.severity' },
      },
      title: {
        transformer: (data: Record<string, unknown>): string =>
          `Grype found a vulnerability to ${_.get(data, 'vulnerability.id')} in ${_.get(this.metadata, 'source.target.userInput') as string}`,
      },
    };
  }

  mapping(): MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > {
    return {
      passthrough: {
        transformer: (data: Record<string, any>): Record<string, unknown> => {
          return {
            auxiliary_data: [{ data: _.omit([]), name: '' }], // Insert service name and mapped fields to be removed
            ...(this.withRaw && { raw: data }),
          };
        },
      },
      platform: {
        name: 'Heimdall Tools',
        release: HeimdallToolsVersion,
        target_id: null,
      },
      profiles: [
        {
          attributes: [],
          controls: [
            {
              ...this.controlMatches(
                'wrapper.matches',
                (data: Record<string, unknown>): string =>
                  `Grype/${_.get(data, 'vulnerability.id')}`,
                impactMapping(IMPACT_MAPPING),
                (data: Record<string, unknown>): string =>
                  `${JSON.stringify(_.get(data, 'artifact'), null, 2)}`,
              ),
            },
            {
              ...this.controlMatches(
                'wrapper.ignoredMatches',
                (data: Record<string, unknown>): string =>
                  `Grype-Ignored-Match/${_.get(data, 'vulnerability.id')}`,
                () => 0,
                (data: Record<string, unknown>): string =>
                  `This finding is ignored due to the following applied ignored rules:\n${JSON.stringify(_.get(data, 'appliedIgnoreRules'), null, 2)}\nArtifact Information:\n${JSON.stringify(_.get(data, 'artifact'), null, 2)}`,
              ),
            },
          ],
          copyright: null,
          copyright_email: null,
          depends: [],
          groups: [],
          license: null,
          maintainer: null,
          name: 'Anchore - Grype',
          sha256: '',
          status: 'loaded',
          summary: null,
          supports: [],
          title: 'Anchore Grype Matches',
          version: _.get(this.metadata, 'descriptor.version') as string,
        },
      ],
      statistics: { duration: null },
      version: HeimdallToolsVersion,
    };
  }
}
