import {
  SecureScore,
  ControlScore,
  SecureScoreControlProfile
} from '@microsoft/microsoft-graph-types';
import {ExecJSON, ProfileJSON} from 'inspecjs';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import * as _ from 'lodash';

type ProfileResponse = {
  '@odata.context': string;
  '@odata.nextLink': string;
  value: SecureScoreControlProfile[];
}
type SecureScoreResponse = {
  '@odata.context': string;
  '@odata.nextLink': string;
  value: SecureScore[];
}

export class MsftSecureScoreMapper extends BaseConverter {
  withRaw: boolean;
  rawData: {secureScore: SecureScoreResponse, profiles: ProfileResponse}

  private getProfiles(controlName: string): SecureScoreControlProfile[] {
    return this.rawData.profiles.value.filter((profile) => profile.id === controlName);
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
            `Azure Secure Score report - TenantID: ${data.azureTenantId}`
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
                  return `${data.controlCategory || ''}:${data.controlName || ''}`;
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
              category: {
                transformer: (data: ControlScore) => {
                  // return controlCategory from the profile document where its id matches the controlName
                  return this.getProfiles(data.controlName || '').map(
                    (profile) => profile.controlCategory
                  );
                }
              },
              tiers: {
                transformer: (data: ControlScore) => {
                  // return tiers from the profile document where its id matches the controlName
                  return this.getProfiles(data.controlName || '').map(
                    (profile) => profile.tier
                  );
                }
              },
              threats: {
                transformer: (data: ControlScore) => {
                  const threats = this.getProfiles(data.controlName || '').map(
                    (profile: SecureScoreControlProfile) => profile.threats
                  );
                  return [..._.uniq(threats)];
                }
              },
              services: {
                transformer: (data: ControlScore) => {
                  // return services from the profile document where its id matches the controlName
                  return this.getProfiles(data.controlName || '').map(
                    (profile) => profile.service
                  );
                }
              },
              userImpacts: {
                transformer: (data: ControlScore) => {
                  // return userImpacts from the profile document where its id matches the controlName
                  return this.getProfiles(data.controlName || '')
                    .filter((profile) => profile.userImpact !== undefined)
                    .map((profile) => profile.userImpact);
                }
              },
              nist: ['SA-11', 'RA-5']
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
                start_time: {transformer: () => this.data.createdDateTime},
                run_time: 0
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
              name: 'Microsoft Secure Score', 
              data: {
                profiles: this.rawData.profiles,
                secureScores: _.pick(this.rawData.secureScore, ['@odata.context', '@odata.nextLink'])
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
