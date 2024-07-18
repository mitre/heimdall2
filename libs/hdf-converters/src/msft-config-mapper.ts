import {
  SecureScore,
  ControlScore,
  SecureScoreControlProfile
} from '@microsoft/microsoft-graph-types';
import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';

import {version as HeimdallToolsVersion} from '../package.json';

import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';

export class MsftConfigMapper extends BaseConverter {
  profiles: SecureScoreControlProfile[];

  constructor(secureScore_and_profiles_combined: string) {
    const rawParams = JSON.parse(secureScore_and_profiles_combined);

    super(rawParams.secureScore);
    this.profiles = rawParams.profiles.value as SecureScoreControlProfile[];
  }

  private getImpact(userImpact: string): number {
    const normalized = userImpact.toLowerCase();
    if (normalized.search('high') !== -1) {
      return 1.0;
    } else if (
      normalized.search('moderate') !== -1 ||
      normalized.search('medium') !== -1
    ) {
      return 0.5;
    } else {
      return 0.0;
    }
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
              transformer: (d: ControlScore) =>
                `${d.controlCategory || ''}:${d.controlName || ''}`
            },
            desc: {
              transformer: (d: ControlScore) => d.description || ''
            },
            impact: {
              transformer: (d: ControlScore) => {
                // return controlCategory from the profile document where its id matches the controlName
                const knownMaxScores = this.profiles
                  .filter((p) => p.id === d.controlName)
                  .map((p) => p.maxScore || 0);

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
                  return this.profiles
                    .filter((p) => p.id === d.controlName)
                    .map((p) => p.controlCategory);
                }
              },
              threats: {
                transformer: (d: ControlScore) => {
                  // return threats from the profile document where its id matches the controlName
                  return this.profiles
                    .filter((p) => p.id === d.controlName)
                    .map((p) => p.threats);
                }
              }
            },
            source_location: {},
            results: [
              {
                status: {
                  transformer: (d: ControlScore | any) => {
                    if (d.scoreInPercentage === 100) {
                      return ExecJSON.ControlResultStatus.Passed;
                    }

                    const knownMaxScores = this.profiles
                      .filter((p) => p.id === d.controlName)
                      .map((p) => p.maxScore || 0);

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
                code_desc: '',
                start_time: {transformer: () => this.data.createdDateTime}
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {}
  };
}
