// import {ClientSecretCredential} from '@azure/identity';
// import {Client, ClientOptions} from '@microsoft/microsoft-graph-client';
// import {
//   SecureScore,
//   ControlScore,
//   SecureScoreControlProfile
// } from '@microsoft/microsoft-graph-types';
// import {TokenCredentialAuthenticationProvider} from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';

// import {NodeHttpHandler} from '@smithy/node-http-handler';
// import https from 'https';
// import {ExecJSON} from 'inspecjs';
// import * as _ from 'lodash';

// import {version as HeimdallToolsVersion} from '../package.json';

// // THIS IS FOR DEBUG ONLY UNTIL NETWORK ACCESS WORKS
// import fs from 'node:fs';
// import path from 'node:path';

// const NOT_APPLICABLE_MSG =
//   'No AWS resources found to evaluate compliance for this rule';
// const INSUFFICIENT_DATA_MSG =
//   'Not enough data has been collected to determine compliance yet.';
// const NAME = 'AW`S Config';

// export class MsftConfigMapper {
//   futSecureScore: Promise<SecureScore>;
//   futProfiles: Promise<SecureScoreControlProfile[]>;

//   constructor(
//     // options: ClientOptions,
//     _verifySSLCertificates = true,
//     _certificate?: string
//   ) {
//     const tenantId = '';
//     const clientId = '';
//     const clientSecret = '';
//     const creds = new ClientSecretCredential(tenantId, clientId, clientSecret);

//     const authProvider = new TokenCredentialAuthenticationProvider(creds, {
//       scopes: ['https://graph.microsoft.com/.default']
//     });
//     const graphClientOpts: ClientOptions = {
//       authProvider: authProvider,
//       fetchOptions: {
//         // agent: new NodeHttpHandler({
//         //   httpsAgent: new https.Agent({
//         //     // Disable HTTPS verification if requested
//         //     rejectUnauthorized: verifySSLCertificates,
//         //     // Pass an SSL certificate to trust
//         //     ca: certificate
//         //   })
//         // })
//       }
//     };
//     const graphClient: Client = Client.initWithMiddleware(graphClientOpts);

//     this.futSecureScore = this.getMsftSecureScoreReport(graphClient);
//     this.futProfiles = this.getMsftSecureScoreProfiles(graphClient);
//   }

//   private async getMsftSecureScoreReport(
//     graphClient: Client
//   ): Promise<SecureScore> {
//     let secureScore: SecureScore;

//     try {
//       secureScore = JSON.parse(
//         (await graphClient.api('/security/secureScores').get()).body
//       ) as SecureScore;
//     } catch (e) {
//       const raw = fs.readFileSync(
//         path.join(__dirname, './data/secureScore_pre-downloaded.json'),
//         'utf8'
//       );
//       secureScore = JSON.parse(raw) as SecureScore;
//     }
//     return secureScore;
//   }
//   private async getMsftSecureScoreProfiles(
//     graphClient: Client
//   ): Promise<SecureScoreControlProfile[]> {
//     let profiles: SecureScoreControlProfile[];
//     try {
//       profiles = JSON.parse(
//         (await graphClient.api('/security/secureScoreControlProfiles').get())
//           .body
//       )['value'] as SecureScoreControlProfile[];
//     } catch (e) {
//       const raw = fs.readFileSync(
//         path.join(__dirname, './data/profiles_pre-dowloaded.json'),
//         'utf8'
//       );
//       profiles = JSON.parse(raw)['value'] as SecureScoreControlProfile[];
//     }

//     return profiles;
//   }
//   // private delay(ms: number): Promise<void> {
//   //   return new Promise((resolve) => setTimeout(resolve, ms));
//   // }

//   // private async getAllConfigRules(): Promise<ExecJSON.Control[]> {
//   // Promise.all([this.futProfiles, this.futSecureScore]).then((results) => {
//   //   const profiles: SecureScoreControlProfile[] = results[0];
//   //   const secureScore: SecureScore = results[1];

//   //   const profByCtrlId: Record<string, SecureScoreControlProfile> =
//   //     Object.fromEntries(profiles.map((p) => [p.id, p]));

//   //   const execControls = secureScore.controlScores?.map((score) => {
//   //     const profile = profByCtrlId[score.controlName || ""];

//   //     const control: ExecJSON.Control = {
//   //       id: score.controlName || '',
//   //       title: score.controlName || '',
//   //       desc: score.description || null,
//   //       impact: this.getImpact(profile.userImpact || ""),
//   //       tags: this.hdfTags(score),
//   //       descriptions: this.hdfDescriptions(score),
//   //       refs: [],
//   //       source_location: {ref: score.controlName, line: 1},
//   //       code: '',
//   //       results: [] //this.results[index]
//   //     };
//   //     return control;
//   //   });
//   // });

