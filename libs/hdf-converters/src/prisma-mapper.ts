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
  low: 0,
  moderate: 0.5,
  high: 0.7
};

function getTitle(item: Record<string, string>): string {
  const hostName = _.get(item, 'Hostname');
  const distro = _.get(item, 'Distro');
  const type = _.get(item, 'Type');
  return hostName.toString().concat(distro, type);
}

export class PrismaControlMapper extends BaseConverter {
  data: PrismaControls = {
    records: []
  };
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
        version: HeimdallToolsVersion,
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
            tags: {
              cve: {path: 'CVE ID'},
              cvss: {path: 'cssv'}
            },
            descriptions: [],
            refs: [{url: {path: 'Vulnerability Link'}}],
            source_location: {path: 'Hostname'},
            id: {path: 'Compliance ID'},
            title: {transformer: getTitle},
            desc: {path: 'Description'},
            impact: {
              path: 'Severity',
              transformer: (severity?: 'low' | 'moderate' | 'high') => {
                if (severity) {
                  return SEVERITY_LOOKUP[severity];
                } else {
                  return 0.5;
                }
              }
            },
            code: '',
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {
                  path: 'Cause',
                  transformer: (cause?: string) => {
                    if (cause) {
                      return `Cause: ${cause}`;
                    } else {
                      return `Unknown`;
                    }
                  }
                },
                message: {
                  path: 'Fix Status',
                  transformer: (fixStatus?: string) => {
                    if (fixStatus) {
                      return `Fix Status: ${fixStatus}`;
                    } else {
                      return `Unknown`;
                    }
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

  toHdf(): ExecJSON.Execution | ExecJSON.Execution[] {
    const executions: ExecJSON.Execution[] = [];
    const hostnameToControls: Record<string, Record<string, string>[]> = {}
    this.data.forEach((record: Record<string, string>) => {
      hostnameToControls[record['Hostname']] = hostnameToControls[record['Hostname']] || [];
      hostnameToControls[record['Hostname']].push(record)
    });
    Object.entries(hostnameToControls).forEach(([hostname, controls]) => {
      const converted = new PrismaControlMapper(controls).toHdf()
      _.set(converted, 'platform.target_id', hostname)
      executions.push(converted)
    })
    console.log(executions)
    return executions;
  }

  constructor(prismaCsv: string) {
    this.data = parseCsv(prismaCsv) as Record<string, string>[];
  }
}
