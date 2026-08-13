import type {
  ComplianceByConfigRule,
  ConfigRule,
  ConfigServiceClientConfig,
  DescribeConfigRulesCommandInput,
  DescribeConfigRulesResponse,
  EvaluationResult} from '@aws-sdk/client-config-service';
import {
  ConfigService,
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
const CONFIG_RULE_ACCOUNT_ID = /:(\d{12}):config-rule/;

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

  private appendResourceNamesToResults(
    completedControlResults: ExecJSON.ControlResult[][],
    extractedResourceNames: Map<string, string>
  ) {
    return completedControlResults.map((completedControlResult) =>
      completedControlResult.map((completedControl) => {
        for (const [extractedResourceName, resourceName] of extractedResourceNames) {
          if (
            completedControl.code_desc.includes(
              JSON.stringify(extractedResourceName)
                .replaceAll(/"/g, '')
                .replaceAll(/\{/g, '')
                .replaceAll(/\}/g, '')
            )
          ) {
            return {
              ...completedControl,
              code_desc: `${completedControl.code_desc}, resource_name: ${resourceName}`
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
    // Maps, not Records: resource types and ids arrive from the AWS
    // response, and plain-object accumulation is where a hostile key reaches
    // prototype state ('__proto__' writes hit the setter; `in` walks the
    // prototype chain).
    const resourceMap = new Map<ResourceType, string[]>();
    // Map of resource IDs to resource names
    const resolvedResourcesMap = new Map<string, string>();
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
      const existingIds = resourceMap.get(resourceType);
      if (existingIds) {
        if (!existingIds.includes(resourceId) && typeof resourceId === 'string') {
          existingIds.push(resourceId);
        }
      } else {
        resourceMap.set(resourceType, [resourceId]);
      }
    });
    // Resolve resource names from AWS
    for (const [resourceType, resourceIds] of resourceMap) {
      const resourceIDSlices = _.chunk(resourceIds, 20);
      for (const slice of resourceIDSlices) {
        await this.delay(150);
        const resources = await this.configService.listDiscoveredResources({
          resourceType: resourceType,
          resourceIds: slice
        });
        resources.resourceIdentifiers?.forEach((resource) => {
          if (resource.resourceId && resource.resourceName) {
            resolvedResourcesMap.set(resource.resourceId, resource.resourceName);
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
        .replaceAll(/"/g, '')
        .replaceAll(/\{/g, '')
        .replaceAll(/\}/g, '');
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
    if (Array.isArray(defaultMatch) && defaultMatch.length > 0) {
      result = _.set(result, 'nist', [
        ...(_.get(result, 'nist') as unknown as string[]),
        ...defaultMatch
      ]);
    }
    return result;
  }

  private checkText(configRule: ConfigRule): string {
    let params: any[] = [];
    if (
      configRule.InputParameters !== undefined &&
      configRule.InputParameters !== '{}'
    ) {
      params = configRule.InputParameters.replaceAll(/\{/g, '')
        .replaceAll(/\}/g, '')
        .split(',');
    }
    const checkText = [
      `ARN: ${configRule.ConfigRuleArn || 'N/A'}`,
      `Source Identifier: ${configRule.Source?.SourceIdentifier || 'N/A'}`
    ];
    if (params.length > 0) {
      checkText.push(params.join('<br/>').replaceAll(/"/g, ''));
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
    const matches = CONFIG_RULE_ACCOUNT_ID.exec(arn);
    if (matches === null) {
      return 'no-account-id';
    } else {
      return matches[0];
    }
  }

  private async getControls(): Promise<ExecJSON.Control[]> {
    const issues = await this.issues;
    return issues.map((issue: ConfigRule, index) => {
      const control: ExecJSON.Control = {
        id: issue.ConfigRuleId || '',
        title: `${this.getAccountId(issue.ConfigRuleArn || '')} - ${
          issue.ConfigRuleName
        }`
          .replaceAll(/:/g, '')
          .replaceAll(/config-rule/gi, ''),
        desc: issue.Description || null,
        impact: this.getImpact(issue),
        tags: this.hdfTags(issue),
        descriptions: this.hdfDescriptions(issue),
        refs: [],
        source_location: {ref: issue.ConfigRuleArn, line: 1},
        code: '',
        // Parallel array built from the same source: the map callback's own
        // index addresses it; [] can only occur if the arrays ever diverge.
        results: this.results.at(index) ?? []
      };
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
        // aws_config_sdk_version: ConfigService., // How do i get the sdk version?
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