//   // // const tenantId = secureScore.azureTenantId;
//   // // let createdDate = new Date(secureScore.createdDateTime || '');
//   // // secureScore.enabledServices

//   // // const controls = _.map(secureScore.controlScores, (ctrlScore) => {
//   // //   return {
//   // //     attestationData: ''
//   // //   }
//   // // });

//   // let results: ExecJSON.Control[] = Array();

//   // return results;
//   // }

//   // private async getConfigRulePage(
//   //   params: DescribeConfigRulesCommandInput
//   // ): Promise<DescribeConfigRulesResponse> {
//   //   await this.delay(150);
//   //   return this.configService.describeConfigRules(params);
//   // }

//   // private async getResults(
//   //   configRules: ConfigRule[]
//   // ): Promise<ExecJSON.ControlResult[][]> {
//   //   const complianceResults: ComplianceByConfigRule[] =
//   //     await this.fetchAllComplianceInfo(configRules);
//   //   const ruleData: ExecJSON.ControlResult[][] = [];
//   //   const allRulesResolved: EvaluationResult[] = [];
//   //   for (const configRule of configRules) {
//   //     const result: ExecJSON.ControlResult[] = [];
//   //     let params = {
//   //       ConfigRuleName: configRule.ConfigRuleName || '',
//   //       Limit: 100
//   //     };
//   //     await this.delay(150);
//   //     let response =
//   //       await this.configService.getComplianceDetailsByConfigRule(params);
//   //     let ruleResults = response.EvaluationResults || [];
//   //     allRulesResolved.push(...ruleResults);
//   //     while (response.NextToken !== undefined) {
//   //       params = _.set(params, 'NextToken', response.NextToken);
//   //       await this.delay(150);
//   //       response =
//   //         await this.configService.getComplianceDetailsByConfigRule(params);
//   //       ruleResults = ruleResults?.concat(response.EvaluationResults || []);
//   //       allRulesResolved.push(...ruleResults);
//   //     }
//   //     ruleResults.forEach((evaluation) => {
//   //       const hdfResult: ExecJSON.ControlResult = {
//   //         code_desc: this.getCodeDesc(evaluation),
//   //         start_time: evaluation.ConfigRuleInvokedTime?.toISOString() || '',
//   //         run_time: this.getRunTime(evaluation),
//   //         status: this.getStatus(evaluation),
//   //         message: this.getMessage(
//   //           evaluation,
//   //           this.getCodeDesc(evaluation),
//   //           this.getStatus(evaluation)
//   //         )
//   //       };
//   //       result.push(hdfResult);
//   //       const currentDate: string = new Date().toISOString();
//   //       if (result.length === 0) {
//   //         switch (
//   //           complianceResults.find(
//   //             (complianceResult) =>
//   //               complianceResult.ConfigRuleName === configRule.ConfigRuleName
//   //           )?.Compliance?.ComplianceType
//   //         ) {
//   //           case 'NOT_APPLICABLE':
//   //             return [
//   //               {
//   //                 run_time: 0,
//   //                 code_desc: NOT_APPLICABLE_MSG,
//   //                 skip_message: NOT_APPLICABLE_MSG,
//   //                 start_time: currentDate,
//   //                 status: ExecJSON.ControlResultStatus.Skipped
//   //               }
//   //             ];
//   //           case 'INSUFFICIENT_DATA':
//   //             return [
//   //               {
//   //                 run_time: 0,
//   //                 code_desc: INSUFFICIENT_DATA_MSG,
//   //                 skip_message: INSUFFICIENT_DATA_MSG,
//   //                 start_time: currentDate,
//   //                 status: ExecJSON.ControlResultStatus.Skipped
//   //               }
//   //             ];
//   //           default:
//   //             return [];
//   //         }
//   //       } else {
//   //         return ruleData.push(result);
//   //       }
//   //     });
//   //   }

//   //   return this.appendResourceNamesToResults(
//   //     await Promise.all(ruleData),
//   //     await this.extractResourceNamesFromIds(allRulesResolved)
//   //   );
//   // }

//   // private async appendResourceNamesToResults(
//   //   completedControlResults: ExecJSON.ControlResult[][],
//   //   extractedResourceNames: Record<string, string>
//   // ) {
//   //   return completedControlResults.map((completedControlResult) =>
//   //     completedControlResult.map((completedControl) => {
//   //       for (const extractedResourceName in extractedResourceNames) {
//   //         if (
//   //           completedControl.code_desc.indexOf(
//   //             JSON.stringify(extractedResourceName)
//   //               .replace(/\"/gi, '')
//   //               .replace(/{/gi, '')
//   //               .replace(/}/gi, '')
//   //           ) !== -1
//   //         ) {
//   //           return {
//   //             ...completedControl,
//   //             code_desc: `${completedControl.code_desc}, resource_name: ${extractedResourceNames[extractedResourceName]}`
//   //           };
//   //         }
//   //       }
//   //       return completedControl;
//   //     })
//   //   );
//   // }

