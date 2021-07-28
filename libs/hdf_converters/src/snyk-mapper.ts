
import {ExecJSON} from 'inspecjs'
import {version as HeimdallToolsVersion} from '../package.json'
import _ from 'lodash'
import {MappedTransform, LookupPath, BaseConverter, generateHash} from './base-converter'
import {CweNistMapping} from './mappings/CweNistMapping'
import path from 'path'

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3]
]);
const CWE_NIST_MAPPING_FILE = path.resolve(
  __dirname,
  '../data/cwe-nist-mapping.csv'
);
const CWE_NIST_MAPPING = new CweNistMapping(CWE_NIST_MAPPING_FILE);
const DEFAULT_NIST_TAG = ['SA-11', 'RA-5'];

function impactMapping(severity: unknown): number {
  if (typeof severity === 'string' || typeof severity === 'number') {
    return IMPACT_MAPPING.get(severity.toString().toLowerCase()) || 0;
  } else {
    return 0;
  }
}
function parseIdentifier(identifiers: unknown[] | unknown): string[] {
  const output: string[] = [];
  if (identifiers !== undefined && Array.isArray(identifiers)) {
    identifiers.forEach((element) => {
      const numbers = element.split('-');
      numbers.shift();
      output.push(numbers.join('-'));
    });
    return output;
  } else {
    return [];
  }
}
function nistTag(identifiers: unknown[]): string[] {
  return CWE_NIST_MAPPING.nistFilter(
    parseIdentifier(identifiers),
    DEFAULT_NIST_TAG
  );
}

export class SnykResults {
  data: Record<string, unknown>
  customMapping?: MappedTransform<ExecJSON.Execution, LookupPath>
  constructor(snykJson: string) {
    this.data = JSON.parse(snykJson);
  }

  toHdf() {
    let results: ExecJSON.Execution[] = []
    if (Array.isArray(this.data)) {
      this.data.forEach((element) => {
        const entry = new SnykMapper(element);
        if (this.customMapping !== undefined) {
          entry.setMappings(this.customMapping);
        }
        results.push(entry.toHdf());
      });
      return results;
    } else {
      const result = new SnykMapper(this.data);
      if (this.customMapping !== undefined) {
        result.setMappings(this.customMapping);
      }
      return result.toHdf();
    }
  }
  setMappings(customMapping: MappedTransform<ExecJSON.Execution, LookupPath>) {
    this.customMapping = customMapping
  }
}

export class SnykMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON.Execution, LookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: {path: 'projectName'}
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: {path: 'policy'},
        version: {
          path: 'policy',
          transformer: (policy: unknown) => {
            if (typeof policy === 'string') {
              return policy.split('version: ')[1].split('\n')[0];
            } else {
              return '';
            }
          }
        },
        title: {
          path: 'projectName',
          transformer: (projectName: unknown) => {
            return `Snyk Project: ${projectName}`;
          }
        },
        maintainer: null,
        summary: {
          path: 'summary',
          transformer: (summary: unknown) => {
            return `Snyk Summary: ${summary}`;
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
              nist: {path: 'identifiers.CWE', transformer: nistTag},
              cweid: {path: 'identifiers.CWE', transformer: parseIdentifier},
              cveid: {path: 'identifiers.CVE', transformer: parseIdentifier},
              ghsaid: {path: 'identifiers.GHSA', transformer: parseIdentifier}
            },
            descriptions: [],
            refs: [],
            source_location: {},
            title: {path: 'title'},
            id: {path: 'id'},
            desc: {path: 'description'},
            impact: {path: 'severity', transformer: impactMapping},
            code: '',
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {
                  path: 'from',
                  transformer: (input: unknown) => {
                    if (Array.isArray(input)) {
                      return `From : [ ${input.join(' , ')} ]`;
                    } else {
                      return '';
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
  constructor(snykJson: Record<string, unknown>) {
    super(snykJson);
  }
  setMappings(customMappings: MappedTransform<ExecJSON.Execution, LookupPath>) {
    super.setMappings(customMappings)
  }
}
