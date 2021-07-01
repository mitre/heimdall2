import { ExecJSON } from 'inspecjs/dist/generated_parsers/v_1_0/exec-json'
import { version as HeimdallToolsVersion } from '../package.json'
import _ from 'lodash'
import parser from 'fast-xml-parser'
import fs from 'fs'
import { CweNistMapping } from './mappings/CweNistMapping'

const objectMap = (obj: Object, fn: Function) =>
  Object.fromEntries(
    Object.entries(obj).map(
      ([k, v], i) => [k, fn(v, k, i)]
    )
  )
type MappedTransform<T, U> = {
  [K in keyof T]: T[K] extends Array<any> ? MappedTransform<T[K], U> : T[K] extends object ? MappedTransform<T[K] & U, U> : T[K] | U;
};
interface LookupPath {
  path?: string;
  transformer?: Function;
}
function convert(fields: Object, file: Object) {
  let v = convertInternal(fields, file)
  //set the sha-256 to the hash(_.omit(v.profiles, ['sha256']), map the controls
  return v
}
function convertInternal(fields: Object, file: Object) {
  const result = objectMap(fields, (v: Object) => evaluate(file, v))
  return result
}
function evaluate(file: Object, v: any, root?: string) {
  if (root != undefined) {
    if (v.path != undefined) {
      return handlePath(_.get(file, root), v)
    } else if (typeof v === 'string') {
      return v
    } else if (Array.isArray(v)) {
      return handleArray(file, v, root)
    } else {
      return 'test'
    }
  } else {
    if (v.path != undefined) {
      return handlePath(file, v)
    } else if (typeof v === 'string') {
      return v
    } else if (Array.isArray(v)) {
      return handleArray(file, v)
    } else {
      return 'test'
    }
  }
}

function handleArray(file: Object, v: Array<any> & LookupPath, root?: string) {
  if (root === undefined) {
    let path = v[0].path
    _.omit(v, ['path']).forEach(element => {
      evaluate(file, element, path)
    });
  } else {
    _.omit(v, ['path']).forEach(element => {
      evaluate(file, element, root + v.path)
    });
  }
}

function handlePath(file: Object, v: { path: string | string[] }, root = '') {

  if (typeof v.path === 'string') {
    console.log(_.get(file, v.path))
    return _.get(file, v.path)
  } else {
    var value: string = ''
    v.path.forEach(function (item) {
      if (typeof _.get(file, root + item) != 'undefined') {
        value += _.get(file, root + item) + ' '
      } else {
        value += item + ' '
      }
    })
    return value
  }
}

// async function generateHash(data: string): Promise<string> {
//   const encoder = new TextEncoder();
//   const encdata = encoder.encode(data);

//   const byteArray = await crypto.subtle.digest('SHA-256', encdata)
//   return Array.prototype.map.call(new Uint8Array(byteArray), x: any => (('00' + x.toString(16)).slice(-2))).join('');
// }
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
        path: 'issues.issue',
        // Needs to parse HTML for some of them
        id: { path: '.type' },
        title: { path: '.name' },
        desc: { path: '.issueBackground' },
        impact: { path: '.remediationBackground' },
        tags: {
          //nist: { path: '.vulnerabilityClassifications', transformer: nistConvert },
          cweid: { path: '.vulnerabilityClassifications' },
          confidence: { path: '.confidence' }
        },
        descriptions: [
          //{ data: { path: 'issues.issue.[INDEX].issueBackground' }, label: 'check' },
          //{ data: { path: 'issues.issue[INDEX].remediationBackground' }, label: 'fix' }
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
    this.burpsJson = JSON.parse(parser.parse(burpsXml))
    console.log(this.burpsJson)
    console.log('done')
  }

  toHdf() {
    convert(mappings.platform, this.burpsJson)
  }
}

// function nistConvert() {
//   let mapper: CweNistMapping = new CweNistMapping('../../data/cwe-nist-mapping.csv')
//   // TODO: Implement the lookup in the mapping class
//   return mapper.data
// }

var mapper = new BurpSuiteMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/burpsuite_mapper/sample_input_report/zero.webappsecurity.com.min', { encoding: 'utf-8' }))
mapper.toHdf()
console.log('hi')
