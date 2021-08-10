import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform,
  parseHtml
} from './base-converter';
import {encode} from 'html-entities'

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['informational', 0.3]
]);
const PRODUCT_ARN_MAPPING: Map<RegExp, Map<string, Function>> = new Map([ //Hash name to a lambda function instead
  [/arn:.+:securityhub:.+:.*:product\/aws\/firewall-manager/, 'FirewallManager'],
  [/arn:.+:securityhub:.+:.*:product\/aws\/securityhub/, 'SecurityHub'],
  [/arn:.+:securityhub:.+:.*:product\/prowler\/prowler/, 'Prowler']
]);
const DEFAULT_NIST_TAG = ['SA-11', 'RA-5']

export class ASFFMapper extends BaseConverter {
  securityhubStandardsJsonArray: string[] | null;
  meta: Record<string, unknown> | null;
  supportingDocs: Map<RegExp, Record<string, Record<string, unknown>>>; // Initial key could get more explicit with types
  mappings: MappedTransform<ExecJSON.Execution, ILookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: ''
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: {
          transformer: () => {
            return _.get(this.meta, 'name') as string || 'AWS Security Finding Format';
          }
        },
        version: '',
        title: {
          transformer: () => {
            return _.get(this.meta, 'title') as string || 'ASFF Findings';
          }
        },
        maintainer: null,
        summary: '',
        license: null,
        copyright: null,
        copyright_email: null,
        supports: [],
        attributes: [],
        depends: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'Findings',
            key: 'id',
            //arrayTransformer: ,
            id: {
              transformer: (input: unknown): string => {
                let productArn = _.get(input, 'ProductArn')
                if (productArn) {

                }
                if (typeof input === 'string') {
                  return input.split('/')[-1]
                } else {
                  return ''
                }
              }
            },
            title: {path: 'name'},
            desc: {path: 'Description'},
            impact: {
              transformer: (finding: unknown) => {
                // There can be findings listed that are intentionally ignored due to the underlying control being superceded by a control from a different standard
                let impact: string | number;
                if (_.get(finding, 'Workflow.Status') === 'SUPPRESSED') {
                  impact = 'informational'
                } else {
                  // Severity is required, but can be either 'label' or 'normalized' internally with 'label' being preferred.  other values can be in here too such as the original severity rating.
                  const defaultFunc = () => _.get(finding, 'Severity.Label') ? _.get(finding, 'Severity.Label') : _.get(finding, 'Severity.Normalized') / 100.0;
                  impact = this.externalProductHandler(_.get(finding, 'ProductArn'), finding, 'findingImpact', defaultFunc)
                }
                return typeof impact === 'string' ? IMPACT_MAPPING.get(impact) || 0 : impact
              }
            },
            tags: {
              nist: {
                transformer: (finding: unknown) => {
                  let tags = this.externalProductHandler(_.get(finding, 'ProductArn') as string, finding, 'findingNistTag', {}) as string[];
                  if (tags.length === 0) {
                    return DEFAULT_NIST_TAG
                  } else {
                    return tags
                  }
                },
              }
            },
            descriptions: [
              {
                data: {
                  path: 'Remediation.Recommendation', transformer: (input: unknown) => {
                    let data: string[] = []
                    data.push(_.get(input, 'Text'))
                    data.push(_.get(input, 'Url'))
                    return data.join('\n')
                  }
                },
                label: 'fix'
              }
            ],
            refs: [],
            source_location: {},
            code: '', //TODO
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {},
                run_time: 0,
                start_time: {path: '$.issues.exportTime'}
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  externalProductHandler(product: string | RegExp, data: unknown, func: string, defaultVal: unknown) {
    let arn = null
    if ((product instanceof RegExp || (arn = Array.from(PRODUCT_ARN_MAPPING.keys()).find(regex => regex.test(product)))) && PRODUCT_ARN_MAPPING.get(arn || product as RegExp)?.has(func)) {
      let keywords: Record<string, unknown> = {encode: encode}
      if (this.supportingDocs.has(arn || product as RegExp)) {
        keywords = {...keywords, ...this.supportingDocs.get(arn || product as RegExp)}
      }
      return PRODUCT_ARN_MAPPING.get(arn || product as RegExp)?.get(func)?.apply(this, [data, keywords])
    } else {
      if (typeof defaultVal === 'function') {
        return defaultVal()
      } else {
        return defaultVal
      }
    }
  }
  constructor(
    asffJson: string,
    securityhubStandardsJsonArray: null | string[] = null,
    meta: null | Record<string, unknown> = null
  ) {
    super(JSON.parse(asffJson));
    this.securityhubStandardsJsonArray = securityhubStandardsJsonArray;
    this.meta = meta;
    this.supportingDocs = {}
  }
  setMappings(
    customMappings: MappedTransform<ExecJSON.Execution, ILookupPath>
  ): void {
    super.setMappings(customMappings);
  }
}
