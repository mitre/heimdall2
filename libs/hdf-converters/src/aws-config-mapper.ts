import https from 'https';
import type {
  ComplianceByConfigRule,
  ConfigRule,
  ConfigServiceClientConfig,
  DescribeConfigRulesCommandInput,
  DescribeConfigRulesResponse,
  EvaluationResult,
} from '@aws-sdk/client-config-service';
import {
  ConfigService,
  ResourceType,
} from '@aws-sdk/client-config-service';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import { AwsConfigMapping } from './mappings/AwsConfigMapping';
import { HeimdallToolsVersion } from './utils/global';

const NOT_APPLICABLE_MSG
  = 'No AWS resources found to evaluate compliance for this rule';
const INSUFFICIENT_DATA_MSG
  = 'Not enough data has been collected to determine compliance yet.';
const NAME = 'AWS Config';

const AWS_CONFIG_MAPPING = new AwsConfigMapping();
const ACCOUNT_ID_RE = /:(?<accountId>\d{12}):config-rule/v;

export class AwsConfigMapper {
  configService: ConfigService;
  issues: Promise<ConfigRule[]>;
  results: ExecJSON.ControlResult[][];
  constructor(
    options: ConfigServiceClientConfig,
    shouldVerifySSLCertificates = true,
    certificate?: string,
  ) {
    const clientOptions: ConfigServiceClientConfig = {
      ...options,
      requestHandler: new NodeHttpHandler({
        httpsAgent: new https.Agent({
          // Pass an SSL certificate to trust
          ca: certificate,
          // Disable HTTPS verification if requested
          rejectUnauthorized: shouldVerifySSLCertificates,
        }),
      }),
    };
    this.configService = new ConfigService(clientOptions);
    this.results = [];
    this.issues = this.getAllConfigRules();
  }

  public async toHdf(): Promise<ExecJSON.Execution> {
    const hdf: ExecJSON.Execution = {
      platform: {
        name: 'Heimdall Tools',
        release: HeimdallToolsVersion,
        target_id: '',
      },
      profiles: [
        {
          attributes: [],
          controls: await this.getControls(),
          copyright: null,
          copyright_email: null,
          depends: [],
          groups: [],
          license: null,
          maintainer: null,
          name: NAME,
          sha256: '',
          status: 'loaded',
          summary: NAME,
          supports: [],
          title: NAME,
          version: '',
        },
      ],
      statistics: {
        // aws_config_sdk_version: ConfigService., // How do i get the sdk version?
        duration: null,
      },
      version: HeimdallToolsVersion,
    };
    return hdf;
  }

  private appendResourceNamesToResults(
    completedControlResults: ExecJSON.ControlResult[][],
    extractedResourceNames: Record<string, string>,
  ) {
    return completedControlResults.map(completedControlResult =>
      completedControlResult.map((completedControl) => {
        for (const extractedResourceName in extractedResourceNames) {
          if (
            completedControl.code_desc.includes(JSON.stringify(extractedResourceName)
              .replaceAll('"', '')
              .replaceAll('{', '')
              .replaceAll('}', ''))
          ) {
            return {
              ...completedControl,
              code_desc: `${completedControl.code_desc}, resource_name: ${extractedResourceNames[extractedResourceName]}`,
            };
          }
        }
        return completedControl;
      }),
    );
  }

