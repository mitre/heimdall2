import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  MappedTransform,
  parseCsv
} from './base-converter';

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

export class PrismaMapper extends BaseConverter {
  //data: Record<string, unknown>;
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
  constructor(prismaCsv: string) {
    super(parseCsv(prismaCsv));
  }
}
