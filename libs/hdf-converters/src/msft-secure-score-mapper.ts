import {
  SecureScore,
  ControlScore,
  SecureScoreControlProfile
} from '@microsoft/microsoft-graph-types';
import {ExecJSON} from 'inspecjs';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import * as _ from 'lodash';
import {
  conditionallyProvideAttribute,
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
} from './utils/global';

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

export type CombinedResponse = {
  secureScore: SecureScoreResponse;
  profiles: ProfileResponse;
};

export class MsftSecureScoreResults {
  data: CombinedResponse;
  withRaw: boolean;

  constructor(combinedJson: string, withRaw = false) {
    this.data = JSON.parse(combinedJson);
    this.withRaw = withRaw;
  }

  toHdf(): ExecJSON.Execution[] {
    const results: ExecJSON.Execution[] = [];

    return this.data.secureScore.value.map((element) =>
      new MsftSecureScoreMapper(
        JSON.stringify({
          secureScore: {
            value: [element],
            ..._.pick(this.data.secureScore, [
              '@odata.context',
              '@odata.context'
            ])
          },
          profiles: this.data.profiles
        }),
        this.withRaw
      ).toHdf()
    );
  }
}

export class MsftSecureScoreMapper extends BaseConverter {
  withRaw: boolean;
  rawData: CombinedResponse;