  private checkText(configRule: ConfigRule): string {
    let params: any[] = [];
    if (
      configRule.InputParameters !== undefined
      && configRule.InputParameters !== '{}'
    ) {
      params = configRule.InputParameters.replaceAll('{', '')
        .replaceAll('}', '')
        .split(',');
    }
    const checkText = [`ARN: ${configRule.ConfigRuleArn || 'N/A'}`,
      `Source Identifier: ${configRule.Source?.SourceIdentifier || 'N/A'}`];
    if (params.length > 0) {
      checkText.push(params.join('<br/>').replaceAll('"', ''));
    }
    return checkText.join('<br/>');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async extractResourceNamesFromIds(
    evaluationResults: EvaluationResult[],
  ) {
    // Map of resource types to resource IDs {resourceType: ResourceId[]}
    const resourceMap: Partial<Record<ResourceType, string[]>> = {};
    // Map of resource IDs to resource names
    const resolvedResourcesMap: Record<string, string> = {};
    // Extract resource Ids
    for (const result of evaluationResults) {
      const resourceType: ResourceType
        = ResourceType[
          _.get(
            result,
            'EvaluationResultIdentifier.EvaluationResultQualifier.ResourceType',
          ) as keyof typeof ResourceType
        ];
      const resourceId: string = _.get(
        result,
        'EvaluationResultIdentifier.EvaluationResultQualifier.ResourceId',
      ) as unknown as string;
      if (resourceType in resourceMap) {
        if (
          !resourceMap[resourceType]?.includes(resourceId)
          && typeof resourceId === 'string'
        ) {
          resourceMap[resourceType]?.push(resourceId);
        }
      } else {
        resourceMap[resourceType] = [resourceId];
      }
    }
    // Resolve resource names from AWS
    let resourceType: ResourceType;
    for (resourceType in resourceMap) {
      const resourceIDSlices = _.chunk(resourceMap[resourceType], 20);
      for (const slice of resourceIDSlices) {
        await this.delay(150);
        const resources = await this.configService.listDiscoveredResources({
          resourceIds: slice,
          resourceType: resourceType,
        });
        if (resources.resourceIdentifiers) {
          for (const resource of resources.resourceIdentifiers) {
            if (resource.resourceId && resource.resourceName) {
              resolvedResourcesMap[resource.resourceId] = resource.resourceName;
            }
          }
        }
      }
    }
    return resolvedResourcesMap;
  }

  private async fetchAllComplianceInfo(
    configRules: ConfigRule[],
  ): Promise<ComplianceByConfigRule[]> {
    const complianceResults: ComplianceByConfigRule[] = [];
    // Should slice config rules into arrays of max size: 25 and make one request for each slice
    const configRuleSlices = _.chunk(configRules, 25);
    for (const slice of configRuleSlices) {
      await this.delay(150);
      const response = await this.configService.describeComplianceByConfigRule({ ConfigRuleNames: slice.map(rule => rule.ConfigRuleName || '') });
      if (response.ComplianceByConfigRules === undefined) {
        throw new Error('No compliance data was returned');
      }
      if (response.ComplianceByConfigRules) {
        for (const compliance of response.ComplianceByConfigRules) {
          complianceResults.push(compliance)
          ;
        }
      }
    }
    return complianceResults;
  }

  private getAccountId(arn: string): string {
    const matches = ACCOUNT_ID_RE.exec(arn);
    return matches === null ? 'no-account-id' : matches[0];
  }

  private async getAllConfigRules(): Promise<ConfigRule[]> {
    let params: DescribeConfigRulesCommandInput = {
      ConfigRuleNames: [],
      NextToken: '',
    };
    const configRules: ConfigRule[] = [];
    let response = await this.getConfigRulePage(params);
    if (response.ConfigRules === undefined) {
      throw new Error('No data was returned');
    }
    while (response?.ConfigRules !== undefined) {
      for (const rule of response.ConfigRules) {
        configRules.push(rule);
      }
      if (response.NextToken) {
        params = _.set(params, 'NextToken', response.NextToken);
      } else {
        break;
      }
      response = await this.getConfigRulePage(params);
    }
    this.results = await this.getResults(configRules);
    return configRules;
  }

  private getCodeDesc(result: EvaluationResult): string {
    let output = '';
    if (
      result.EvaluationResultIdentifier?.EvaluationResultQualifier !== undefined
    ) {
      output = JSON.stringify(
        result.EvaluationResultIdentifier.EvaluationResultQualifier,
      )
        .replaceAll('"', '')
        .replaceAll('{', '')
        .replaceAll('}', '');
    }
    return output;
  }

  private async getConfigRulePage(
    params: DescribeConfigRulesCommandInput,
  ): Promise<DescribeConfigRulesResponse> {
    await this.delay(150);
    return this.configService.describeConfigRules(params);
  }

  private async getControls(): Promise<ExecJSON.Control[]> {
    let index = 0;
    const issues = await this.issues;
    return issues.map((issue: ConfigRule) => {
      const control: ExecJSON.Control = {
        code: '',
        desc: issue.Description || null,
        descriptions: this.hdfDescriptions(issue),
        id: issue.ConfigRuleId || '',
        impact: this.getImpact(issue),
        refs: [],
        results: this.results[index],
        source_location: { line: 1, ref: issue.ConfigRuleArn },
        tags: this.hdfTags(issue),
        title: `${this.getAccountId(issue.ConfigRuleArn || '')} - ${
          issue.ConfigRuleName
        }`
          .replaceAll(':', '')
          .replaceAll(/config-rule/giv, ''),
      };
      index++;
      return control;
    });
  }

  private getImpact(issue: ConfigRule): number {
    return _.get(issue, 'compliance') === 'NOT_APPLICABLE' ? 0 : 0.5;
  }

  private getMessage(
    result: EvaluationResult,
    codeDesc: string,
    status: ExecJSON.ControlResultStatus,
  ): string | undefined {
    return status === ExecJSON.ControlResultStatus.Failed
      ? `${codeDesc}: ${
        result.Annotation || 'Rule does not pass rule compliance'
      }`
      : undefined;
  }

  private async getResults(
    configRules: ConfigRule[],
  ): Promise<ExecJSON.ControlResult[][]> {
    const complianceResults: ComplianceByConfigRule[]
      = await this.fetchAllComplianceInfo(configRules);
    const ruleData: ExecJSON.ControlResult[][] = [];
    const allRulesResolved: EvaluationResult[] = [];
    for (const configRule of configRules) {
      const result: ExecJSON.ControlResult[] = [];
      let params = {
        ConfigRuleName: configRule.ConfigRuleName || '',
        Limit: 100,
      };
      await this.delay(150);
      let response
        = await this.configService.getComplianceDetailsByConfigRule(params);
      let ruleResults = response.EvaluationResults || [];
      allRulesResolved.push(...ruleResults);
      while (response.NextToken !== undefined) {
        params = _.set(params, 'NextToken', response.NextToken);
        await this.delay(150);
        response
          = await this.configService.getComplianceDetailsByConfigRule(params);
        ruleResults = [...ruleResults, ...response.EvaluationResults || []];
        allRulesResolved.push(...ruleResults);
      }
      for (const evaluation of ruleResults) {
        const hdfResult: ExecJSON.ControlResult = {
          code_desc: this.getCodeDesc(evaluation),
          message: this.getMessage(
            evaluation,
            this.getCodeDesc(evaluation),
            this.getStatus(evaluation),
          ),
          run_time: this.getRunTime(evaluation),
          start_time: evaluation.ConfigRuleInvokedTime?.toISOString() || '',
          status: this.getStatus(evaluation),
        };
        result.push(hdfResult);
        const currentDate: string = new Date().toISOString();
        if (result.length === 0) {
          switch (
            complianceResults.find(
              complianceResult =>
                complianceResult.ConfigRuleName === configRule.ConfigRuleName,
            )?.Compliance?.ComplianceType
          ) {
            case 'NOT_APPLICABLE': {
              ruleData.push([
                {
                  code_desc: NOT_APPLICABLE_MSG,
                  run_time: 0,
                  skip_message: NOT_APPLICABLE_MSG,
                  start_time: currentDate,
                  status: ExecJSON.ControlResultStatus.Skipped,
                },
              ]);
              continue;
            }
            case 'INSUFFICIENT_DATA': {
              ruleData.push([
                {
                  code_desc: INSUFFICIENT_DATA_MSG,
                  run_time: 0,
                  skip_message: INSUFFICIENT_DATA_MSG,
                  start_time: currentDate,
                  status: ExecJSON.ControlResultStatus.Skipped,
                },
              ]);
              continue;
            }
            default: {
              continue;
            }
          }
        } else {
          ruleData.push(result);
        }
      }
    }

    return this.appendResourceNamesToResults(
      ruleData,
      await this.extractResourceNamesFromIds(allRulesResolved),
    );
  }

  private getRunTime(result: EvaluationResult): number {
    let diff = 0;
    if (
      result.ResultRecordedTime !== undefined
      && result.ConfigRuleInvokedTime !== undefined
    ) {
      diff
        = (result.ResultRecordedTime.getTime()
          - result.ConfigRuleInvokedTime.getTime())
        / 1000;
    }
    return diff;
  }

  private getStatus(result: EvaluationResult): ExecJSON.ControlResultStatus {
    if (result.ComplianceType === 'COMPLIANT') {
      return ExecJSON.ControlResultStatus.Passed;
    }
    return result.ComplianceType === 'NON_COMPLIANT' ? ExecJSON.ControlResultStatus.Failed : ExecJSON.ControlResultStatus.Skipped;
  }

  private hdfDescriptions(configRule: ConfigRule) {
    return [
      {
        data: this.checkText(configRule),
        label: 'check',
      },
    ];
  }

  private hdfTags(configRule: ConfigRule): Record<string, unknown> {
    let result = {};
    const sourceIdentifier = configRule.Source?.SourceIdentifier;
    result = _.set(result, 'nist', []);
    let defaultMatch: null | string[] = [];
    if (sourceIdentifier !== undefined) {
      defaultMatch = AWS_CONFIG_MAPPING.searchNIST([sourceIdentifier]);
    }
    if (Array.isArray(defaultMatch) && defaultMatch.length > 0) {
      result = _.set(
        result,
        'nist',
        [..._.get(result, 'nist') as unknown as string[], ...defaultMatch],
      );
    }
    return result;
  }
}
