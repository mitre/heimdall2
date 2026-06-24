import type {
  ControlScore,
  SecureScore,
  SecureScoreControlProfile,
} from '@microsoft/microsoft-graph-types';
import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type { ILookupPath, MappedTransform } from './base-converter';
import { BaseConverter } from './base-converter';
import {
  conditionallyProvideAttribute,
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  HeimdallToolsVersion,
} from './utils/global';
import { createHeimdallPassthrough } from './utils/heimdall_metadata';

export type CombinedResponse = {
  profiles: ProfileResponse;
  secureScore: SecureScoreResponse;
};

export type ProfileResponse = {
  '@odata.context': string;
  '@odata.nextLink': string;
  value: SecureScoreControlProfile[];
};

export type SecureScoreResponse = {
  '@odata.context': string;
  '@odata.nextLink': string;
  value: SecureScore[];
};

export class MsftSecureScoreMapper extends BaseConverter {
  getProfiles: (controlName: string) => SecureScoreControlProfile[];
  rawData: CombinedResponse;
  shouldIncludeRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (): Record<string, unknown> => {
        return createHeimdallPassthrough('msft_secure_score', {
          auxiliary_data: [
            {
              data: {
                averageComparativeScores:
                  this.rawData.secureScore.value[0].averageComparativeScores,
                currentScore: this.rawData.secureScore.value[0].currentScore,
                enabledServices:
                  this.rawData.secureScore.value[0].enabledServices,
                maxScore: this.rawData.secureScore.value[0].maxScore,
                profiles: this.rawData.profiles,
                reportId: this.rawData.secureScore.value[0].id,
                secureScores: _.pick(this.rawData.secureScore, [
                  '@odata.context',
                  '@odata.nextLink',
                ]),
                tenantId: this.rawData.secureScore.value[0].azureTenantId,
              },
              name: 'Microsoft Secure Score',
            },
          ],
          ...(this.shouldIncludeRaw && { raw: this.rawData }),
        });
      },
    },
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
    },
    profiles: [
      {
        attributes: [],
        controls: [
          {
            desc: { path: 'description' },
            descriptions: [
              {
                data: {
                  transformer: (
                    data: ControlScore & { implementationStatus: string },
                  ) => {
                    const profiles = this.getProfiles(data.controlName || '');
                    const remediationSteps = profiles
                      .map((profile: SecureScoreControlProfile) =>
                        profile.remediation?.toString(),
                      )
                      .filter(
                        (remediation: string | undefined) =>
                          remediation !== undefined,
                      );

                    return remediationSteps.join('\n');
                  },
                },
                label: 'fix',
              },
              {
                data: {
                  transformer: (
                    data: ControlScore & { implementationStatus: string },
                  ) => {
                    const profiles = this.getProfiles(data.controlName || '');
                    const impact = profiles
                      .map((profile: SecureScoreControlProfile) =>
                        profile.remediationImpact?.toString(),
                      )
                      .filter(
                        (remediationImpact: string | undefined) =>
                          remediationImpact !== undefined,
                      );

                    return impact.join('\n');
                  },
                },
                label: 'rationale',
              },
            ],
            id: {
              transformer: (data: ControlScore) =>
                `${data.controlCategory}:${data.controlName}`,
            },
            impact: {
              transformer: (data: ControlScore) => {
                // return controlCategory from the profile document where its id matches the controlName
                const knownMaxScores = this.getProfiles(
                  data.controlName || '',
                ).map(profile => profile.maxScore || 0);

                if (knownMaxScores.length === 0) {
                  return 0.5;
                }

                const highMaxScore = Math.max(...knownMaxScores);
                return highMaxScore / 10;
              },
            },
            path: 'controlScores',
            refs: [],
            results: [
              {
                code_desc: {
                  transformer: (
                    data: ControlScore & { implementationStatus: string },
                  ) => data.implementationStatus,
                },
                start_time: { transformer: () => this.data.createdDateTime },
                status: {
                  transformer: (
                    data: ControlScore & { scoreInPercentage: number },
                  ) => {
                    if (data.scoreInPercentage === 100) {
                      return ExecJSON.ControlResultStatus.Passed;
                    }

                    const knownMaxScores = this.getProfiles(
                      data.controlName || '',
                    ).map(profile => profile.maxScore || 0);

                    const highMaxScore = Math.max(...knownMaxScores);

                    if (knownMaxScores.length === 0) {
                      // no Profile found matching the controlName
                      return ExecJSON.ControlResultStatus.Failed;
                    }
                    if (data.score === undefined) {
                      return ExecJSON.ControlResultStatus.Error;
                    }
                    return data.score === highMaxScore ? ExecJSON.ControlResultStatus.Passed : ExecJSON.ControlResultStatus.Failed;
                  },
                },
              },
            ],
            source_location: {},
            tags: {
              nist: DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
              transformer: (data: ControlScore) => ({
                ...conditionallyProvideAttribute(
                  'category',
                  this.getProfiles(data.controlName || '').map(
                    profile => profile.controlCategory,
                  ),
                  (() => {
                    const result = this.getProfiles(data.controlName || '')
                      .map(profile => profile.controlCategory)
                      .filter(Boolean);
                    return result.length > 0;
                  })(),
                ),
                ...conditionallyProvideAttribute(
                  'maxScore',
                  this.getProfiles(data.controlName || '').map(
                    profile => profile.maxScore,
                  ),
                  (() => {
                    const result = this.getProfiles(data.controlName || '')
                      .map(profile => profile.maxScore)
                      .filter(Boolean);
                    return result.length > 0;
                  })(),
                ),
                ...conditionallyProvideAttribute(
                  'rank',
                  this.getProfiles(data.controlName || '').map(
                    profile => profile.rank,
                  ),
                  (() => {
                    const result = this.getProfiles(data.controlName || '')
                      .map(profile => profile.rank)
                      .filter(Boolean);
                    return result.length > 0;
                  })(),
                ),
                ...conditionallyProvideAttribute(
                  'tiers',
                  this.getProfiles(data.controlName || '').map(
                    profile => profile.tier,
                  ),
                  (() => {
                    const result = this.getProfiles(data.controlName || '')
                      .map(profile => profile.tier)
                      .filter(Boolean);
                    return result.length > 0;
                  })(),
                ),
                ...conditionallyProvideAttribute(
                  'threats',
                  _.uniq(
                    this.getProfiles(data.controlName || '').map(
                      profile => profile.threats,
                    ),
                  ),
                  (() => {
                    const result = this.getProfiles(data.controlName || '')
                      .map(profile => profile.threats)
                      .filter(Boolean);
                    return result.length > 0;
                  })(),
                ),
                ...conditionallyProvideAttribute(
                  'services',
                  _.uniq(
                    this.getProfiles(data.controlName || '').map(
                      profile => profile.service,
                    ),
                  ),
                  (() => {
                    const result = this.getProfiles(data.controlName || '')
                      .map(profile => profile.service)
                      .filter(Boolean);
                    return result.length > 0;
                  })(),
                ),
                ...conditionallyProvideAttribute(
                  'userImpacts',
                  _.uniq(
                    this.getProfiles(data.controlName || '').map(
                      profile => profile.userImpact,
                    ),
                  ),
                  (() => {
                    const result = this.getProfiles(data.controlName || '')
                      .map(profile => profile.userImpact)
                      .filter(Boolean);
                    return result.length > 0;
                  })(),
                ),
              }),
            },
            title: {
              transformer: (data: ControlScore) => {
                const titles = this.getProfiles(data.controlName || '')
                  .filter(profile => profile.title !== undefined)
                  .map(profile => profile.title);

                return titles.length > 0
                  ? titles.join('\n')
                  : [data.controlCategory || '', data.controlName || '']
                    .filter(Boolean)
                    .join(':');
              },
            },
          },
        ],
        groups: [],
        name: 'Microsoft Secure Score Scan',
        sha256: '',
        status: 'loaded',
        supports: [],
        title: {
          transformer: (data: SecureScore) =>
            `Azure Secure Score report - Tenant ID: ${data.azureTenantId} - Run ID: ${data.id}`,
        },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  constructor(secureScore_and_profiles_combined: string, shouldIncludeRaw = false) {
    const rawParams = JSON.parse(secureScore_and_profiles_combined);
    super(rawParams.secureScore.value[0]);
    this.shouldIncludeRaw = shouldIncludeRaw;
    this.rawData = rawParams;
    this.getProfiles = this.memoizedGetProfiles();
  }

  memoizedGetProfiles(): (controlName: string) => SecureScoreControlProfile[] {
    const cache: Record<string, SecureScoreControlProfile[]> = {};

    return (controlName: string): SecureScoreControlProfile[] => {
      if (Object.hasOwn(cache, controlName)) {
        return cache[controlName];
      }
      return (cache[controlName] = this.rawData.profiles.value.filter(
        profile => profile.id === controlName,
      ));
    };
  }
}

export class MsftSecureScoreResults {
  data: CombinedResponse;
  shouldIncludeRaw: boolean;

  constructor(combinedJson: string, shouldIncludeRaw = false) {
    this.data = JSON.parse(combinedJson);
    this.shouldIncludeRaw = shouldIncludeRaw;
  }

  toHdf(): ExecJSON.Execution[] {
    return this.data.secureScore.value.map(element =>
      new MsftSecureScoreMapper(
        JSON.stringify({
          profiles: this.data.profiles,
          secureScore: {
            value: [element],
            ..._.pick(this.data.secureScore, [
              '@odata.context',
              '@odata.context',
            ]),
          },
        }),
        this.shouldIncludeRaw,
      ).toHdf(),
    );
  }
}
