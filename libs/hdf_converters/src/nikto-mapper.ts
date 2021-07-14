import { ControlResultStatus, ExecJSON } from 'inspecjs/dist/generated_parsers/v_1_0/exec-json'
import { version as HeimdallToolsVersion } from '../package.json'
import _ from 'lodash'
import { MappedTransform, LookupPath, BaseConverter, generateHash } from './base-converter'
import { NiktoNistMapping } from './mappings/NiktoNistMapping'

const NIKTO_NIST_MAPPING_FILE = 'libs/heimdall_tools/data/nikto-nist-mapping.csv'
const NIKTO_NIST_MAPPING = new NiktoNistMapping(NIKTO_NIST_MAPPING_FILE)

function formatTitle(file: object) {
  return `Nikto Target: ${projectName(file)}`
}
function projectName(file: object) {
  return `Host: ${_.get(file, 'host')} Port: ${_.get(file, 'port')}`
}
function formatCodeDesc(vulnerability: object) {
  return `URL : ${_.get(vulnerability, 'url')} Method: ${_.get(vulnerability, 'method')}`
}
function nistTag(id: string) {
  return NIKTO_NIST_MAPPING.nistTag(id)
}

export class NiktoMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON, LookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: { transformer: projectName }
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: 'Nikto Website Scanner',
        version: '',
        title: { transformer: formatTitle },
        maintainer: null,
        summary: {
          path: 'banner',
          transformer: (input: string) => {
            return `Banner: ${input}`
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
            path: 'vulnerabilities',
            key: 'id',
            tags: {
              nist: { path: 'id', transformer: nistTag },
              ösvdb: { path: 'OSVDB' }
            },
            descriptions: [],
            refs: [],
            source_location: {},
            title: { path: 'msg' },
            id: { path: 'id' },
            desc: { path: 'msg' },
            impact: 0.5,
            code: '',
            results: [
              {
                status: ControlResultStatus.Failed,
                code_desc: { transformer: formatCodeDesc },
                run_time: 0,
                start_time: ''
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  constructor(xrayJson: string) {
    super(JSON.parse(xrayJson));
  }
  setMappings(customMappings: MappedTransform<ExecJSON, LookupPath>) {
    super.setMappings(customMappings)
  }
}
