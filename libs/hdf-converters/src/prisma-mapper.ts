import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  MappedTransform,
  parseCsv
} from './base-converter';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  DEFAULT_UPDATE_REMEDIATION_NIST_TAGS
} from './utils/global';
import {getCCIsForNISTTags} from './mappings/CciNistMapping';

export type PrismaControl = {
  Packages: string;
  Description: string;
  Distro: string;
  Type: string;
  Hostname: string;
  'Compliance ID': string;
  'Fix Status'?: string;
  'CVE ID': string;
  Severity: string;
  Cause?: string;
};

const SEVERITY_LOOKUP: Record<string, number> = {
  low: 0.3,
  moderate: 0.5,
  high: 0.7,
  important: 0.9,
  critical: 1
};

export function nistTag(cveTag: string | undefined) {
  if (!cveTag) {
    return DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS;
  } else {
    return DEFAULT_UPDATE_REMEDIATION_NIST_TAGS;
  }
}

export class PrismaControlMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON.Execution, ILookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: 'Prisma Cloud Scan Report'
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: 'Palo Alto Prisma Cloud Tool',
        version: '',
        title: 'Prisma Cloud Scan Report',
        maintainer: null,
        summary: '',
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
            path: 'records',
            key: 'id',
            desc: {path: 'Description'},
            tags: {
              cci: {
                path: 'CVE ID',
                transformer: (cve: string) => getCCIsForNISTTags(nistTag(cve))
              },
              nist: {
                path: 'CVE ID',
                transformer: nistTag
              },
              cve: {path: 'CVE ID'},
              cvss: {path: 'cssv'}
            },
            descriptions: [],
            refs: [{url: {path: 'Vulnerability Link'}}],
            source_location: {path: 'Hostname'},
            id: {
              transformer: (item: PrismaControl) => {
                if (item['CVE ID']) {
                  return `${item['Compliance ID']}-${item['CVE ID']}`;
                } else {
                  return `${item['Compliance ID']}-${item.Distro}-${item.Severity}`;
                }
              }
            },
            title: {
              transformer: (item: PrismaControl) =>
                `${item.Hostname}-${item.Distro}-${item.Type}`
            },
            impact: {
              path: 'Severity',
              transformer: (severity: string) => {
                if (severity) {
                  return SEVERITY_LOOKUP[severity];
                } else {
                  return 0.5;
                }
              }
            },
            code: {
              transformer: (obj: PrismaControl) => JSON.stringify(obj, null, 2)
            },
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {
                  transformer: (obj: PrismaControl) => {
                    let result = '';
                    if (obj.Type === 'image') {
                      if (obj['Packages'] !== '') {
                        result += `Version check of package: ${obj['Packages']}`;
                      }
                    } else if (obj.Type === 'linux') {
                      if (obj.Distro !== '') {
                        result += `Configuration check for ${obj.Distro}`;
                      } else {
                        result += ``;
                      }
                    } else {
                      result += `${obj.Type} check for ${obj.Hostname}`;
                    }
                    result += `\n\n${obj.Description}`;
                    return result;
                  }
                },
                message: {
                  transformer: (obj: PrismaControl) => {
                    let result = '';
                    if (obj['Fix Status'] !== '' && obj.Cause !== '') {
                      result += `Fix Status: ${obj['Fix Status']}\n\n${obj.Cause}`;
                    } else if (obj['Fix Status'] !== '') {
                      result += `Fix Status: ${obj['Fix Status']}`;
                    } else if (obj.Cause !== '') {
                      result += `Cause: ${obj.Cause}`;
                    } else {
                      result += 'Unknown';
                    }
                    return result;
                  }
                },
                start_time: {path: 'Published'}
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };

  constructor(prismaControls: PrismaControl[]) {
    super({records: prismaControls});
  }
}

export class PrismaMapper {
  data: PrismaControl[] = [];

  toHdf(): ExecJSON.Execution[] {
    const executions: ExecJSON.Execution[] = [];
    const hostnameToControls: Record<string, PrismaControl[]> = {};
    this.data.forEach((record: PrismaControl) => {
      hostnameToControls[record['Hostname']] =
        hostnameToControls[record['Hostname']] || [];
      hostnameToControls[record['Hostname']].push(record);
    });
    Object.entries(hostnameToControls).forEach(([hostname, controls]) => {
      const converted = new PrismaControlMapper(controls).toHdf();
      _.set(converted, 'platform.target_id', hostname);
      executions.push(converted);
    });
    return executions;
  }

  constructor(prismaCsv: string) {
    this.data = parseCsv(prismaCsv) as PrismaControl[];
  }
}
