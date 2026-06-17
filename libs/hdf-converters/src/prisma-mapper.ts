import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import {
  BaseConverter,
  parseCsv,
} from './base-converter';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  DEFAULT_UPDATE_REMEDIATION_NIST_TAGS,
  getCCIsForNISTTags,
  HeimdallToolsVersion,
} from './utils/global';

export type PrismaControl = {
  Cause?: string;
  'Compliance ID': string;
  'CVE ID': string;
  Description: string;
  Distro: string;
  'Fix Status'?: string;
  Hostname: string;
  Packages: string;
  Severity: string;
  Type: string;
};

const SEVERITY_LOOKUP: Record<string, number> = {
  critical: 1,
  high: 0.7,
  important: 0.9,
  low: 0.3,
  moderate: 0.5,
};

export class PrismaControlMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON.Execution, ILookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: 'Prisma Cloud Scan Report',
    },
    profiles: [
      {
        attributes: [],
        controls: [
          {
            code: { transformer: (obj: PrismaControl) => JSON.stringify(obj, null, 2) },
            desc: { path: 'Description' },
            descriptions: [],
            id: {
              transformer: (item: PrismaControl) => {
                return item['CVE ID'] ? `${item['Compliance ID']}-${item['CVE ID']}` : `${item['Compliance ID']}-${item.Distro}-${item.Severity}`;
              },
            },
            impact: {
              path: 'Severity',
              transformer: (severity: string) => {
                return severity ? SEVERITY_LOOKUP[severity] : 0.5;
              },
            },
            key: 'id',
            path: 'records',
            refs: [{ url: { path: 'Vulnerability Link' } }],
            results: [
              {
                code_desc: {
                  transformer: (obj: PrismaControl) => {
                    let result = '';
                    if (obj.Type === 'image') {
                      if (obj.Packages !== '') {
                        result += `Version check of package: ${obj.Packages}`;
                      }
                    } else if (obj.Type === 'linux') {
                      result += obj.Distro === '' ? '' : `Configuration check for ${obj.Distro}`;
                    } else {
                      result += `${obj.Type} check for ${obj.Hostname}`;
                    }
                    result += `\n\n${obj.Description}`;
                    return result;
                  },
                },
                message: {
                  transformer: (obj: PrismaControl) => {
                    let result = '';
                    if (obj['Fix Status'] !== '' && obj.Cause !== '') {
                      result += `Fix Status: ${obj['Fix Status']}\n\n${obj.Cause}`;
                    } else if (obj['Fix Status'] !== '') {
                      result += `Fix Status: ${obj['Fix Status']}`;
                    } else if (obj.Cause === '') {
                      result += 'Unknown';
                    } else {
                      result += `Cause: ${obj.Cause}`;
                    }
                    return result;
                  },
                },
                start_time: { path: 'Published' },
                status: ExecJSON.ControlResultStatus.Failed,
              },
            ],
            source_location: { path: 'Hostname' },
            tags: {
              cci: {
                path: 'CVE ID',
                transformer: (cve: string) => getCCIsForNISTTags(nistTag(cve)),
              },
              cve: { path: 'CVE ID' },
              cvss: { path: 'cssv' },
              nist: {
                path: 'CVE ID',
                transformer: nistTag,
              },
            },
            title: {
              transformer: (item: PrismaControl) =>
                `${item.Hostname}-${item.Distro}-${item.Type}`,
            },
          },
        ],
        copyright: null,
        copyright_email: null,
        depends: [],
        groups: [],
        license: null,
        maintainer: null,
        name: 'Palo Alto Prisma Cloud Tool',
        sha256: '',
        status: 'loaded',
        summary: '',
        supports: [],
        title: 'Prisma Cloud Scan Report',
        version: '',
      },
    ],
    statistics: { duration: null },
    version: HeimdallToolsVersion,
  };

  constructor(prismaControls: PrismaControl[]) {
    super({ records: prismaControls });
  }
}

export class PrismaMapper {
  data: PrismaControl[] = [];

  constructor(prismaCsv: string) {
    this.data = parseCsv(prismaCsv) as PrismaControl[];
  }

  toHdf(): ExecJSON.Execution[] {
    const executions: ExecJSON.Execution[] = [];
    const hostnameToControls: Record<string, PrismaControl[]> = {};
    this.data.forEach((record: PrismaControl) => {
      hostnameToControls[record.Hostname]
        = hostnameToControls[record.Hostname] || [];
      hostnameToControls[record.Hostname].push(record);
    });
    for (const [hostname, controls] of Object.entries(hostnameToControls)) {
      const converted = new PrismaControlMapper(controls).toHdf();
      _.set(converted, 'platform.target_id', hostname);
      executions.push(converted);
    }
    return executions;
  }
}

export function nistTag(cveTag: string | undefined) {
  return cveTag ? DEFAULT_UPDATE_REMEDIATION_NIST_TAGS : DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS;
}
