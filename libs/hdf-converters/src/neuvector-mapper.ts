import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {
  conditionallyProvideAttribute,
  DEFAULT_UPDATE_REMEDIATION_NIST_TAGS
} from './utils/global';
import {
  NeuVectorScanJson,
  RESTModuleCve,
  RESTScanModule,
  RESTVulnerability
} from '../types/neuvector-types';

/* Types are generated with Tygo, from original Golang source code to TypeScript, and tweaked to reflect actual outputted JSON. 

// Dockerfile
```
FROM alpine:3.12 AS clone
# If using a VPN, install certificates for `git clone` to work
ADD <URLs to CA certificates>
RUN update-ca-certificates
git clone https://github.com/neuvector/neuvector.git
FROM golang:1.23.0 AS build
# If using a VPN, install certificates for `go install` to work
ADD <URLs to CA certificates>
RUN update-ca-certificates
go install github.com/gzuidhof/tygo@latest
WORKDIR /go/neuvector
COPY --from=clone /neuvector .
COPY tygo.yaml .
```

// tygo.yaml
```
packages:
  - path: 'github.com/neuvector/neuvector/controller/api'
    output_path: '/go/output/neuvector-generated-types.ts'
```

// docker-compose.yml
```
services:
  # Generates neuvector/scanner TypeScript types from its Golang source code
  go2ts:
    container_name: tygo
    volumes:
      - './tygo-output/:/go/output/'
    build:
      dockerfile: Dockerfile
    tty: true
    command: tygo generate
```

// `docker compose` command to regenerate Tygo types: `docker compose up --build go2ts`. Output file will be `./tygo-output/neuvector-generated-types.ts`. 
Some of the generated types are copied into and defined in `heimdall2/libs/hdf-converters/types/neuvector-types.ts`. The currently-used generated types begin with `REST`, and some of the generated types are tweaked such that when they have a field beginning with `REST`, the field is intersected instead. For example: 
```
type RESTScanRepoReport = {
  verdict?: string;
  image_id: string;
  registry: string;
  repository: string;
  tag: string;
  digest: string;
  size: number;
  author: string;
  base_os: string;
  created_at: string;
  cvedb_version: string;
  cvedb_create_time: string;
  layers: RESTScanLayer[];
} & RESTScanReport;
```
was tweaked from the generated
```
export interface RESTScanRepoReport {
  verdict?: string;
  image_id: string;
  registry: string;
  repository: string;
  tag: string;
  digest: string;
  size: number;
  author: string;
  base_os: string;
  created_at: string;
  cvedb_version: string;
  cvedb_create_time: string;
  layers: (RESTScanLayer | undefined)[];
  RESTScanReport: RESTScanReport;
}
```
. In the original Golang RESTScanRepoReport struct at https://github.com/neuvector/neuvector/blob/15496f08f7c445acd4901105fa9e73637b72cdf7/controller/api/apis.go#L2444-L2459, RESTScanReport is composed within RESTScanRepoReport. In Golang, this allows RESTScanRepoReport to use RESTScanReport's members. Tygo embeds RESTScanReport inside of RESTScanRepoReport, but when comparing the actual NeuVector JSON output to the struct definitions, RESTScanReport is not a field of the output's `report` field. In TypeScript, the equivalent of a type accessing another type's members is type intersection. Additionally, NeuVectorScanJson is handcrafted, as its equivalent type doesn't exist in `neuvector-generated-types.ts`.
*/

const CWE_NIST_MAPPING = new CweNistMapping();

function cweTags(description: string): string[] | undefined {
  const regex = /CWE-\d{3}/g;
  return description.match(regex) ?? undefined;
}

function nistTags(cweTags: string[] | undefined): string[] {
  const identifiers = cweTags?.map((tag: string) => tag.slice(-3)) ?? [];
  return CWE_NIST_MAPPING.nistFilter(
    identifiers,
    DEFAULT_UPDATE_REMEDIATION_NIST_TAGS
  );
}

function cveIdMatches(cveName: string): (value: RESTModuleCve) => boolean {
  return (cve: RESTModuleCve) => cve.name === cveName;
}

export class NeuVectorMapper extends BaseConverter {
  withRaw: boolean;
  rawData: NeuVectorScanJson;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: 'NeuVector Scan',
        title: null,
        version: null,
        maintainer: null,
        summary: null,
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
            path: 'report.vulnerabilities',
            key: 'id',
            tags: {
              cves: {path: 'cves'},
              cpes: {
                path: 'cpes',
                transformer: (cpes: string[]) =>
                  conditionallyProvideAttribute(
                    'cpes',
                    cpes,
                    cpes?.length !== 0
                  )
              },
              cwe: {
                path: 'description',
                transformer: cweTags
              },
              nist: {
                path: 'description',
                transformer: (description: string) =>
                  nistTags(cweTags(description))
              },
              score: {path: 'score'},
              vectors: {path: 'vectors'},
              vectors_v3: {path: 'vectors_v3'},
              score_v3: {path: 'score_v3'},
              severity: {path: 'severity'},
              source: {
                path: 'package_name',
                transformer: (packageName: string) =>
                  this.getModule(packageName)?.source
              },
              status: {
                path: 'name',
                transformer: (name: string) =>
                  this.rawData.report.modules
                    ?.find((module) => module.cves?.find(cveIdMatches(name)))
                    ?.cves?.find(cveIdMatches(name))?.status
              },
              feed_rating: {path: 'feed_rating'},
              link: {path: 'link'},
              published_timestamp: {path: 'published_timestamp'},
              last_modified_timestamp: {path: 'last_modified_timestamp'},
              envs: {
                path: '$.report.envs',
                transformer: (envs: string[]) =>
                  conditionallyProvideAttribute(
                    'envs',
                    envs,
                    envs?.length !== 0
                  )
              },
              cmds: {
                path: '$.report.cmds',
                transformer: (cmds: string[]) =>
                  conditionallyProvideAttribute(
                    'cmds',
                    cmds,
                    cmds?.length !== 0
                  )
              }
            },
            refs: [],
            source_location: {ref: {path: 'file_name'}},
            id: {
              transformer: (data: RESTVulnerability) =>
                `${data.name}/${data.package_name}/${data.package_version}`
            },
            desc: {path: 'description'},
            impact: {
              transformer: (data: RESTVulnerability) => {
                const score = data.score_v3 ?? data.score;
                return Number((score / 10).toFixed(1));
              }
            },
            code: null,
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: '',
                message: {
                  transformer: (data: RESTVulnerability) => {
                    const {package_name, package_version, fixed_version} = data;
                    if (!fixed_version) {
                      return `Vulnerable package ${package_name} is at version ${package_version}. No fixed version available.`;
                    }
                    return `Vulnerable package ${package_name} is at version ${package_version}. Update to fixed version ${fixed_version}.`;
                  }
                },
                start_time: ''
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (
        data: NeuVectorScanJson
      ): {
        auxiliary_data: {name: string; data: Pick<never[], keyof never[]>}[];
      } & {raw?: NeuVectorScanJson} => {
        return {
          auxiliary_data: [{name: '', data: _.omit([])}], //Insert service name and mapped fields to be removed
          ...(this.withRaw && {raw: data})
        };
      }
    }
  };
  constructor(exportJson: string, withRaw = false) {
    const rawParams = JSON.parse(exportJson);
    super(rawParams);
    this.withRaw = withRaw;
    this.rawData = rawParams;
  }

  getModule(moduleName: string): RESTScanModule | undefined {
    return this.rawData.report.modules?.find(
      (value: RESTScanModule) => value.name === moduleName
    );
  }
}
