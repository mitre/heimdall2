import {
  ComplianceByConfigRule,
  ConfigRule,
  ConfigService,
  ConfigServiceClientConfig,
  DescribeConfigRulesCommandInput,
  DescribeConfigRulesCommandOutput,
  EvaluationResult
} from '@aws-sdk/client-config-service';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
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
  constructor(options: ConfigServiceClientConfig) {
    this.configService = new ConfigService(options);
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
  ): Promise<DescribeConfigRulesCommandOutput> {
    await this.delay(500);
    return this.configService.describeConfigRules(params);
  }

  private async getResults(
    configRules: ConfigRule[]
  ): Promise<ExecJSON.ControlResult[][]> {
    const complianceResults: ComplianceByConfigRule[] =
      await this.fetchAllComplianceInfo(configRules);
    const results = configRules.map(async (rule) => {
      const result: ExecJSON.ControlResult[] = [];
      let params = {
        ConfigRuleName: rule.ConfigRuleName,
        Limit: 100
      };
      await this.delay(500);
      let response = await this.configService.getComplianceDetailsByConfigRule(
        params
      );
      let ruleResults = response.EvaluationResults || [];
      while (response.NextToken !== undefined) {
        params = _.set(params, 'NextToken', response.NextToken);
        await this.delay(500);
        response = await this.configService.getComplianceDetailsByConfigRule(
          params
        );
        ruleResults = ruleResults?.concat(response.EvaluationResults || []);
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
      });
      const currentDate: string = new Date().toISOString();
      if (result.length === 0) {
        switch (
          complianceResults.find(
            (complianceResult) =>
              complianceResult.ConfigRuleName === rule.ConfigRuleName
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
        return result;
      }
    });
    const output: ExecJSON.ControlResult[][] = await Promise.all(results);
    return output;
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
    for (const rule of configRules) {
      const response = await this.configService.describeComplianceByConfigRule({
        ConfigRuleNames: [rule.ConfigRuleName || '']
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
      defaultMatch = AWS_CONFIG_MAPPING.nistFilter([sourceIdentifier]);
    }
    if (Array.isArray(defaultMatch) && defaultMatch.length !== 0) {
      result = _.set(
        result,
        'nist',
        _.get(result, 'nist').concat(defaultMatch)
      );
    }
    if (
      Array.isArray(_.get(result, 'nist')) &&
      _.get(result, 'nist').length === 0
    ) {
      result = _.set(result, 'nist', ['unmapped']);
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
