import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags
} from './utils/global';

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3]
]);
const CWE_NIST_MAPPING = new CweNistMapping();

const CWE_PATH = 'identifiers.CWE';

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
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
  );
}

export class SnykResults {
  data: Record<string, unknown>;
  customMapping?: MappedTransform<ExecJSON.Execution, ILookupPath>;
  constructor(snykJson: string) {
    this.data = JSON.parse(snykJson);
  }

  toHdf(): ExecJSON.Execution[] | ExecJSON.Execution {
    const results: ExecJSON.Execution[] = [];
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
}

export class SnykMapper extends BaseConverter {
  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
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
        name: 'Snyk Scan',
        title: {
          transformer: (data: Record<string, unknown>): string => {
            const projectName = _.has(data, 'projectName')
              ? `Snyk Project: ${_.get(data, 'projectName')} `
              : '';
            return `${projectName}Snyk Path: ${_.get(data, 'path')}`;
          }
        },
        maintainer: null,
        summary: {
          path: 'summary',
          transformer: (summary: string): string => {
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
              cci: {
                path: CWE_PATH,
                transformer: (cwe: unknown[]) =>
                  getCCIsForNISTTags(nistTag(cwe))
              },
              nist: {path: CWE_PATH, transformer: nistTag},
              cweid: {path: CWE_PATH, transformer: parseIdentifier},
              cveid: {path: 'identifiers.CVE', transformer: parseIdentifier},
              ghsaid: {path: 'identifiers.GHSA', transformer: parseIdentifier}
            },
            descriptions: [],
            refs: [],
            source_location: {},
            title: {path: 'title'},
            id: {path: 'id'},
            desc: {path: 'description'},
            impact: {
              path: 'severity',
              transformer: impactMapping(IMPACT_MAPPING)
            },
            code: {
              transformer: (vulnerability: Record<string, unknown>): string => {
                return JSON.stringify(vulnerability, null, 2);
              }
            },
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {
                  path: 'from',
                  transformer: (input: unknown): string => {
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
    ],
    passthrough: {
      snyk_metadata: {
        transformer: (
          data: Record<string, unknown>
        ): Record<string, unknown> => {
          return _.omit(data, ['vulnerabilities']);
        }
      }
    }
  };
  constructor(snykJson: Record<string, unknown>) {
    super(snykJson);
  }
}
