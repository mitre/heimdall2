import {
  ComplianceByConfigRule,
  ConfigRule,
  ConfigService,
  ConfigServiceClientConfig,
  DescribeConfigRulesCommandInput,
  DescribeConfigRulesResponse,
  EvaluationResult,
  ResourceType
} from '@aws-sdk/client-config-service';
import {NodeHttpHandler} from '@smithy/node-http-handler';
import https from 'https';
import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {AwsConfigMapping} from './mappings/AwsConfigMapping';

const NOT_APPLICABLE_MSG =
  'No AWS resources found to evaluate compliance for this rule';
const INSUFFICIENT_DATA_MSG =
  'Not enough data has been collected to determine compliance yet.';
const NAME = 'AWS Config';

const AWS_CONFIG_MAPPING = new AwsConfigMapping();

export class AwsConfigMapper {
  configService: ConfigService;
  issues: Promise<ConfigRule[]>;
  results: ExecJSON.ControlResult[][];
  constructor(
    options: ConfigServiceClientConfig,
    verifySSLCertificates = true,
    certificate?: string
  ) {
    const clientOptions: ConfigServiceClientConfig = {
      ...options,
      requestHandler: new NodeHttpHandler({
        httpsAgent: new https.Agent({
          // Disable HTTPS verification if requested
          rejectUnauthorized: verifySSLCertificates,
          // Pass an SSL certificate to trust
          ca: certificate
        })
      })
    };
    this.configService = new ConfigService(clientOptions);
    this.results = [];
    this.issues = this.getAllConfigRules();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async getAllConfigRules(): Promise<ConfigRule[]> {
    let params: DescribeConfigRulesCommandInput = {
      ConfigRuleNames: [],
      NextToken: ''
    };
    const configRules: ConfigRule[] = [];
    let response = await this.getConfigRulePage(params);
    if (response.ConfigRules === undefined) {
      throw new Error('No data was returned');
    } else {
      while (response !== undefined && response.ConfigRules !== undefined) {
        response.ConfigRules.forEach((rule) => {
          configRules.push(rule);
        });
        if (response.NextToken) {
          params = _.set(params, 'NextToken', response.NextToken);
        } else {
          break;
        }
        response = await this.getConfigRulePage(params);
      }
    }
    this.results = await this.getResults(configRules);
    return configRules;
  }

  private async getConfigRulePage(
    params: DescribeConfigRulesCommandInput
  ): Promise<DescribeConfigRulesResponse> {
    await this.delay(150);
    return this.configService.describeConfigRules(params);
  }

  private async getResults(
    configRules: ConfigRule[]
  ): Promise<ExecJSON.ControlResult[][]> {
    const complianceResults: ComplianceByConfigRule[] =
      await this.fetchAllComplianceInfo(configRules);
    const ruleData: ExecJSON.ControlResult[][] = [];
    const allRulesResolved: EvaluationResult[] = [];
    for (const configRule of configRules) {
      const result: ExecJSON.ControlResult[] = [];
      let params = {
        ConfigRuleName: configRule.ConfigRuleName || '',
        Limit: 100
      };
      await this.delay(150);
      let response =
        await this.configService.getComplianceDetailsByConfigRule(params);
      let ruleResults = response.EvaluationResults || [];
      allRulesResolved.push(...ruleResults);
      while (response.NextToken !== undefined) {
        params = _.set(params, 'NextToken', response.NextToken);
        await this.delay(150);
        response =
          await this.configService.getComplianceDetailsByConfigRule(params);
        ruleResults = ruleResults?.concat(response.EvaluationResults || []);
        allRulesResolved.push(...ruleResults);
      }
      ruleResults.forEach((evaluation) => {
        const hdfResult: ExecJSON.ControlResult = {
          code_desc: this.getCodeDesc(evaluation),
          start_time: evaluation.ConfigRuleInvokedTime?.toISOString() || '',
          run_time: this.getRunTime(evaluation),
          status: this.getStatus(evaluation),
          message: this.getMessage(
            evaluation,
            this.getCodeDesc(evaluation),
            this.getStatus(evaluation)
          )
        };
        result.push(hdfResult);
        const currentDate: string = new Date().toISOString();
        if (result.length === 0) {
          switch (
            complianceResults.find(
              (complianceResult) =>
                complianceResult.ConfigRuleName === configRule.ConfigRuleName
            )?.Compliance?.ComplianceType
          ) {
            case 'NOT_APPLICABLE':
              return [
                {
                  run_time: 0,
                  code_desc: NOT_APPLICABLE_MSG,
                  skip_message: NOT_APPLICABLE_MSG,
                  start_time: currentDate,
                  status: ExecJSON.ControlResultStatus.Skipped
                }
              ];
            case 'INSUFFICIENT_DATA':
              return [
                {
                  run_time: 0,
                  code_desc: INSUFFICIENT_DATA_MSG,
                  skip_message: INSUFFICIENT_DATA_MSG,
                  start_time: currentDate,
                  status: ExecJSON.ControlResultStatus.Skipped
                }
              ];
            default:
              return [];
          }
        } else {
          return ruleData.push(result);
        }
      });
    }

    return this.appendResourceNamesToResults(
      await Promise.all(ruleData),
      await this.extractResourceNamesFromIds(allRulesResolved)
    );
  }

  private async appendResourceNamesToResults(
    completedControlResults: ExecJSON.ControlResult[][],
    extractedResourceNames: Record<string, string>
  ) {
    return completedControlResults.map((completedControlResult) =>
      completedControlResult.map((completedControl) => {
        for (const extractedResourceName in extractedResourceNames) {
          if (
            completedControl.code_desc.indexOf(
              JSON.stringify(extractedResourceName)
                .replace(/\"/gi, '')
                .replace(/{/gi, '')
                .replace(/}/gi, '')
            ) !== -1
          ) {
            return {
              ...completedControl,
              code_desc: `${completedControl.code_desc}, resource_name: ${extractedResourceNames[extractedResourceName]}`
            };
          }
        }
        return completedControl;
      })
    );
  }

  private async extractResourceNamesFromIds(
    evaluationResults: EvaluationResult[]
  ) {
    // Map of resource types to resource IDs {resourceType: ResourceId[]}
    const resourceMap: Partial<Record<ResourceType, string[]>> = {};
    // Map of resource IDs to resource names
    const resolvedResourcesMap: Record<string, string> = {};
    // Extract resource Ids
    evaluationResults.forEach((result) => {
      const resourceType: ResourceType =
        ResourceType[
          _.get(
            result,
            'EvaluationResultIdentifier.EvaluationResultQualifier.ResourceType'
          ) as keyof typeof ResourceType
        ];
      const resourceId: string = _.get(
        result,
        'EvaluationResultIdentifier.EvaluationResultQualifier.ResourceId'
      ) as unknown as string;
      if (resourceType in resourceMap) {
        if (
          !resourceMap[resourceType]?.includes(resourceId) &&
          typeof resourceId === 'string'
        ) {
          resourceMap[resourceType]?.push(resourceId);
        }
      } else {
        resourceMap[resourceType] = [resourceId];
      }
    });
    // Resolve resource names from AWS
    let resourceType: ResourceType;
    for (resourceType in resourceMap) {
      const resourceIDSlices = _.chunk(resourceMap[resourceType], 20);
      for (const slice of resourceIDSlices) {
        await this.delay(150);
        const resources = await this.configService.listDiscoveredResources({
          resourceType: resourceType,
          resourceIds: slice
        });
        resources.resourceIdentifiers?.forEach((resource) => {
          if (resource.resourceId && resource.resourceName) {
            resolvedResourcesMap[resource.resourceId] = resource.resourceName;
          }
        });
      }
    }
    return resolvedResourcesMap;
  }

  private getCodeDesc(result: EvaluationResult): string {
    let output = '';
    if (
      result.EvaluationResultIdentifier !== undefined &&
      result.EvaluationResultIdentifier.EvaluationResultQualifier !== undefined
    ) {
      output = JSON.stringify(
        result.EvaluationResultIdentifier.EvaluationResultQualifier
      )
        .replace(/\"/gi, '')
        .replace(/{/gi, '')
        .replace(/}/gi, '');
    }
    return output;
  }

  private getRunTime(result: EvaluationResult): number {
    let diff = 0;
    if (
      result.ResultRecordedTime !== undefined &&
      result.ConfigRuleInvokedTime !== undefined
    ) {
      diff =
        (result.ResultRecordedTime.getTime() -
          result.ConfigRuleInvokedTime.getTime()) /
        1000;
    }
    return diff;
  }

  private getStatus(result: EvaluationResult): ExecJSON.ControlResultStatus {
    if (result.ComplianceType === 'COMPLIANT') {
      return ExecJSON.ControlResultStatus.Passed;
    } else if (result.ComplianceType === 'NON_COMPLIANT') {
      return ExecJSON.ControlResultStatus.Failed;
    } else {
      return ExecJSON.ControlResultStatus.Skipped;
    }
  }

  private getMessage(
    result: EvaluationResult,
    codeDesc: string,
    status: ExecJSON.ControlResultStatus
  ): string | undefined {
    if (status === ExecJSON.ControlResultStatus.Failed) {
      return `${codeDesc}: ${
        result.Annotation || 'Rule does not pass rule compliance'
      }`;
    } else {
      return undefined;
    }
  }

  private async fetchAllComplianceInfo(
    configRules: ConfigRule[]
  ): Promise<ComplianceByConfigRule[]> {
    const complianceResults: ComplianceByConfigRule[] = [];
    // Should slice config rules into arrays of max size: 25 and make one request for each slice
    const configRuleSlices = _.chunk(configRules, 25);
    for (const slice of configRuleSlices) {
      await this.delay(150);
      const response = await this.configService.describeComplianceByConfigRule({
        ConfigRuleNames: slice.map((rule) => rule.ConfigRuleName || '')
      });
      if (response.ComplianceByConfigRules === undefined) {
        throw new Error('No compliance data was returned');
      } else {
        response.ComplianceByConfigRules?.forEach((compliance) =>
          complianceResults.push(compliance)
        );
      }
    }
    return complianceResults;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  private hdfTags(configRule: ConfigRule): Record<string, unknown> {
    let result = {};
    const sourceIdentifier = configRule.Source?.SourceIdentifier;
    result = _.set(result, 'nist', []);
    let defaultMatch: string[] | null = [];
    if (sourceIdentifier !== undefined) {
      defaultMatch = AWS_CONFIG_MAPPING.searchNIST([sourceIdentifier]);
    }
    if (Array.isArray(defaultMatch) && defaultMatch.length !== 0) {
      result = _.set(
        result,
        'nist',
        (_.get(result, 'nist') as unknown as string[]).concat(defaultMatch)
      );
    }
    return result;
  }

  private checkText(configRule: ConfigRule): string {
    let params: any[] = [];
    if (
      configRule.InputParameters !== undefined &&
      configRule.InputParameters !== '{}'
    ) {
      params = configRule.InputParameters.replace(/{/gi, '')
        .replace(/}/gi, '')
        .split(',');
    }
    const checkText = [];
    checkText.push(`ARN: ${configRule.ConfigRuleArn || 'N/A'}`);
    checkText.push(
      `Source Identifier: ${configRule.Source?.SourceIdentifier || 'N/A'}`
    );
    if (params.length !== 0) {
      checkText.push(`${params.join('<br/>').replace(/\"/gi, '')}`);
    }
    return checkText.join('<br/>');
  }

  private hdfDescriptions(configRule: ConfigRule) {
    return [
      {
        data: this.checkText(configRule),
        label: 'check'
      }
    ];
  }

  private getAccountId(arn: string): string {
    const matches = arn.match(/:(\d{12}):config-rule/);
    if (matches === null) {
      return 'no-account-id';
    } else {
      return matches[0];
    }
  }

  private async getControls(): Promise<ExecJSON.Control[]> {
    let index = 0;
    return (await this.issues).map((issue: ConfigRule) => {
      const control: ExecJSON.Control = {
        id: issue.ConfigRuleId || '',
        title: `${this.getAccountId(issue.ConfigRuleArn || '')} - ${
          issue.ConfigRuleName
        }`
          .replace(/:/gi, '')
          .replace(/config-rule/gi, ''),
        desc: issue.Description || null,
        impact: this.getImpact(issue),
        tags: this.hdfTags(issue),
        descriptions: this.hdfDescriptions(issue),
        refs: [],
        source_location: {ref: issue.ConfigRuleArn, line: 1},
        code: '',
        results: this.results[index]
      };
      index++;
      return control;
    });
  }

  private getImpact(issue: ConfigRule): number {
    if (_.get(issue, 'compliance') === 'NOT_APPLICABLE') {
      return 0;
    } else {
      return 0.5;
    }
  }

  public async toHdf(): Promise<ExecJSON.Execution> {
    const hdf: ExecJSON.Execution = {
      platform: {
        name: 'Heimdall Tools',
        release: HeimdallToolsVersion,
        target_id: ''
      },
      version: HeimdallToolsVersion,
      statistics: {
        //aws_config_sdk_version: ConfigService., // How do i get the sdk version?
        duration: null
      },
      profiles: [
        {
          name: NAME,
          version: '',
          title: NAME,
          maintainer: null,
          summary: NAME,
          license: null,
          copyright: null,
          copyright_email: null,
          supports: [],
          attributes: [],
          depends: [],
          groups: [],
          status: 'loaded',
          controls: await this.getControls(),
          sha256: ''
        }
      ]
    };
    return hdf;
  }
}
