import parser from 'fast-xml-parser'
import {
  ExecJSON
} from 'inspecjs'
import _ from 'lodash';
import { version as HDFConvertersVersion } from '../package.json';
import { BaseConverter, LookupPath, MappedTransform } from './base-converter'

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
function formatDesc(entry: object) {
  let text = []
  text.push(`Task : ${_.get(entry, 'Task')}`)
  text.push(`Check Category : ${_.get(entry, 'Check Category')}`)
  return text.join('; ')
}
function impactMapping(severity: string | number): number {
  return IMPACT_MAPPING.get(severity.toString().toLowerCase()) || 0;
}
function getStatus(input: string): string {
  switch (input) {
    case 'Fact':
      return 'skipped'
    case 'Failed':
      return 'backtrace-failed'
    case 'Finding':
      return 'failed'
    case 'Not A Finding':
      return 'passed'
  }
  return 'skipped'
}
function handleBacktrace<T extends object>(input: T[], _file: object) {
  input.forEach(element => {
    if (_.get(element, 'status').startsWith('backtrace-')) {
      _.set(element, 'status', _.get(element, 'status').split('backtrace-')[1])
      _.set(element, 'backtrace', ['DB Protect Failed Check'])
    }
  })
  return input
}

export class DBProtectMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON.Execution, LookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HDFConvertersVersion,
      target_id: ''
    },
    version: HDFConvertersVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: { path: 'data.[0].Policy' },
        version: '',
        title: { path: 'data.[0].Job Name' },
        maintainer: null,
        summary: { path: 'data.[0]', transformer: formatSummary },
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
            id: { path: 'Check ID', transformer: (input: number) => { return input.toString() } },
            title: { path: 'Check' },
            desc: { transformer: formatDesc },
            impact: { path: 'Risk DV', transformer: impactMapping },
            tags: {},
            descriptions: [],
            refs: [],
            source_location: {},
            code: '',
            results: [
              {
                arrayTransformer: handleBacktrace,
                status: { path: 'Result Status', transformer: getStatus },
                code_desc: { path: 'Details' },
                run_time: 0,
                start_time: { path: 'Date' },
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
  setMappings(customMappings: MappedTransform<ExecJSON.Execution, LookupPath>) {
    super.setMappings(customMappings)
  }
}
