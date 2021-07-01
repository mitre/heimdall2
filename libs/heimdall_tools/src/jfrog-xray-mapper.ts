import { ExecJSON } from 'inspecjs/dist/generated_parsers/v_1_0/exec-json'
import { version as HeimdallToolsVersion } from '../package.json'
import _ from 'lodash'
import fs from 'fs'

function objectMap<T, V>(obj: T, fn: (v: ObjectEntries<T>) => V): { [K in keyof T]: V } {
  return Object.fromEntries(
    Object.entries(obj).map(
      ([k, v]) => [k, fn(v)]
    )
  ) as Record<keyof T, V>
}

type ObjectEntries<T> = { [K in keyof T]: readonly [K, T[K]] }[keyof T];
type MappedTransform<T, U> = {
  [K in keyof T]: T[K] extends Array<any> ? MappedTransform<T[K], U> : T[K] extends object ? MappedTransform<T[K] & U, U> : T[K] | U;
};
type MappedReform<T, U> = {
  [K in keyof T]: T[K] extends Array<any> ? MappedReform<T[K], U> : T[K] extends object ? MappedReform<T[K] & U, U> : Exclude<T[K], U>;
};
interface LookupPath {
  path?: string | string[];
  transformer?: Function;
}
function convert(file: object, fields: MappedTransform<ExecJSON, LookupPath>): ExecJSON {
  let v = convertInternal(file, fields)
  //set the sha-256 to the hash(_.omit(v.profiles, ['sha256']), map the controls
  return v
}
function convertInternal<T>(file: object, fields: T): MappedReform<T, LookupPath> {
  const result = objectMap(fields, (v: ObjectEntries<T>) => evaluate(file, v)) //TODO
  return result as MappedReform<T, LookupPath>
}
async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const encdata = encoder.encode(data);

  const byteArray = await crypto.subtle.digest('SHA-256', encdata)
  return Array.prototype.map.call(new Uint8Array(byteArray), x => (('00' + x.toString(16)).slice(-2))).join('');
}
function evaluate<T>(file: object, v: T | Array<T>): string | T | Array<T> | MappedReform<T, LookupPath> {
  if (Array.isArray(v)) {
    return handleArray(file, v)
  } else if (typeof v === 'string') {
    return v
  } else if (_.has(v, 'path')) {
    return handlePath(file, _.get(v, 'path'))
  } else {
    return convertInternal(file, v)
  }
}

function handleArray<T>(file: object, v: Array<T & LookupPath>): Array<T> {
  if (v.length === 0) {
    return new Array<T>()
  }
  if (v[0].path === undefined) {
    return [evaluate(file, v[0]) as T]
  } else {
    let path = v[0].path
    let length = _.get(file, path).length
    v[0] = _.omit(v[0], ['path']) as T
    for (let i = 1; i < length; i++) {
      v.push({ ...v[0] })
    }
    var counter = 0
    _.get(file, path).forEach((element: object) => {
      v[counter] = convertInternal(element, v[counter]) as T
      counter++
    })
    return v
  }
}

function handlePath(file: object, path: string | string[]): string {
  if (typeof path === 'string') {
    return _.get(file, path) || ''
  } else {
    var value: string = ''
    path.forEach(function (item) {
      if (typeof _.get(file, item) === undefined) {
        value += item + ' '
      } else {
        value += _.get(file, item) + ' '
      }
    })
    return value
  }
}

const mappings: MappedTransform<ExecJSON, LookupPath> = {
  platform: {
    name: 'Heimdall Tools',
    release: HeimdallToolsVersion
  },
  profiles: [{
    name: 'JFrog Xray Scan',
    title: 'JFrog Xray Scan',
    version: '',
    attributes: [],
    controls: [
      {
        path: 'data',
        id: { path: 'id' },
        title: { path: 'summary' },
        desc: { path: '' },
        impact: { path: 'severity' },
        code: '',
        results: [],
        tags: {
          nist: '',
          cweid: ''
        },
        descriptions: [],
        refs: [],
        source_location: {},
      }
    ],
    groups: [],
    summary: 'Continuous Security and Universal Artifact Analysis',
    supports: [],
    sha256: ''
  }],
  statistics: {},
  version: HeimdallToolsVersion
}

class JfrogXrayMapper {
  xrayJson: object

  constructor(xrayJson: string) {
    this.xrayJson = JSON.parse(xrayJson)
  }
  toHdf() {
    return convert(this.xrayJson, mappings)
  }
}
var mapper = new JfrogXrayMapper(fs.readFileSync('/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/jfrog_xray_mapper/sample_input_report/jfrog_xray_sample.json', { encoding: 'utf-8' }))
fs.writeFileSync('libs/heimdall_tools/src/myoutput.json', JSON.stringify(mapper.toHdf()))
