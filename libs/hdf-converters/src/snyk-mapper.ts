import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import {
  BaseConverter,
  DEFAULT_PROFILE_FIELDS,
  impactMapping,
} from './base-converter';
import { CweNistMapping } from './mappings/CweNistMapping';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags,
  HeimdallToolsVersion,
} from './utils/global';
import { createHeimdallPassthrough } from './utils/heimdall_metadata';

const IMPACT_MAPPING = new Map<string, number>([
  ['high', 0.7],
  ['low', 0.3],
  ['medium', 0.5],
]);
const CWE_NIST_MAPPING = new CweNistMapping();

const CWE_PATH = 'identifiers.CWE';

export class SnykMapper extends BaseConverter {
  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      heimdall: { transformer: () => ({ sourceFormat: 'snyk', toolVersion: HeimdallToolsVersion }) },
      snyk_metadata: {
        transformer: (
          data: Record<string, unknown>,
        ): Record<string, unknown> => {
          return _.omit(data, ['vulnerabilities']);
        },
      },
    },
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: { path: 'projectName' },
    },
    profiles: [
      {
        ...DEFAULT_PROFILE_FIELDS,
        controls: [
          {
            code: {
              transformer: (vulnerability: Record<string, unknown>): string => {
                return JSON.stringify(vulnerability, null, 2);
              },
            },
            desc: { path: 'description' },
            descriptions: [],
            id: { path: 'id' },
            impact: {
              path: 'severity',
              transformer: impactMapping(IMPACT_MAPPING),
            },
            key: 'id',
            path: 'vulnerabilities',
            refs: [],
            results: [
              {
                code_desc: {
                  path: 'from',
                  transformer: (input: unknown): string => {
                    return Array.isArray(input) ? `From : [ ${input.join(' , ')} ]` : '';
                  },
                },
                run_time: 0,
                start_time: '',
                status: ExecJSON.ControlResultStatus.Failed,
              },
            ],
            source_location: {},
            tags: {
              cci: {
                path: CWE_PATH,
                transformer: (cwe: unknown[]) =>
                  getCCIsForNISTTags(nistTag(cwe)),
              },
              cveid: { path: 'identifiers.CVE', transformer: parseIdentifier },
              cweid: { path: CWE_PATH, transformer: parseIdentifier },
              ghsaid: { path: 'identifiers.GHSA', transformer: parseIdentifier },
              nist: { path: CWE_PATH, transformer: nistTag },
            },
            title: { path: 'title' },
          },
        ],
        name: 'Snyk Scan',
        summary: {
          path: 'summary',
          transformer: (summary: string): string => {
            return `Snyk Summary: ${summary}`;
          },
        },
        title: {
          transformer: (data: Record<string, unknown>): string => {
            const projectName = _.has(data, 'projectName')
              ? `Snyk Project: ${_.get(data, 'projectName')} `
              : '';
            return `${projectName}Snyk Path: ${_.get(data, 'path')}`;
          },
        },
      },
    ],
    statistics: { duration: null },
    version: HeimdallToolsVersion,
  };

  constructor(snykJson: Record<string, unknown>) {
    super(snykJson);
  }
}
export class SnykResults {
  customMapping?: MappedTransform<ExecJSON.Execution, ILookupPath>;
  data: Record<string, unknown>;
  constructor(snykJson: string) {
    this.data = JSON.parse(snykJson);
  }

  toHdf(): ExecJSON.Execution | ExecJSON.Execution[] {
    const results: ExecJSON.Execution[] = [];
    if (Array.isArray(this.data)) {
      for (const element of this.data) {
        const entry = new SnykMapper(element);
        if (this.customMapping !== undefined) {
          entry.setMappings(this.customMapping);
        }
        results.push(entry.toHdf());
      }
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

function nistTag(identifiers: unknown[]): string[] {
  return CWE_NIST_MAPPING.nistFilter(
    parseIdentifier(identifiers),
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  );
}

function parseIdentifier(identifiers: unknown | unknown[]): string[] {
  const output: string[] = [];
  if (identifiers !== undefined && Array.isArray(identifiers)) {
    for (const element of identifiers) {
      const numbers = element.split('-');
      numbers.shift();
      output.push(numbers.join('-'));
    }
    return output;
  }
  return [];
}
