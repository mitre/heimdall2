import { ControlResultStatus, ExecJSON } from 'inspecjs/dist/generated_parsers/v_1_0/exec-json'
import { version as HeimdallToolsVersion } from '../package.json'
import _ from 'lodash'
import { MappedTransform, LookupPath, BaseConverter, generateHash } from './base-converter'
import { CweNistMapping } from './mappings/CweNistMapping';
import * as htmlparser from 'htmlparser2';

const CWE_NIST_MAPPING_FILE = 'libs/heimdall_tools/data/cwe-nist-mapping.csv'
const CWE_NIST_MAPPING = new CweNistMapping(CWE_NIST_MAPPING_FILE)
const DEFAULT_NIST_TAG = ['SA-11', 'RA-5']

function filterSite<T>(input: Array<T>, name: string) {
  let match = input.find(element => _.get(element, '@name') === name)
  return match
}
function impactMapping(input: string): number {
  let impact = parseInt(input)
  if (0 <= impact && impact <= 1) {
    return 0.3
  } else if (impact === 2) {
    return 0.5
  } else if (impact >= 3) {
    return 0.7
  } else {
    return 0
  }
}
function parseHtml(input: string) {
  const textData = new Array<string>();
  const myParser = new htmlparser.Parser({
    ontext(text: string) {
      textData.push(text);
    }
  });
  myParser.write(input);
  return textData.join(' ');
}
function nistTag(cweid: string) {
  let result = CWE_NIST_MAPPING.nistFilter([cweid], DEFAULT_NIST_TAG)
  return result.concat(['Rev_4'])
}
function checkText(input: object) {
  let text = []
  text.push(_.get(input, 'solution'))
  text.push(_.get(input, 'otherinfo'))
  text.push(_.get(input, 'otherinfo'))
  return text.join('\n')
}
function formatCodeDesc(input: object) {
  let text: string[] = []
  Object.keys(input).forEach(key => {
    text.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${_.get(input, key)}`)
  })
  return text.join('\n') + '\n'
}
export class ZapMapper extends BaseConverter {
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
        name: 'OWASP ZAP Scan',
        version: { path: '@version' },
        title: {
          path: 'site.@host', transformer: (input: string) => {
            return `OWASP ZAP Scan of Host: ${input}`
          }
        },
        maintainer: null,
        summary: {
          path: 'site.@host', transformer: (input: string) => {
            return `OWASP ZAP Scan of Host: ${input}`
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
            path: 'site.alerts',
            key: 'id',
            id: { path: 'pluginid' },
            title: { path: 'name' },
            desc: { path: 'desc', transformer: parseHtml },
            impact: { path: 'riskcode', transformer: impactMapping },
            tags: {
              nist: { path: 'cweid', transformer: nistTag },
              cweid: { path: 'cweid', },
              wascid: { path: 'wascid', },
              sourceid: { path: 'sourceid', },
              confidence: { path: 'confidence', },
              riskdesc: { path: 'riskdesc', },
              check: { transformer: checkText }
            },
            descriptions: [],
            refs: [],
            source_location: {},
            code: '',
            results: [
              {
                path: 'instances',
                status: ControlResultStatus.Failed,
                code_desc: { transformer: formatCodeDesc },
                run_time: 0,
                start_time: { path: '$.@generated' }
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  constructor(zapJson: string, name: string) {
    super(_.set(JSON.parse(zapJson), 'site', filterSite(_.get(JSON.parse(zapJson), 'site'), name)), true);
  }
  setMappings(customMappings: MappedTransform<ExecJSON, LookupPath>) {
    super.setMappings(customMappings)
  }
  toHdf() {
    let original = super.toHdf()
    _.get(original, 'profiles').forEach(profile => {
      _.get(profile, 'controls').forEach(control => {
        _.set(control, 'results', _.get(control, 'results').filter(function (element: object, index: number, self: object[]) {
          return index === self.indexOf(element);
        }))
      })
    })
    return original
  }
}
