import {
  SecureScore,
  ControlScore,
  SecureScoreControlProfile
} from '@microsoft/microsoft-graph-types';
import {ExecJSON} from 'inspecjs';

import {version as HeimdallToolsVersion} from '../package.json';

import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';

export class MsftSecureScoreMapper extends BaseConverter {
  profiles: SecureScoreControlProfile[];

  constructor(secureScore_and_profiles_combined: string) {
    const rawParams = JSON.parse(secureScore_and_profiles_combined);

    super(rawParams.secureScore);
    this.profiles = rawParams.profiles.value as SecureScoreControlProfile[];
  }

  private getProfiles(controlName: string): SecureScoreControlProfile[] {
    console.log('filtering profiles');
    return this.profiles.filter((p) => p.id === controlName);
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
        name: 'Microsoft Secure Score',
        version: {path: 'v4'},
        title: {
          transformer: (d: SecureScore) =>
            `Azure Secure Score report: TenantID: ${d.azureTenantId}`
        },
        summary: 'NAME',
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'controlScores',
            id: {
              transformer: (d: ControlScore) =>
                `${d.controlCategory}:${d.controlName}`
            },
            title: {
              transformer: (d: ControlScore) => {
                console.log('filtering profiles to get title');

                const titles = this.getProfiles(d.controlName || '')
                  .filter((p) => p.title !== undefined)
                  .map((p) => p.title);

                if (titles.length > 0) {
                  return titles.join('... ');
                } else {
                  return `${d.controlCategory || ''}:${d.controlName || ''}`;
                }
              }
            },
            desc: {
              transformer: (d: ControlScore) => d.description || ''
            },
            impact: {
              transformer: (d: ControlScore) => {
                // return controlCategory from the profile document where its id matches the controlName
                const knownMaxScores = this.getProfiles(
                  d.controlName || ''
                ).map((p) => p.maxScore || 0);

                if (knownMaxScores.length === 0) {
                  return 0.5;
                }

                const highMaxScore = Math.max(...knownMaxScores);
                return highMaxScore / 10.0;
              }
            },
            refs: [],
            tags: {
              group: {
                transformer: (d: ControlScore) => {
                  // return controlCategory from the profile document where its id matches the controlName
                  return this.getProfiles(d.controlName || '').map(
                    (p) => p.controlCategory
                  );
                }
              },
              tiers: {
                transformer: (d: ControlScore) => {
                  // return tiers from the profile document where its id matches the controlName
                  return this.getProfiles(d.controlName || '').map(
                    (p) => p.tier
                  );
                }
              },
              threats: {
                transformer: (d: ControlScore) => {
                  // return unique threats from the profile document where its id matches the controlName
                  const uniqs: Set<string> = new Set();
                  this.getProfiles(d.controlName || '').forEach((p) =>
                    p.threats?.forEach((threat) => uniqs.add(threat))
                  );
                  return [...uniqs];
                }
              },
              services: {
                transformer: (d: ControlScore) => {
                  // return thrserviceeats from the profile document where its id matches the controlName
                  return this.getProfiles(d.controlName || '').map(
                    (p) => p.service
                  );
                }
              },
              userImpacts: {
                transformer: (d: ControlScore) => {
                  // return userImpacts from the profile document where its id matches the controlName
                  console.log('filter profiles to get userImpact');
                  return this.getProfiles(d.controlName || '')
                    .filter((p) => p.userImpact !== undefined)
                    .map((p) => p.userImpact);
                }
              }
            },
            source_location: {},
            code: {
              transformer: (
                d: ControlScore & {implementationStatus: string}
              ) => {
                const profiles = this.getProfiles(d.controlName || '');

                if (profiles?.length === 0) {
                  return d.implementationStatus;
                }
              }
            },
            results: [
              {
                status: {
                  transformer: (
                    d: ControlScore & {scoreInPercentage: number}
                  ) => {
                    if (d.scoreInPercentage === 100) {
                      return ExecJSON.ControlResultStatus.Passed;
                    }

                    const knownMaxScores = this.getProfiles(
                      d.controlName || ''
                    ).map((p) => p.maxScore || 0);

                    const highMaxScore = Math.max(...knownMaxScores);

                    if (knownMaxScores.length === 0) {
                      // no Profile found matching the controlName
                      return ExecJSON.ControlResultStatus.Failed;
                    } else if (d.score === undefined) {
                      return ExecJSON.ControlResultStatus.Error;
                    } else if (d.score === highMaxScore) {
                      return ExecJSON.ControlResultStatus.Passed;
                    } else {
                      return ExecJSON.ControlResultStatus.Failed;
                    }
                  }
                },
                code_desc: {
                  transformer: (
                    d: ControlScore & {implementationStatus: string}
                  ) => {
                    const remediations = this.getProfiles(d.controlName || '')
                      .filter((p) => p.remediation !== undefined)
                      .map((p) => p.remediation);

                    if (remediations.length > 0) {
                      return remediations.join('\n\n');
                    }
                  }
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
      profiles: {
        value: {
          transformer: () => this.profiles
        }
      },
      secureScore: this.data
    }
  };
}
