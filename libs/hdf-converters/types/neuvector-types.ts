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
  # Generates neuvector/neuvector TypeScript types from its Golang source code
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
Some of the generated types are copied into and defined in this file. The currently-used generated types begin with `REST`, and some of the generated types are tweaked such that when they have a field beginning with `REST`, the field is intersected instead. For example: 
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

export type RESTVulnerability = {
  // This can be a CVE, GHSA, or RHSA.
  name: string;
  // `score` is possibly CVSS v2 based on https://github.com/neuvector/scanner/blob/765fb1db2cf678ea6c6d386f3eb0f720311d745a/cvetools/cvesearch.go#L1416.
  score: number /* Tygo: float32 */;
  // Could be CVSS v3, since info for v2 and v4 doesn't always exist for CVEs.
  severity: string;
  // Could be the CVSS v2 vector.
  vectors: string;
  description: string;
  file_name: string;
  package_name: string;
  package_version: string;
  fixed_version: string;
  link: string;
  // In the NeuVector Scanning & Compliance documentation, Score (V3) is selectable by a dropdown. This could be the CVSS v3 score.
  score_v3: number /* Tygo: float32 */;
  // Could be the CVSS v3 vector.
  vectors_v3: string;
  // Both timestamp fields are Unix epoch timestamps, in seconds.
  published_timestamp: number /* Tygo: int64 */;
  last_modified_timestamp: number /* Tygo: int64 */;
  cpes?: string[];
  cves?: string[];
  feed_rating: string;
  in_base_image?: boolean;
  tags?: string[];
};

export type RESTScanModule = {
  name: string;
  file: string;
  version: string;
  source: string;
  cves?: RESTModuleCve[];
  cpes?: string[];
};

export type RESTModuleCve = {
  name: string;
  status: string;
};

type RESTBenchItem = {
  level: string;
  evidence?: string;
  location?: string;
  message: string[];
  group?: string;
} & RESTBenchCheck;

type RESTBenchCheck = {
  test_number: string;
  category: string;
  type: string;
  profile: string;
  scored: boolean;
  automated: boolean;
  description: string;
  remediation: string;
  tags?: string[]; // Tygo: Tags provide list of compliance that related to the cis test item.
  tags_v2?: Record<string, unknown /* Tygo: share.TagDetails */>; // Tygo: TagsV2 provide compliance details for each compliance tag
};

type RESTScanSecret = {
  type: string;
  evidence: string;
  path: string;
  suggestion: string;
};

type RESTScanSetIdPerm = {
  type: string;
  evidence: string;
  path: string;
};

type RESTScanSignatureInfo = {
  verifiers?: string[];
  verification_timestamp: string;
};

type RESTScanReport = {
  vulnerabilities: RESTVulnerability[];
  modules?: RESTScanModule[];
  // `checks` lines up with CIS benchmarks
  checks?: RESTBenchItem[];
  secrets?: RESTScanSecret[];
  setid_perms?: RESTScanSetIdPerm[];
  // Environment variables used within the Docker image
  envs?: string[];
  labels?: Record<string, string>;
  // Dockerfile CMDs
  cmds?: string[];
  signature_data?: RESTScanSignatureInfo;
};

export type RESTScanRepoReport = {
  verdict?: string;
  image_id: string;
  registry: string;
  repository: string;
  tag: string;
  digest: string;
  size: number /* Tygo: int64 */;
  author: string;
  base_os: string;
  created_at: string;
  cvedb_version: string;
  cvedb_create_time: string;
  layers: RESTScanLayer[];
} & RESTScanReport;

type RESTScanLayer = {
  digest: string;
  cmds: string;
  vulnerabilities: RESTVulnerability[];
  size: number /* Tygo: int64 */;
};

export type NeuVectorScanJson = {
  report: RESTScanRepoReport;
  error_message: string;
};

export enum DockerSecurityBenchCheckResult {
  Pass = 'PASS',
  Warn = 'WARN',
  Note = 'NOTE',
  Info = 'INFO'
}