  private getProfiles(controlName: string): SecureScoreControlProfile[] {
    return this.rawData.profiles.value.filter(
      (profile) => profile.id === controlName
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
        name: 'Microsoft Secure Score Scan',
        title: {
          transformer: (data: SecureScore) =>
            `Azure Secure Score report - Tenant ID: ${data.azureTenantId} - Run ID: ${data.id}`
        },
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'controlScores',
            id: {
              transformer: (data: ControlScore) =>
                `${data.controlCategory}:${data.controlName}`
            },
            title: {
              transformer: (data: ControlScore) => {
                const titles = this.getProfiles(data.controlName || '')
                  .filter((profile) => profile.title !== undefined)
                  .map((profile) => profile.title);

                if (titles.length > 0) {
                  return titles.join('\n');
                } else {
                  return [data.controlCategory || '', data.controlName || '']
                    .filter((title) => title)
                    .join(':');
                }
              }
            },
            desc: {path: 'description'},
            impact: {
              transformer: (data: ControlScore) => {
                // return controlCategory from the profile document where its id matches the controlName
                const knownMaxScores = this.getProfiles(
                  data.controlName || ''
                ).map((profile) => profile.maxScore || 0);

                if (knownMaxScores.length === 0) {
                  return 0.5;
                }

                const highMaxScore = Math.max(...knownMaxScores);
                return highMaxScore / 10.0;
              }
            },
            refs: [],
            tags: {
              transformer: (data: ControlScore) => ({
                ...conditionallyProvideAttribute(
                  'category',
                  this.getProfiles(data.controlName || '').map(
                    (profile) => profile.controlCategory
                  ),
                  (() => {
                    const result = this.getProfiles(data.controlName || '')
                      .map((profile) => profile.controlCategory)
                      .filter((v) => Boolean(v));
                    return result.length > 0;
                  })()
                ),
                ...conditionallyProvideAttribute(
                  'maxScore',
                  this.getProfiles(data.controlName || '').map(
                    (profile) => profile.maxScore
                  ),
                  (() => {
                    const result = this.getProfiles(data.controlName || '')
                      .map((profile) => profile.maxScore)
                      .filter((v) => Boolean(v));
                    return result.length > 0;
                  })()
                ),
                ...conditionallyProvideAttribute(
                  'rank',
                  this.getProfiles(data.controlName || '').map(
                    (profile) => profile.rank
                  ),
                  (() => {
                    const result = this.getProfiles(data.controlName || '')
                      .map((profile) => profile.rank)
                      .filter((v) => Boolean(v));
                    return result.length > 0;
                  })()
                ),
                ...conditionallyProvideAttribute(
                  'tiers',
                  this.getProfiles(data.controlName || '').map(
                    (profile) => profile.tier
                  ),
                  (() => {
                    const result = this.getProfiles(data.controlName || '')
                      .map((profile) => profile.tier)
                      .filter((v) => Boolean(v));
                    return result.length > 0;
                  })()
                ),
                ...conditionallyProvideAttribute(
                  'threats',
                  _.uniq(
                    this.getProfiles(data.controlName || '').map(
                      (profile) => profile.threats
                    )
                  ),
                  (() => {
                    const result = this.getProfiles(data.controlName || '')
                      .map((profile) => profile.threats)
                      .filter((v) => Boolean(v));
                    return result.length > 0;
                  })()
                ),
                ...conditionallyProvideAttribute(
                  'services',
                  _.uniq(
                    this.getProfiles(data.controlName || '').map(
                      (profile) => profile.service
                    )
                  ),
                  (() => {
                    const result = this.getProfiles(data.controlName || '')
                      .map((profile) => profile.service)
                      .filter((v) => Boolean(v));
                    return result.length > 0;
                  })()
                ),
                ...conditionallyProvideAttribute(
                  'userImpacts',
                  _.uniq(
                    this.getProfiles(data.controlName || '').map(
                      (profile) => profile.userImpact
                    )
                  ),
                  (() => {
                    const result = this.getProfiles(data.controlName || '')
                      .map((profile) => profile.userImpact)
                      .filter((v) => Boolean(v));
                    return result.length > 0;
                  })()
                )
              }),
              nist: DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
            },
            source_location: {},
            descriptions: [
              {
                data: {
                  transformer: (
                    data: ControlScore & {implementationStatus: string}
                  ) => {
                    const profiles = this.getProfiles(data.controlName || '');
                    const remediationSteps = profiles
                      .map((profile: SecureScoreControlProfile) =>
                        profile.remediation?.toString()
                      )
                      .filter(
                        (remediation: string | undefined) =>
                          remediation !== undefined
                      );

                    return remediationSteps.join('\n');
                  }
                },
                label: 'fix'
              },
              {
                data: {
                  transformer: (
                    data: ControlScore & {implementationStatus: string}
                  ) => {
                    const profiles = this.getProfiles(data.controlName || '');
                    const impact = profiles
                      .map((profile: SecureScoreControlProfile) =>
                        profile.remediationImpact?.toString()
                      )
                      .filter(
                        (remediationImpact: string | undefined) =>
                          remediationImpact !== undefined
                      );

                    return impact.join('\n');
                  }
                },
                label: 'rationale'
              }
            ],
            results: [
              {
                status: {
                  transformer: (
                    data: ControlScore & {scoreInPercentage: number}
                  ) => {
                    if (data.scoreInPercentage === 100) {
                      return ExecJSON.ControlResultStatus.Passed;
                    }

                    const knownMaxScores = this.getProfiles(
                      data.controlName || ''
                    ).map((profile) => profile.maxScore || 0);

                    const highMaxScore = Math.max(...knownMaxScores);

                    if (knownMaxScores.length === 0) {
                      // no Profile found matching the controlName
                      return ExecJSON.ControlResultStatus.Failed;
                    } else if (data.score === undefined) {
                      return ExecJSON.ControlResultStatus.Error;
                    } else if (data.score === highMaxScore) {
                      return ExecJSON.ControlResultStatus.Passed;
                    } else {
                      return ExecJSON.ControlResultStatus.Failed;
                    }
                  }
                },
                code_desc: {
                  transformer: (
                    data: ControlScore & {implementationStatus: string}
                  ) => data.implementationStatus
                },
                start_time: {transformer: () => this.data.createdDateTime}
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (): Record<string, unknown> => {
        return {
          auxiliary_data: [
            {
              name: 'Microsoft Secure Score',
              data: {
                reportId: this.rawData.secureScore.value[0].id,
                tenantId: this.rawData.secureScore.value[0].azureTenantId,
                profiles: this.rawData.profiles,
                enabledServices:
                  this.rawData.secureScore.value[0].enabledServices,
                averageComparativeScores:
                  this.rawData.secureScore.value[0].averageComparativeScores,
                currentScore: this.rawData.secureScore.value[0].currentScore,
                maxScore: this.rawData.secureScore.value[0].maxScore,
                secureScores: _.pick(this.rawData.secureScore, [
                  '@odata.context',
                  '@odata.nextLink'
                ])
              }
            }
          ],
          ...(this.withRaw && {raw: this.rawData})
        };
      }
    }
  };
  constructor(secureScore_and_profiles_combined: string, withRaw = false) {
    const rawParams = JSON.parse(secureScore_and_profiles_combined);
    super(rawParams.secureScore.value[0]);
    this.withRaw = withRaw;
    this.rawData = rawParams;
  }
}
