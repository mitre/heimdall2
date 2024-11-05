import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  MappedTransform,
  parseHtml
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS} from './mappings/CciNistMappingData';
import {NIST2CCI} from './mappings/CciNistMapping';

const CWE_NIST_MAPPING = new CweNistMapping();

function filterSite<T>(input: Array<T>, name?: string) {
  // Choose passed site if provided
  if (name) {
    return input.find(
      (element) => (_.get(element, '@name') as unknown as string) === name
    );
  }
  // Otherwise choose the site with the most alerts
  else {
    return input.reduce((a, b) =>
      (_.get(a, 'alerts') as unknown as Record<string, unknown>[]).length >
      (_.get(b, 'alerts') as unknown as Record<string, unknown>[]).length
        ? a
        : b
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
  return CWE_NIST_MAPPING.nistFilter(
    [cweid],
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
  );
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
  const dupId = _.chain(controlId)
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
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion
    },
    version: HeimdallToolsVersion,
    statistics: {},
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
        summary: {
          path: 'site.@host',
          transformer: (input: unknown): string => {
            return `OWASP ZAP Scan of Host: ${input}`;
          }
        },
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'site.alerts',
            arrayTransformer: deduplicateId,
            tags: {
              cci: {
                path: 'cweid',
                transformer: (cwe: string) => NIST2CCI(nistTag(cwe))
              },
              nist: {path: 'cweid', transformer: nistTag},
              cweid: {path: 'cweid'},
              wascid: {path: 'wascid'},
              sourceid: {path: 'sourceid'},
              confidence: {path: 'confidence'},
              riskdesc: {path: 'riskdesc'}
            },
            refs: [],
            source_location: {},
            title: {path: 'name'},
            id: {path: 'pluginid'},
            desc: {path: 'desc', transformer: parseHtml},
            descriptions: [
              {
                data: {transformer: checkText},
                label: 'check'
              }
            ],
            impact: {path: 'riskcode', transformer: impactMapping},
            code: {
              transformer: (vulnerability: Record<string, unknown>): string =>
                JSON.stringify(vulnerability, null, 2)
            },
            results: [
              {
                path: 'instances',
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {transformer: formatCodeDesc},
                start_time: {path: '$.@generated'}
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        return {
          auxiliary_data: [
            {
              name: 'OWASP ZAP',
              data: _.pick(data, ['site.@port', 'site.@ssl'])
            }
          ],
          ...(this.withRaw && {raw: data})
        };
      }
    }
  };
  constructor(zapJson: string, name?: string, withRaw = false) {
    super(
      _.set(
        JSON.parse(zapJson),
        'site',
        filterSite(_.get(JSON.parse(zapJson), 'site'), name)
      ),
      false
    );
    this.withRaw = withRaw;
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
