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
function createAttribute(
  name: string,
  value: {path: string},
  required = false,
  sensitive = false,
  type = null
) {
  return {
    name: name,
    options: {
      value: value,
      required: required,
      sensitive: sensitive,
      type: type
    }
  };
}

const mappings: MappedTransform<ExecJSON, LookupPath> = {
  platform: {
    name: 'Heimdall Tools',
    target_id: `${{path: 'last_run.ruleset_name'}} ruleset: ${{
      path: 'provider_name'
    }}:${{path: 'account_id'}}`,
    release: HeimdallToolsVersion
  },
  profiles: [
    {
      name: 'Scout Suite Multi-Cloud Security Auditing Tool',
      version: {path: 'last_run.version'},
      title: `Scout Suite Report using ${{
        path: 'last_run.version'
      }} ruleset on ${{path: 'provider_name'}} with account ${{
        path: 'account_id'
      }}`,
      attributes: [
        {account_id: {path: 'account_id'}},
        createAttribute('environment', {path: 'environment'}),
        createAttribute('ruleset', {path: 'ruleset_name'}),
        createAttribute('run_parameters_excluded_regions', {
          path: 'last_run.run_parameters.excluded_region'
        }),
        createAttribute('run_parameters_regions', {
          path: 'last_run.run_parameters.regions'
        }),
        createAttribute('run_parameters_services', {
          path: 'last_run.run_parameters.services'
        }),
        createAttribute('run_parameters_skipped_services', {
          path: 'last_run.run_parameters.skipped_services'
        }),
        createAttribute('time', {path: 'last_run.time'}),
        createAttribute('partition', {path: 'partition'}),
        createAttribute('provider_code', {path: 'provider_code'}),
        createAttribute('provider_name', {path: 'provider_name'})
      ],
      controls: [
        //leaving for later when we write functions to process arrays of JSON data
      ],
      groups: [],
      summary: {path: 'last_run.ruleset_about'},
      supports: [],
      sha256: ''
    }
  ],
  statistics: {},
  version: {path: '.version'} // There's two different 'version's, one in profile and one outside, so which?
};

class ScoutsuiteMapper {
  scoutsuiteJson: JSON;

  constructor(scoutsuiteJson: string) {
    this.scoutsuiteJson = JSON.parse(scoutsuiteJson.split('\n', 1)[1]); // Scoutsuite provides js files, and the first line isn't valid json
  }
}
