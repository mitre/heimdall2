import parser from 'fast-xml-parser'
import {
  ControlDescription,
  ControlResult,
  ControlResultStatus,
  ExecJSON
} from 'inspecjs/dist/generated_parsers/v_1_0/exec-json'
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, LookupPath, MappedTransform} from './base-converter'

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['informational', 0]
]);

function parseXml(xml: string) {
  const options = {
    attributeNamePrefix: '',
    textNodeName: 'text',
    ignoreAttributes: false
  };
  return parser.parse(xml, options)
}
function compileFindings(input: object) {
  let keys = _.get(input, 'dataset.metadata.item').map((element: object) => {
    return _.get(element, 'name')
  })
  let findings = _.get(input, 'dataset.data.row').map((element: object) => {
    return Object.fromEntries(keys.map(function (key: string, i: number) {
      return [key, _.get(element, `value[${i}]`)]
    }))
  })
  return Object.fromEntries([['data', findings]])
}
function formatSummary(entry: unknown) {
  let text = []
  text.push(`Organization : ${_.get(entry, 'Organization')}`)
  text.push(`Asset : ${_.get(entry, 'Check Asset')}`)
  text.push(`Asset Type : ${_.get(entry, 'Asset Type')}`)
  text.push(`IP Address, Port, Instance : ${_.get(entry, 'Asset Type')}`)
  text.push(`IP Address, Port, Instance : ${_.get(entry, 'IP Address, Port, Instance')} `)
  return text.join('\n')
}
function formatDesc(entry: unknown) {
  let text = []
  text.push(`Task : ${_.get(entry, 'Task')}`)
  text.push(`Check Category : ${_.get(entry, 'Check Category')}`)
  return text.join('; ')
}
function impactMapping(severity: unknown): number {
  if (typeof severity === 'string' || typeof severity === 'number') {
    return IMPACT_MAPPING.get(severity.toString().toLowerCase()) || 0;
  } else {
    return 0
  }
}
function getStatus(input: unknown): ControlResultStatus {
  switch (input) {
    case 'Fact':
      return ControlResultStatus.Skipped
    case 'Failed':
      return ControlResultStatus.Failed
    case 'Finding':
      return ControlResultStatus.Failed
    case 'Not A Finding':
      return ControlResultStatus.Passed
  }
  return ControlResultStatus.Skipped
}
function getBacktrace(input: unknown): string {
  if (input === 'Failed') {
    return 'DB Protect Failed Check'
  } else {
    return ''
  }
}
function handleBacktrace(input: unknown, _file: unknown): ControlResult[] {
  if (Array.isArray(input)) {
    input = input.map((element) => {
      if (_.get(element, 'backtrace')[0] === '') {
        return _.omit(element, 'backtrace')
      } else {
        return element
      }
    })
  }
  return input as ControlResult[]
}
function idToString(id: unknown): string {
  if (typeof id === 'string' || typeof id === 'number') {
    return id.toString();
  } else {
    return '';
  }
}

export class DBProtectMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON, LookupPath> = {
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
        name: {path: 'data.[0].Policy'},
        version: '',
        title: {path: 'data.[0].Job Name'},
        maintainer: null,
        summary: {path: 'data.[0]', transformer: formatSummary},
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
            path: 'data',
            key: 'id',
            id: {path: 'Check ID', transformer: idToString},
            title: {path: 'Check'},
            desc: {transformer: formatDesc},
            impact: {path: 'Risk DV', transformer: impactMapping},
            tags: {},
            descriptions: [],
            refs: [],
            source_location: {},
            code: '',
            results: [
              {
                arrayTransformer: handleBacktrace,
                status: {path: 'Result Status', transformer: getStatus},
                code_desc: {path: 'Details'},
                run_time: 0,
                start_time: {path: 'Date'},
                backtrace: [{path: 'Result Status', transformer: getBacktrace}]
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  constructor(dbProtectXml: string) {
    super(compileFindings(parseXml(dbProtectXml)))
  }
  setMappings(customMappings: MappedTransform<ExecJSON, LookupPath>) {
    super.setMappings(customMappings)
  }
}
