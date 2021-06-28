import { ExecJSON } from 'inspecjs/dist/generated_parsers/v_1_0/exec-json'
import { version as HeimdallToolsVersion } from '../package.json'
import _ from 'lodash'
import parser from 'fast-xml-parser'

const objectMap = (obj: Object, fn: Function) =>
  Object.fromEntries(
    Object.entries(obj).map(
      ([k, v], i) => [k, fn(v, k, i)]
    )
  )
type MappedTransform<T, U> = {
  [K in keyof T]: T[K] extends object ? MappedTransform<T[K], U> : T[K] | U;
};
interface LookupPath {
  path: string;
}
function convert(fields: typeof mappings, file: Object) {
  const result = objectMap(fields, (v: { path: string }) => _.get(file, v.path))
  return result
}
async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const encdata = encoder.encode(data);

  const byteArray = await crypto.subtle.digest('SHA-256', encdata)
  return Array.prototype.map.call(new Uint8Array(byteArray), x => (('00' + x.toString(16)).slice(-2))).join('');
}

const mappings: MappedTransform<ExecJSON, LookupPath> = {
  platform: {
    name: 'Heimdall Tools',
    release: HeimdallToolsVersion,
  },
  profiles: [{
    name: 'BurpSuite Pro Scan',
    version: { path: 'issues.burpVersion' },
    title: 'BurpSuite Pro Scan',
    attributes: [],
    controls: [
      {
        // Needs to parse HTML for some of them
        id: { path: 'issues.issue[INDEX].type' },
        title: { path: 'issues.issue[INDEX].name' },
        desc: { path: 'issues.issue.[INDEX].issueBackground' },
        impact: { path: 'issues.issue[INDEX].remediationBackground' },
        tags: {
          nist: { path: 'issues.issue[INDEX].vulnerabilityClassifications' },
          cweid: { path: 'issues.issue[INDEX].vulnerabilityClassifications' },
          confidence: { path: 'issues.issue[INDEX].confidence' }
        },
        descriptions: [
          { data: { path: 'issues.issue.[INDEX].issueBackground' }, label: 'check' },
          { data: { path: 'issues.issue[INDEX].remediationBackground' }, label: 'fix' }
        ],
        refs: [],
        source_location: {},
        code: '',
        results: [
          {
            code_desc: '',
            start_time: ''
          }
        ]
      }
    ],
    groups: [],
    summary: 'BurpSuite Pro Scan',
    supports: [],
    sha256: ''
  }],
  statistics: {},
  version: HeimdallToolsVersion
}

class BurpSuiteMapper {
  burpsJson: any

  constructor(burpsXml: string) {
    this.burpsJson = parser.parse(burpsXml)
  }
}
