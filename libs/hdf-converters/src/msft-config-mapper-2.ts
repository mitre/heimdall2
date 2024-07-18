import {
  SecureScore,
  ControlScore,
  SecureScoreControlProfile
} from '@microsoft/microsoft-graph-types';
import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';

import {version as HeimdallToolsVersion} from '../package.json';

// THIS IS FOR DEBUG ONLY UNTIL NETWORK ACCESS WORKS
import {
  BaseConverter,
  ILookupPath,
  // impactMapping,
  MappedTransform
  // parseHtml,
  // parseXml
} from './base-converter';

export class MsftConfigMapper extends BaseConverter {
  profiles: SecureScoreControlProfile[];

  constructor(futSecureScore: string, futProfiles: string) {
    super(JSON.parse(futSecureScore));
    this.profiles = JSON.parse(futProfiles)
      .value as SecureScoreControlProfile[];
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
                  transformer: (d: ControlScore) => {
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
    passthrough: {
      // transformer: (data: Record<string, unknown>): Record<string, unknown> => {
      //   return {
      //     // ...(this.withRaw && {raw: data})
      //   };
      // }
    }
  };

  // private getMsftSecureScoreReport(): Promise<SecureScore> {
  //   const raw = fs.readFileSync(
  //     path.join(__dirname, './data/secureScore_pre-downloaded.json'),
  //     'utf8'
  //   );
  //   const secureScore: SecureScore = JSON.parse(raw) as SecureScore;
  //   return secureScore;
  // }
  // private getMsftSecureScoreProfiles(): Promise<SecureScoreControlProfile[]> {
  //   const raw = fs.readFileSync(
  //     path.join(__dirname, './data/profiles_pre-dowloaded.json'),
  //     'utf8'
  //   );

  //   const profiles: SecureScoreControlProfile[] = JSON.parse(raw)[
  //     'value'
  //   ] as SecureScoreControlProfile[];

  //   return profiles;
  // }

  private getStatus(
    controlScore: ControlScore,
    profile: SecureScoreControlProfile | undefined
  ): ExecJSON.ControlResultStatus {
    if (controlScore.score === 0) {
      return ExecJSON.ControlResultStatus.Failed;
    } else if (controlScore.score == profile?.maxScore) {
      return ExecJSON.ControlResultStatus.Passed;
    } else {
      return ExecJSON.ControlResultStatus.Skipped;
    }
  }

  private getRunStartTime(secureScoreReport: SecureScore): string {
    return secureScoreReport.createdDateTime || '';
  }

  // private getMessage(
  //   result: EvaluationResult,
  //   codeDesc: string,
  //   status: ExecJSON.ControlResultStatus
  // ): string | undefined {
  //   if (status === ExecJSON.ControlResultStatus.Failed) {
  //     return `${codeDesc}: ${
  //       result.Annotation || 'Rule does not pass rule compliance'
  //     }`;
  //   } else {
  //     return undefined;
  //   }
  // }

  // eslint-disable-next-line @typescript-eslint/ban-types
  private hdfTags(msftScore: ControlScore): Record<string, unknown> {
    let result = {};
    if (!_.isNull(msftScore.controlCategory)) {
      result = _.set(result, 'category', msftScore.controlCategory);
    }
    return result;
  }

  //   const hdf: ExecJSON.Execution = {
  //     platform: {
  //       name: 'Heimdall Tools',
  //       release: HeimdallToolsVersion,
  //       target_id: ''
  //     },
  //     version: HeimdallToolsVersion,
  //     statistics: {
  //       //aws_config_sdk_version: ConfigService., // How do i get the sdk version?
  //       duration: null
  //     },
  //     profiles: [
  //       {
  //         name: 'NAME',
  //         version: '',
  //         title: 'NAME',
  //         maintainer: null,
  //         summary: 'NAME',
  //         license: null,
  //         copyright: null,
  //         copyright_email: null,
  //         supports: [],
  //         attributes: [],
  //         depends: [],
  //         groups: [],
  //         status: 'loaded',
  //         controls: this.getControls(),
  //         sha256: ''
  //       }
  //     ]
  //   };
}
