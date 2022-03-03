import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform,
  parseHtml,
  parseCsv
} from './base-converter';


// https://www.npmjs.com/package/csv-parse
// https://csv.js.org/project/examples/

const SEVERITY_LOOKUP: Record<string, number> = {
  low: 0,
  moderate: 0.5,
  high: 0.7
}
// export default interface PrismaDTO {
//   readonly Hostname: string;
//   readonly Distro: string;
//   readonly 'CVE ID': string;
//   readonly 'Compliance ID': string;
//   readonly Severity: string;
//   readonly Packages?: string;
//   readonly 'Source Package'?: string;
//   readonly 'Source Version'?: string;
//   readonly 'Source License'?: string;
//   readonly CVSS?: string;
//   readonly 'Vulnerability Tags'?: string;
//   readonly Description?: string;
//   readonly Cause?: string;
//   readonly Published?: string;
//   readonly Services?: string;
//   readonly Cluster?: string;
//   readonly 'Vulnerability Link'?: string;
// }

function getId(item: string): string {
  if (_.has(item, 'Compliance ID')) {
    return parseRef(item);
  } else {
    return 'unknown';
  }
}

function getHostName(item: string): string {
  if (_.has(item, 'Hostname')) {
    return parseRef(item);
  } else {
    return 'unknown';
  }
}

function getTagsCVE(item: string): string {
  if (_.has(item, 'CVE ID')) {
    return parseRef(item);
  } else {
    return 'unknown';
  }
}
function getTagsCSSV(item: string): string {
  if (_.has(item, 'CSSV')) {
    return parseRef(item);
  } else {
    return 'unknown';
  }
}

function getVulLink(item: string): string {
  if (_.has(item, 'Vulnerability Link')) {
    return parseRef(item);
  } else {
    return 'unknown';
  }
}
function getTitle(item: string): string {
  var hostName = getHostName;
  var distro = '';
  var type = '';
  if (_.has(item, 'Distro')) {
    distro = parseRef(item);
  }
  if (_.has(item, 'Type')) {
    type = parseRef(item);
  }
  return hostName.toString().concat(distro, type);

}
function getDesc(item: string): string {
  if (_.has(item, 'Description')) {
    return parseRef(item);
  } else {
    return 'unknown';
  }
}
function getSeverity(item: 'low'|'moderate'|'high'): number {
  if (_.has(item, 'Severity')) {
    var severity = parseRef(item);
    return SEVERITY_LOOKUP[severity];
  } else {
    return 0.5;
  }
}

function getCause(item: string): string {
  if (_.has(item, 'Cause')) {
    return 'Cause: '.concat(parseRef(item));
  } else {
    return 'unknown';
  }
}
function getFixStatus(item: string): string {
  if (_.has(item, 'Fix Status')) {
    return 'Fix Status: '.concat(parseRef(item));
  } else {
    return 'unknown';
  }
}
function getPublished(item: string): string {
  if (_.has(item, 'Published')) {
    return (parseRef(item));
  } else {
    return 'unknown';
  }
}



function parseRef(input: string): string {
  return input.split(':')[1];;
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
            tags: {
              cve: {path: 'CVE ID'},
              cvss: {path: 'cssv'},
            },
            descriptions: [],
            refs: [
              { url: {path: 'Vulnerability Link'} }
            ],
            source_location: {path: 'Hostname'},
            id: {path: 'Compliance ID'},
            title: {transformer: getTitle},
            desc: {path: 'Description'},
            impact: {transformer: getSeverity},
            code: '',
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {transformer: getCause},                
                message: {transformer: getFixStatus},
                start_time: {transformer: getPublished}
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  constructor(prismaCsv: string) {
    super(parseCsv(prismaCsv))
  }
}
