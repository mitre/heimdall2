import parser from 'fast-xml-parser';
import * as htmlparser from 'htmlparser2';
import { ControlResult, ExecJSONControl } from 'inspecjs/dist/generated_parsers/v_1_0/exec-json';
import {
  ControlDescription,
  ControlResultStatus,
  ExecJSON
} from 'inspecjs/dist/generated_parsers/v_1_0/exec-json';
import _ from 'lodash';
import { version as HeimdallToolsVersion } from '../package.json';
import { BaseConverter, LookupPath, MappedTransform } from './base-converter'

const NIST_REFERENCE_NAME = 'Standards Mapping - NIST Special Publication 800-53 Revision 4'
const DEFAULT_NIST_TAG = ['unmapped', 'Rev_4']

function parseXml(xml: string) {
  const options = {
    attributeNamePrefix: '',
    textNodeName: 'text',
    ignoreAttributes: false
  };
  return parser.parse(xml, options)
}
function impactMapping(input: object, id: string) {
  if (Array.isArray(input)) {
    let matches = input.find((element) => { return _.get(element, 'ClassInfo.ClassID') === id })
    return parseFloat(_.get(matches, 'ClassInfo.DefaultSeverity')) / 5
  } else {
    return parseFloat(_.get(input, 'ClassInfo.DefaultSeverity')) / 5
  }
}
function replaceBrackets(input: unknown) {
  return input.replace(/&lt;/gi, '<').replace(/&gt;/gi, '>',)
}
function nistTag(rule: object) {
  let references = _.get(rule, 'References.Reference')
  if (!Array.isArray(references)) {
    references = [references]
  }
  let tag = references.find((element: object) => { return _.get(element, 'Author') === NIST_REFERENCE_NAME })
  if (tag === null || tag === undefined) {
    return DEFAULT_NIST_TAG
  } else {
    return _.get(tag, 'Title').match(/[a-zA-Z][a-zA-Z]-\d{1,2}/).concat(['Rev_4'])
  }
}

function processEntry(input: object) {
  let output = []
  output.push(`${_.get(input, 'id')}<=SNIPPET`)
  output.push(`\nPath: ${_.get(input, 'File')}\n`)
  output.push(`StartLine: ${_.get(input, 'StartLine')}, `)
  output.push(`EndLine: ${_.get(input, 'EndLine')}\n`)
  output.push(`Code:\n${_.get(input, 'Text').trim()}`)

  return output.join("")
}
function filterVuln(input: unknown[], file: object): ExecJSONControl[] {
  input.forEach(element => {
    _.set(element, 'results', _.get(element, 'results').filter((result: ControlResult) => {
      const code_desc = _.get(result, 'code_desc').split('<=SNIPPET')
      const snippetid = code_desc[0]
      const classid = _.get(element, 'id')
      _.set(result, 'code_desc', code_desc[1])

      let isMatch = false
      let matches = _.get(file, 'FVDL.Vulnerabilities.Vulnerability').filter((element: object) => { return _.get(element, 'ClassInfo.ClassID') === classid })
      matches.forEach((match: object) => {
        let traces = _.get(match, 'AnalysisInfo.Unified.Trace')
        if (!Array.isArray(traces)) {
          traces = [traces]
        }
        traces.forEach((trace: object) => {
          let entries = _.get(trace, 'Primary.Entry')
          if (!Array.isArray(entries)) {
            entries = [entries]
          }
          entries = entries.filter((entry: object) => {
            return _.has(entry, 'Node.SourceLocation.snippet')
          })
          entries.forEach((entry: object) => {
            if (_.get(entry, 'Node.SourceLocation.snippet') === snippetid) {
              isMatch = true
            }
          })
        })
      })
      return isMatch
    }))
    _.set(element, 'impact', impactMapping(_.get(element, 'impact'), _.get(element, 'id')))
  })
  return input
}

export class FortifyMapper extends BaseConverter {
  startTime: string
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
        name: 'Fortify Static Analyzer Scan',
        version: { path: 'FVDL.EngineData.EngineVersion' },
        title: 'Fortify Static Analyzer Scan',
        maintainer: null,
        summary: {
          path: 'FVDL.UUID', transformer: (uuid: string) => {
            return `Fortify Static Analyzer Scan of UUID: ${uuid}`
          }
        },
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
            arrayTransformer: filterVuln,
            path: 'FVDL.Description',
            key: 'id',
            id: { path: 'classID' },
            title: { path: 'Abstract', transformer: replaceBrackets },
            desc: { path: 'Explanation', transformer: replaceBrackets },
            impact: { path: '$.FVDL.Vulnerabilities.Vulnerability' },
            tags: {
              nist: { transformer: nistTag },
            },
            descriptions: [],
            refs: [],
            source_location: {},
            code: '',
            results: [
              {
                path: '$.FVDL.Snippets.Snippet',
                status: ControlResultStatus.Failed,
                code_desc: { transformer: processEntry },
                run_time: 0,
                start_time: {
                  path: '$.FVDL.CreatedTS', transformer: (input: object) => {
                    return _.get(input, 'date') + ' ' + _.get(input, 'time')
                  }
                },
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  constructor(fvdl: string) {
    super(parseXml(fvdl))
    this.startTime = _.get(this.data, 'FVDL.CreatedTS.date') + ' ' + _.get(this.data, 'FVDL.CreatedTS.time')
  }
  setMappings(customMappings: MappedTransform<ExecJSON, LookupPath>) {
    super.setMappings(customMappings)
  }
}
