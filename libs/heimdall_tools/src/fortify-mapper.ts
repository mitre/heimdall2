import { ExecJSON } from 'inspecjs/dist/generated_parsers/v_1_0/exec-json'
import { version as HeimdallToolsVersion } from '../package.json'
import _ from 'lodash'

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
  path: string | string[];
}
function convert(fields: typeof mappings, file: Object) {
  const result = objectMap(fields, (v: { path: string | string[] }) => {
    if (typeof v.path === 'string') {
      return _.get(file, v.path)
    } else {
      var total: string = ''
      v.path.forEach(function (value) {
        if (typeof _.get(file, value) != "undefined") {
          total += _.get(file, value)
        }
      })
      return total
    }
  })
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
    name: 'Fortify Static Analyzer Scan',
    version: { path: 'FVDL.EngineData.EngineVersion' },
    attributes: [],
    controls: [
      {
        id: { path: 'FVDL.Description[INDEX].classID' },
        desc: { path: 'FVDL.Description[INDEX].Explanation' },
        title: { path: 'FVDL.Description[INDEX].Abstract' },
        impact: { path: 'FVDL.Description[INDEX].classID' },
        descriptions: [],
        refs: [],
        source_location: {},
        code: '',
        results: [],
        tags: {
          nist: ''
        }
      }
    ],
    groups: [],
    summary: { path: ['Fortify Static Analyzer Scan of UUID:', 'FVDL.UUID'] }, //TODO
    supports: [],
    sha256: ''
  }],
  statistics: {},
  version: HeimdallToolsVersion
}

class FortifyMapper {
  fvdl: Object

  constructor(fvdl: Object) {
    this.fvdl = fvdl
  }
}
