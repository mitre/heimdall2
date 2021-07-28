import {
  ComplianceByConfigRule,
  ConfigRule,
  ConfigService,
  ConfigServiceClientConfig,
  DescribeConfigRulesCommandInput,
  DescribeConfigRulesCommandOutput,
  EvaluationResult
} from '@aws-sdk/client-config-service';
import {
  ExecJSON
} from 'inspecjs';
import _ from 'lodash';
import path from 'path';
import {version as HeimdallToolsVersion} from '../package.json';
import {AwsConfigMapping} from './mappings/AwsConfigMapping';
import * as fs from 'fs'

const NOT_APPLICABLE_MSG =
  'No AWS resources found to evaluate complaince for this rule';
const INSUFFICIENT_DATA_MSG =
  'Not enough data has been collected to determine compliance yet.';

const AWS_CONFIG_MAPPING_FILE = path.resolve(
  __dirname,
  '../data/aws-config-mapping.csv'
);
const AWS_CONFIG_MAPPING = new AwsConfigMapping(AWS_CONFIG_MAPPING_FILE);

export class AwsConfigMapper {
  configService: ConfigService;
  issues: Promise<ConfigRule[]>;

  constructor(options: ConfigServiceClientConfig) {
    this.configService = new ConfigService(options);
    this.issues = this.getAllConfigRules();
  }
  private async getAllConfigRules() {
    let params: DescribeConfigRulesCommandInput = {
      ConfigRuleNames: [],
      NextToken: ''
    };
    const configRules: ConfigRule[] = [];
    let response = await this.getConfigRulePage(params);
    if (response === undefined) {
      throw new Error('No data was returned');
    } else {
      while (
        response !== undefined &&
        response.ConfigRules !== undefined &&
        response.NextToken !== undefined
      ) {
        response.ConfigRules.forEach((rule) => {
          configRules.push(rule);
        });
        params = _.set(params, 'NextToken', response.NextToken);
        response = await this.getConfigRulePage(params);
      }
    }
    return this.addResultsToConfigRules(
      this.addComplianceToConfigRules(configRules)
    );
  }
  private async getConfigRulePage(params: DescribeConfigRulesCommandInput) {
    let result: DescribeConfigRulesCommandOutput | undefined
    result = await this.configService.describeConfigRules(params);
    return result
  }
  private addResultsToConfigRules(configRules: ConfigRule[]) {
    configRules.forEach(async (rule) => {
      let params = {
        ConfigRuleName: rule.ConfigRuleName,
        Limit: 100
      };
      let response = await this.configService.getComplianceDetailsByConfigRule(
        params
      );
      const ruleResults = response.EvaluationResults || [];
      do {
        params = _.set(params, 'NextToken', response.NextToken);
        response = await this.configService.getComplianceDetailsByConfigRule(
          params
        );
        ruleResults?.concat(response.EvaluationResults || []);
      } while (response.NextToken !== undefined)
      rule = _.set(rule, 'results', []);
      ruleResults.forEach((result) => {
        const hdfResult: ExecJSON.ControlResult = {
          code_desc: this.getCodeDesc(result),
          start_time: result.ConfigRuleInvokedTime?.toDateString() || '',
          run_time: this.getRunTime(result),
          status: this.getStatus(result),
          message: this.getMessage(result, this.getStatus(result))
        };
        rule = _.set(rule, 'results', _.get(rule, 'results').push(hdfResult));
      });
      switch (rule.ConfigRuleName) {
        case 'NOT_APPLICABLE': {
          rule = _.set(rule, 'impact', 0);
          rule = _.set(
            rule,
            'results',
            _.get(rule, 'results').concat([
              {
                run_time: 0,
                code_desc: NOT_APPLICABLE_MSG,
                skip_message: NOT_APPLICABLE_MSG,
                start_time: Date.now(), //GOTTA FIGURE THIS OUT TOO
                status: 'skipped'
              }
            ])
          );
        }
        case 'INSUFFICIENT_DATA': {
          rule = _.set(rule, 'impact', 0);
          rule = _.set(
            rule,
            'results',
            _.get(rule, 'results').concat([
              {
                run_time: 0,
                code_desc: INSUFFICIENT_DATA_MSG,
                skip_message: INSUFFICIENT_DATA_MSG,
                start_time: Date.now(), //GOTTA FIGURE THIS OUT TOO
                status: 'skipped'
              }
            ])
          );
        }
      }
    });
    return configRules;
  }
  private getCodeDesc(result: EvaluationResult): string {
    let output = '';
    if (
      result.EvaluationResultIdentifier !== undefined &&
      result.EvaluationResultIdentifier.EvaluationResultQualifier !== undefined
    ) {
      output = JSON.stringify(
        result.EvaluationResultIdentifier.EvaluationResultQualifier
      );
    }
    return output;
  }
  private getRunTime(result: EvaluationResult) {
    let diff = 0;
    if (
      result.ResultRecordedTime !== undefined &&
      result.ConfigRuleInvokedTime !== undefined
    ) {
      diff =
        result.ResultRecordedTime.getUTCDate() -
        result.ConfigRuleInvokedTime.getUTCDate();
    }
    return diff;
  }
  private getStatus(result: EvaluationResult) {
    if (result.ComplianceType === 'COMPLIANT') {
      return ExecJSON.ControlResultStatus.Passed;
    } else if (result.ComplianceType === 'NON_COMPLIANT') {
      return ExecJSON.ControlResultStatus.Failed;
    } else {
      return ExecJSON.ControlResultStatus.Skipped;
    }
  }
  private getMessage(result: EvaluationResult, status: ExecJSON.ControlResultStatus) {
    if (status === ExecJSON.ControlResultStatus.Failed) {
      return `${result.EvaluationResultIdentifier}: ${result.EvaluationResultIdentifier?.EvaluationResultQualifier
        }: ${result.Annotation || 'Rule does not pass rule compliance'}`;
    } else {
      return '';
    }
  }
  private addComplianceToConfigRules(configRules: ConfigRule[]) {
    const mappedComplianceInfo = this.fetchAllComplianceInfo(configRules);
    configRules.forEach((rule) => {
      rule = _.set(
        rule,
        'compliance',
        _.get(
          mappedComplianceInfo,
          `${rule.ConfigRuleName}.compliance.complianceType`
        )
      );
    });
    return configRules;
  }
  private fetchAllComplianceInfo(configRules: ConfigRule[]) {
    const complianceResults: ComplianceByConfigRule[] = [];
    _.chunk(configRules, 25).forEach(async (group) => {
      const configRuleNames = group.map(
        (element) => element.ConfigRuleName || ''
      );
      const params = {
        ComplianceTypes: [
          'COMPLIANT' ||
          'NON_COMPLIANT' ||
          'NOT_APPLICABLE' ||
          'INSUFFICIENT_DATA'
        ],
        ConfigRuleNames: configRuleNames,
        NextToken: ''
      };
      const response = await this.configService.describeComplianceByConfigRule(
        params
      );
      if (response.ComplianceByConfigRules !== undefined) {
        complianceResults.concat(response.ComplianceByConfigRules);
      }
    });
    const output = complianceResults.map((element) =>
      Object.fromEntries([[element.ConfigRuleName, element]])
    );
    return output;
  }
  private hdfTags(configRule: ConfigRule) {
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

    //Deal with custom mapping later
    // custom_mapping_match = @custom_mapping[source_identifier]

    // result['nist'] += custom_mapping_match['NIST-ID'].split('|').map { | name | "#{name} (user provided)"} unless custom_mapping_match.nil ?

    if (
      Array.isArray(_.get(result, 'nist')) &&
      _.get(result, 'nist').length === 0
    ) {
      result = _.set(result, 'nist', ['unmapped']);
    }
    return result;
  }
  private checkText(configRule: ConfigRule) {
    let params: any[] = []
    if (configRule.InputParameters !== undefined && configRule.InputParameters !== '{}') {
      params = configRule.InputParameters.replace(/{/gi, '').replace(/}/gi, '').split(',')
      //let newparam = params.map((key: any, value: any) => `${key}: ${value}`)
      // .join('<br/>');
    }
    const checkText = [];
    checkText.push(`ARN: ${configRule.ConfigRuleArn || 'N/A'}`);
    checkText.push(
      `Source Identifier: ${configRule.Source?.SourceIdentifier || 'N/A'}`
    );
    if (params.length !== 0) {
      checkText.push(`${params.join('<br/>')}`);
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
  private getAccountId(arn: string) {
    const matches = arn.match(/:(\d{12}):config-rule/);
    if (matches === null) {
      return 'no-account-id';
    } else {
      return matches[0];
    }
  }
  private async getControls(): Promise<ExecJSON.Control[]> {
    const controls = await (await this.issues).map((issue) => {
      const item: ExecJSON.Control = {
        id: issue.ConfigRuleId || '',
        title: `${this.getAccountId(issue.ConfigRuleArn || '')} - ${issue.ConfigRuleName
          }`,
        desc: issue.Description,
        impact: 0.5,
        tags: this.hdfTags(issue),
        descriptions: this.hdfDescriptions(issue),
        refs: [],
        source_location: {ref: issue.ConfigRuleArn, line: 1},
        code: '',
        results: _.get(issue, 'results')
      };
      //Something with checking custom mapping thing...consult with someone to ask
      return item;
    });
    return controls;
  }
  public async toHdf() {
    let hdf: ExecJSON.Execution = {
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
          name: 'AWS Config',
          version: '',
          title: 'AWS Config',
          maintainer: null,
          summary: 'AWS Config',
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
    fs.writeFileSync(
      'libs/hdf_converters/outputs/aws.json',
      JSON.stringify(hdf)
    )
    return hdf;
  }
}
