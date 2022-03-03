import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  MappedTransform,
  parseHtml
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';

const CWE_NIST_MAPPING = new CweNistMapping();
const DEFAULT_NIST_TAG = ['SA-11', 'RA-5'];

function filterSite<T>(input: Array<T>, name?: string) {
  // Choose the site passed if provided
  if (name) {
    return input.find((element) => _.get(element, '@name') === name);
  }
  // Otherwise choose the site with the most alerts
  else {
    return input.reduce((a, b) =>
      _.get(a, 'alerts').length > _.get(b, 'alerts').length ? a : b
    );
  }
}
function impactMapping(input: unknown): number {
  if (typeof input === 'string') {
    const impact = parseInt(input);
    if (0 <= impact && impact <= 1) {
      return 0.3;
    } else if (impact === 2) {
      return 0.5;
    } else if (impact >= 3) {
      return 0.7;
    } else {
      return 0;
    }
  } else {
    return 0;
  }
}
function nistTag(cweid: string): string[] {
  const result = CWE_NIST_MAPPING.nistFilter([cweid], DEFAULT_NIST_TAG);
  if (result === DEFAULT_NIST_TAG) {
    return result;
  } else {
    return result.concat('Rev_4');
  }
}
function checkText(input: Record<string, unknown>): string {
  const text = [];
  text.push(_.get(input, 'solution'));
  text.push(_.get(input, 'otherinfo'));
  text.push(_.get(input, 'otherinfo'));
  return text.join('\n');
}
function formatCodeDesc(input: unknown): string {
  const text: string[] = [];
  if (input instanceof Object) {
    Object.keys(input).forEach((key) => {
      text.push(
        `${key.charAt(0).toUpperCase() + key.slice(1)}: ${_.get(input, key)}`
      );
    });
  }
  return text.join('\n') + '\n';
}
function deduplicateId(input: unknown[]): ExecJSON.Control[] {
  const controlId = input.map((element) => {
    return _.get(element, 'id');
  });
  const dupId = _(controlId)
    .groupBy()
    .pickBy((value) => value.length > 1)
    .keys()
    .value();
  dupId.forEach((id) => {
    let index = 1;
    input
      .filter((element) => _.get(element, 'id') === id)
      .forEach((element) => {
        if (element instanceof Object) {
          _.set(element, 'id', `${id}.${index.toString()}`);
        }
        index++;
      });
  });
  return input as ExecJSON.Control[];
}

export class ZapMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON.Execution, ILookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: ''
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: 'OWASP ZAP Scan',
        version: {path: '@version'},
        title: {
          path: 'site.@host',
          transformer: (input: unknown): string => {
            return `OWASP ZAP Scan of Host: ${input}`;
          }
        },
        maintainer: null,
        summary: {
          path: 'site.@host',
          transformer: (input: unknown): string => {
            return `OWASP ZAP Scan of Host: ${input}`;
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
            path: 'site.alerts',
            arrayTransformer: deduplicateId,
            id: {path: 'pluginid'},
            title: {path: 'name'},
            desc: {path: 'desc', transformer: parseHtml},
            impact: {path: 'riskcode', transformer: impactMapping},
            tags: {
              nist: {path: 'cweid', transformer: nistTag},
              cweid: {path: 'cweid'},
              wascid: {path: 'wascid'},
              sourceid: {path: 'sourceid'},
              confidence: {path: 'confidence'},
              riskdesc: {path: 'riskdesc'},
              check: {transformer: checkText}
            },
            descriptions: [],
            refs: [],
            source_location: {},
            code: '',
            results: [
              {
                path: 'instances',
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {transformer: formatCodeDesc},
                run_time: 0,
                start_time: {path: '$.@generated'}
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  constructor(zapJson: string, name?: string) {
    super(
      _.set(
        JSON.parse(zapJson),
        'site',
        filterSite(_.get(JSON.parse(zapJson), 'site'), name)
      ),
      false,
      'zap2hdf'
    );
  }
  setMappings(
    customMappings: MappedTransform<ExecJSON.Execution, ILookupPath>
  ): void {
    super.setMappings(customMappings);
  }
  toHdf(): ExecJSON.Execution {
    const original = super.toHdf();
    _.get(original, 'profiles').forEach((profile) => {
      _.get(profile, 'controls').forEach((control) => {
        _.set(
          control,
          'results',
          _.get(control, 'results').filter(function (
            element: ExecJSON.ControlResult,
            index: number,
            self: ExecJSON.ControlResult[]
          ) {
            return index === self.indexOf(element);
          })
        );
      });
    });
    return original;
  }
}