//   // private async extractResourceNamesFromIds(
//   //   evaluationResults: EvaluationResult[]
//   // ) {
//   //   // Map of resource types to resource IDs {resourceType: ResourceId[]}
//   //   const resourceMap: Partial<Record<ResourceType, string[]>> = {};
//   //   // Map of resource IDs to resource names
//   //   const resolvedResourcesMap: Record<string, string> = {};
//   //   // Extract resource Ids
//   //   evaluationResults.forEach((result) => {
//   //     const resourceType: ResourceType =
//   //       ResourceType[
//   //         _.get(
//   //           result,
//   //           'EvaluationResultIdentifier.EvaluationResultQualifier.ResourceType'
//   //         ) as keyof typeof ResourceType
//   //       ];
//   //     const resourceId: string = _.get(
//   //       result,
//   //       'EvaluationResultIdentifier.EvaluationResultQualifier.ResourceId'
//   //     ) as unknown as string;
//   //     if (resourceType in resourceMap) {
//   //       if (
//   //         !resourceMap[resourceType]?.includes(resourceId) &&
//   //         typeof resourceId === 'string'
//   //       ) {
//   //         resourceMap[resourceType]?.push(resourceId);
//   //       }
//   //     } else {
//   //       resourceMap[resourceType] = [resourceId];
//   //     }
//   //   });
//   //   // Resolve resource names from AWS
//   //   let resourceType: ResourceType;
//   //   for (resourceType in resourceMap) {
//   //     const resourceIDSlices = _.chunk(resourceMap[resourceType], 20);
//   //     for (const slice of resourceIDSlices) {
//   //       await this.delay(150);
//   //       const resources = await this.configService.listDiscoveredResources({
//   //         resourceType: resourceType,
//   //         resourceIds: slice
//   //       });
//   //       resources.resourceIdentifiers?.forEach((resource) => {
//   //         if (resource.resourceId && resource.resourceName) {
//   //           resolvedResourcesMap[resource.resourceId] = resource.resourceName;
//   //         }
//   //       });
//   //     }
//   //   }
//   //   return resolvedResourcesMap;
//   // }

//   // private getCodeDesc(result: EvaluationResult): string {
//   //   let output = '';
//   //   if (
//   //     result.EvaluationResultIdentifier !== undefined &&
//   //     result.EvaluationResultIdentifier.EvaluationResultQualifier !== undefined
//   //   ) {
//   //     output = JSON.stringify(
//   //       result.EvaluationResultIdentifier.EvaluationResultQualifier
//   //     )
//   //       .replace(/\"/gi, '')
//   //       .replace(/{/gi, '')
//   //       .replace(/}/gi, '');
//   //   }
//   //   return output;
//   // }

//   // private getRunTime(result: EvaluationResult): number {
//   //   let diff = 0;
//   //   if (
//   //     result.ResultRecordedTime !== undefined &&
//   //     result.ConfigRuleInvokedTime !== undefined
//   //   ) {
//   //     diff =
//   //       (result.ResultRecordedTime.getTime() -
//   //         result.ConfigRuleInvokedTime.getTime()) /
//   //       1000;
//   //   }
//   //   return diff;
//   // }

//   private getStatus(controlScore: ControlScore): ExecJSON.ControlResultStatus {
//     // // if (controlScore.on === 'COMPLIANT') {
//     //   return ExecJSON.ControlResultStatus.Passed;
//     // } else if (result.ComplianceType === 'NON_COMPLIANT') {
//     //   return ExecJSON.ControlResultStatus.Failed;
//     // } else {
//     //   return ExecJSON.ControlResultStatus.Skipped;
//     // }
//     console.log('TODO:: Status hard coded to Faield');
//     return ExecJSON.ControlResultStatus.Failed;
//   }

//   // private getMessage(
//   //   result: EvaluationResult,
//   //   codeDesc: string,
//   //   status: ExecJSON.ControlResultStatus
//   // ): string | undefined {
//   //   if (status === ExecJSON.ControlResultStatus.Failed) {
//   //     return `${codeDesc}: ${
//   //       result.Annotation || 'Rule does not pass rule compliance'
//   //     }`;
//   //   } else {
//   //     return undefined;
//   //   }
//   // }

//   // eslint-disable-next-line @typescript-eslint/ban-types
//   private hdfTags(msftScore: ControlScore): Record<string, unknown> {
//     let result = {};
//     if (!_.isNull(msftScore.controlCategory)) {
//       result = _.set(result, 'category', msftScore.controlCategory);
//     }
//     return result;
//   }

