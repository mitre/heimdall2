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
    target_id: { path: 'projectName' },
    release: HeimdallToolsVersion,
  },
  profiles: [{
    name: { path: 'policy' },
    version: 'version',
    title: `Snyk Project: ${{ path: 'projectName' }}`,
    attributes: [],
    controls: [
      {
        tags: {
          // Waiting for processing functions
        },
        descriptions: [],
        refs: [],
        source_location: {},
        title: { path: '[INDEX].vulnerabilities[INDEX].title' },
        id: { path: '[INDEX].vulnerabilities[INDEX].id' },
        desc: { path: '[INDEX].vulnerabilities[INDEX].description' },
        impact: { path: '[INDEX].vulnerabilities[INDEX].severity' },
        code: '',
        results: []
      }
    ],
    groups: [],
    summary: `Snyk Summary: ${{ path: 'summary' }}`,
    supports: [],
    sha256: ''
  }],
  statistics: {},
  version: HeimdallToolsVersion
}

class SnykMapper {
  snykJson: JSON;

  constructor(snykJson: string) {
    this.snykJson = JSON.parse(snykJson.split('\n', 1)[1]);
  }
}
