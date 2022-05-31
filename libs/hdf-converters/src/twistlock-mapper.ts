import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS} from './utils/global';

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3]
]);
const CWE_NIST_MAPPING = new CweNistMapping();

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

export class TwistlockResults {
  data: Record<string, unknown>;
  customMapping?: MappedTransform<ExecJSON.Execution, ILookupPath>;
  constructor(TwistlockJson: string) {
    this.data = JSON.parse(TwistlockJson);
  }

  toHdf(): ExecJSON.Execution[] | ExecJSON.Execution {
    const results: ExecJSON.Execution[] = [];
    if (Array.isArray(this.data)) {
      this.data.forEach((element) => {
        const entry = new TwistlockMapper(element);
        if (this.customMapping !== undefined) {
          entry.setMappings(this.customMapping);
        }
        results.push(entry.toHdf());
      });
      return results;
    } else {
      const result = new TwistlockMapper(this.data);
      if (this.customMapping !== undefined) {
        result.setMappings(this.customMapping);
      }
      return result.toHdf();
    }
  }
  setMappings(
    customMapping: MappedTransform<ExecJSON.Execution, ILookupPath>
  ): void {
    this.customMapping = customMapping;
  }
}

export class TwistlockMapper extends BaseConverter {
  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: {path: 'results.name'}
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: 'Twistlock Scan',
        title: {
          transformer: (data: Record<string, unknown>): string => {
            const projectName = _.has(data, 'results.name')
              ? `Twistlock Project: ${_.get(data, 'results.name')} `
              : '';
            return `${projectName}Twistlock Path: ${_.get(data, 'path')}`;
          }
        },
        maintainer: null,
        summary: {
          transformer: (data: Record<string, unknown>): string => {
            return _.has(data, 'vulnerabilityDistribution')
              ? `Twistlock Summary: ${JSON.stringify(_.get(data, 'vulnerabilityDistribution'), null, 2)} `
              : '';
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
            path: 'results.vulnerabilities',
            key: 'id',
            tags: {
              cveid: {path: 'id', transformer: parseIdentifier},
            },
            descriptions: [],
            refs: [],
            source_location: {},
            title: {path: 'packageName'},
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
                code_desc: '',
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
      Twistlock_metadata: {
        transformer: (
          data: Record<string, unknown>
        ): Record<string, unknown> => {
          return _.omit(data, ['vulnerabilities']);
        }
      }
    }
  };
  constructor(TwistlockJson: Record<string, unknown>) {
    super(TwistlockJson);
  }
  setMappings(
    customMappings: MappedTransform<ExecJSON.Execution, ILookupPath>
  ): void {
    super.setMappings(customMappings);
  }
}