//   private hdfDescriptions(msftScore: ControlScore) {
//     console.log('TODO: Returning hard coded hdfDescriptions()');
//     return [
//       // {
//       //   data: msftScore.description,
//       //   label: 'check' ?
//       // }
//     ];
//   }

//   private async getControls(): Promise<ExecJSON.Control[]> {
//     Promise.all([this.futProfiles, this.futSecureScore]).then((results) => {
//       const profiles: SecureScoreControlProfile[] = results[0];
//       const secureScore: SecureScore = results[1];

//       // console.log(profiles);
//       // console.log(secureScore);

//       const profByCtrlId: Record<string, SecureScoreControlProfile> =
//         Object.fromEntries(profiles.map((p) => [p.id, p]));

//       // console.log(profByCtrlId);
//       // const unknownKeys: string[] = [
//       //   'MFARegistrationV2',
//       //   'OneAdmin',
//       //   'PWAgePolicyNew',
//       //   'RoleOverlap',
//       //   'SelfServicePasswordReset',
//       //   'SigninRiskPolicy',
//       //   'UserRiskPolicy',
//       //   'mdo_safelinksforOfficeApps',
//       //   'mdo_safelinksforemail',
//       //   'mdo_similardomainssafetytips',
//       //   'mdo_similaruserssafetytips',
//       //   'mdo_spam_notifications_only_for_admins',
//       //   'mdo_spamaction',
//       //   'mdo_targeteddomainprotectionaction',
//       //   'mdo_targeteduserprotectionaction',
//       //   'mdo_targetedusersprotection',
//       //   'mdo_thresholdreachedaction',
//       //   'mdo_unusualcharacterssafetytips',
//       //   'mdo_zapmalware',
//       //   'mdo_zapphish',
//       //   'mdo_zapspam',
//       //   'mip_autosensitivitylabelspolicies',
//       //   'mip_purviewlabelconsent',
//       //   'mip_search_auditlog',
//       //   'mip_sensitivitylabelspolicies',
//       //   'spo_idle_session_timeout',
//       //   'spo_legacy_auth'
//       // ];

//       const defaultProfile: SecureScoreControlProfile = {};

//       const execControls = secureScore.controlScores?.map((score) => {
//         // console.log(
//         //   `${score.controlName} -> ${profByCtrlId[score.controlName || '']}`
//         // );
//         const profile = profByCtrlId[score.controlName || ''] || defaultProfile;

//         // console.log(JSON.stringify(profile, null, 4));

//         const control: ExecJSON.Control = {
//           id: score.controlName || '',
//           title: score.controlName || '',
//           desc: score.description || null,
//           impact: this.getImpact(profile.userImpact || ''),
//           tags: this.hdfTags(score),
//           descriptions: this.hdfDescriptions(score),
//           refs: [],
//           source_location: {ref: score.controlName, line: 1},
//           code: '',
//           results: [] //this.results[index]
//         };
//         return control;
//       });

//       return execControls;
//     });

//     // const tenantId = secureScore.azureTenantId;
//     // let createdDate = new Date(secureScore.createdDateTime || '');
//     // secureScore.enabledServices

//     // const controls = _.map(secureScore.controlScores, (ctrlScore) => {
//     //   return {
//     //     attestationData: ''
//     //   }
//     // });

//     const results: ExecJSON.Control[] = [];
//     console.log('TODO: Controls hard coded as empty list');

//     return results;
//   }

//   private getImpact(userImpact: string): number {
//     const normalized = userImpact.toLowerCase();
//     if (normalized.search('high') !== -1) {
//       return 1.0;
//     } else if (
//       normalized.search('moderate') !== -1 ||
//       normalized.search('medium') !== -1
//     ) {
//       return 0.5;
//     } else {
//       return 0.0;
//     }
//   }

//   public async toHdf(): Promise<ExecJSON.Execution> {
//     const hdf: ExecJSON.Execution = {
//       platform: {
//         name: 'Heimdall Tools',
//         release: HeimdallToolsVersion,
//         target_id: ''
//       },
//       version: HeimdallToolsVersion,
//       statistics: {
//         //aws_config_sdk_version: ConfigService., // How do i get the sdk version?
//         duration: null
//       },
//       profiles: [
//         {
//           name: NAME,
//           version: '',
//           title: NAME,
//           maintainer: null,
//           summary: NAME,
//           license: null,
//           copyright: null,
//           copyright_email: null,
//           supports: [],
//           attributes: [],
//           depends: [],
//           groups: [],
//           status: 'loaded',
//           controls: await this.getControls(),
//           sha256: ''
//         }
//       ]
//     };

//     console.log('In Heimdall format:');
//     console.log(JSON.stringify(hdf, null, 4));
//     return hdf;
//   }
// }

// const mapper = new MsftConfigMapper();
// mapper.toHdf().then(console.log);
