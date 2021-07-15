import { ControlResultStatus, ExecJSON } from 'inspecjs/dist/generated_parsers/v_1_0/exec-json'
import { version as HeimdallToolsVersion } from '../package.json'
import _ from 'lodash'
import { MappedTransform, LookupPath, BaseConverter, generateHash } from './base-converter'
import { CweNistMapping } from './mappings/CweNistMapping';

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3]
]);
const CWE_NIST_MAPPING_FILE = 'libs/heimdall_tools/data/cwe-nist-mapping.csv'
const CWE_NIST_MAPPING = new CweNistMapping(CWE_NIST_MAPPING_FILE)
const DEFAULT_NIST_TAG = ['SA-11', 'RA-5']


function impactMapping(severity: string) {
  return IMPACT_MAPPING.get(severity.toString().toLowerCase()) || 0;
}
function parseIdentifier(identifiers: string[] | string) {
  let output: string[] = []
  if (identifiers !== undefined && typeof identifiers !== 'string') {
    identifiers.forEach(element => {
      let numbers = element.split('-')
      numbers.shift()
      output.push(numbers.join('-'))
    })
    return output
  } else {
    return []
  }
}
function nistTag(identifiers: string[]) {
  return CWE_NIST_MAPPING.nistFilter(parseIdentifier(identifiers), DEFAULT_NIST_TAG)
}

export class SnykResults {
  data: object
  customMapping?: MappedTransform<ExecJSON, LookupPath>
  constructor(snykJson: string) {
    this.data = JSON.parse(snykJson)
  }

  toHdf() {
    let results: ExecJSON[] = []
    if (Array.isArray(this.data)) {
      this.data.forEach(element => {
        let entry = new SnykMapper(element)
        if (this.customMapping !== undefined) {
          entry.setMappings(this.customMapping)
        }
        results.push(entry.toHdf())
      })
      return results
    } else {
      let result = new SnykMapper(this.data)
      if (this.customMapping !== undefined) {
        result.setMappings(this.customMapping)
      }
      return result.toHdf()
    }
  }
  setMappings(customMapping: MappedTransform<ExecJSON, LookupPath>) {
    this.customMapping = customMapping
  }
}

export class SnykMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON, LookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: { path: 'projectName' }
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: { path: 'policy' },
        version: {
          path: 'policy', transformer: (policy: string) => {
            return policy.split('version: ')[1].split('\n')[0]
          }
        },
        title: {
          path: 'projectName', transformer: (projectName: string) => {
            return `Snyk Project: ${projectName}`
          }
        },
        maintainer: null,
        summary: {
          path: 'summary', transformer: (summary: string) => {
            return `Snyk Summary: ${summary}`
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
              nist: { path: 'identifiers.CWE', transformer: nistTag },
              cweid: { path: 'identifiers.CWE', transformer: parseIdentifier },
              cveid: { path: 'identifiers.CVE', transformer: parseIdentifier },
              ghsaid: { path: 'identifiers.GHSA', transformer: parseIdentifier }
            },
            descriptions: [],
            refs: [],
            source_location: {},
            title: { path: 'title' },
            id: { path: 'id' },
            desc: { path: 'description' },
            impact: { path: 'severity', transformer: impactMapping },
            code: '',
            results: [
              {
                status: ControlResultStatus.Failed,
                code_desc: {
                  path: 'from', transformer: (input: object) => {
                    if (Array.isArray(input)) {
                      return `From : [ ${input.join(' , ')} ]`
                    } else {
                      return input
                    }
                  }
                },
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
  constructor(snykJson: object) {
    super(snykJson);
  }
  setMappings(customMappings: MappedTransform<ExecJSON, LookupPath>) {
    super.setMappings(customMappings)
  }
}

