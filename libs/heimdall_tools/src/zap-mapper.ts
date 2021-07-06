import {ExecJSON} from 'inspecjs/dist/generated_parsers/v_1_0/exec-json';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';

const objectMap = (obj: Object, fn: Function) =>
  Object.fromEntries(Object.entries(obj).map(([k, v], i) => [k, fn(v, k, i)]));
type MappedTransform<T, U> = {
  [K in keyof T]: T[K] extends object ? MappedTransform<T[K], U> : T[K] | U;
};
interface LookupPath {
  path: string;
}
function convert(fields: typeof mappings, file: Object) {
  const result = objectMap(fields, (v: {path: string}) => _.get(file, v.path));
  return result;
}
async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const encdata = encoder.encode(data);

  const byteArray = await crypto.subtle.digest('SHA-256', encdata);
  return Array.prototype.map
    .call(new Uint8Array(byteArray), (x) => ('00' + x.toString(16)).slice(-2))
    .join('');
}

const mappings: MappedTransform<ExecJSON, LookupPath> = {
  platform: {
    name: 'Heimdall Tools',
    release: HeimdallToolsVersion
  },
  profiles: [
    {
      name: 'OWASP ZAP Scan',
      version: '', //TODO
      title: 'OWASP ZAP Scan of Host: #{@host}', //TODO
      attributes: [], //TODO
      controls: [
        {
          id: '',
          impact: 0,
          refs: [],
          results: [
            {
              code_desc: '',
              start_time: ''
            }
          ],
          source_location: {
            line: null,
            ref: ''
          },
          tags: {}
        }
      ],
      groups: [],
      summary: 'OWASP ZAP Scan of Host: #{@host}',
      supports: [],
      sha256: ''
    }
  ],
  statistics: {
    duration: 0.0
  },
  version: {path: '.version'} // There's two different 'version's, one in profile and one outside, so which?
};

class ScoutsuiteMapper {
  zapJson: JSON;

  constructor(zapJson: string) {
    this.zapJson = JSON.parse(zapJson);
  }
}
