import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  MappedTransform,
  parseCsv
} from './base-converter';

export type PrismaControls = {
  records: Record<string, string>[];
};

const SEVERITY_LOOKUP: Record<string, number> = {
  low: 0.3,
  moderate: 0.5,
  high: 0.7,
  important: 0.9,
  critial: 1
};

const DEFAULT_NIST_TAG = ['SA-11', 'RA-5'];
const BASE_NIST_TAG = ['SI-2', 'RA-5'];

function nistTag(cveTag: Record<string, string>): string[] {
  if (!cveTag) {
    return DEFAULT_NIST_TAG;
  } else {
    return BASE_NIST_TAG;
  }
}
function getId(value: Record<string, string>): string {
  return (
    _.get(value, 'Compliance ID') +
    '-' +
    (_.get(value, 'CVE ID') ||
      _.get(value, 'Distro') + '-' + _.get(value, 'Severity'))
  );
}
function getTitle(item: Record<string, string>): string {
  const hostName = _.get(item, 'Hostname');
  const distro = _.get(item, 'Distro');
  const type = _.get(item, 'Type');
  return hostName.toString().concat(distro, type);
}
function getImpact(severity: string): number {
  if (severity) {
    return SEVERITY_LOOKUP[severity];
  } else {
    return 0.5;
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
              nist: {path: 'CVE ID', transformer: nistTag},
              cve: {path: 'CVE ID'},
              cvss: {path: 'cssv'}
            },
            descriptions: [],
            refs: [{url: {path: 'Vulnerability Link'}}],
            source_location: {path: 'Hostname'},
            id: {transformer: getId},
            title: {transformer: getTitle},
            impact: {path: 'Severity', transformer: getImpact},
            code: {
              transformer: (obj: Record<string, string>) =>
                JSON.stringify(obj, null, 2)
            },
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {
                  transformer: (obj: {
                    Packages: string;
                    Description: string;
                    Distro: string;
                    Type: string;
                    Hostname: string;
                  }) => {
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
                  transformer: (obj: {
                    'Fix Status'?: string;
                    Cause?: string;
                  }) => {
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

  constructor(prismaControls: Record<string, string>[]) {
    super({records: prismaControls});
  }
}

export class PrismaMapper {
  data: Record<string, string>[] = [];

  toHdf(): ExecJSON.Execution[] {
    const executions: ExecJSON.Execution[] = [];
    const hostnameToControls: Record<string, Record<string, string>[]> = {};
    this.data.forEach((record: Record<string, string>) => {
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
    this.data = parseCsv(prismaCsv) as Record<string, string>[];
  }
}
