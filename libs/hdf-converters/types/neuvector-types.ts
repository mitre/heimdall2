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
  cpes?: string[];
  cves?: string[];
  description: string;
  feed_rating: string;
  file_name: string;
  fixed_version: string;
  in_base_image?: boolean;
  last_modified_timestamp: number;
  link: string;
  // This can be a CVE, GHSA, or RHSA.
  name: string;
  package_name: string;
  package_version: string;
  // Both timestamp fields are Unix epoch timestamps, in seconds.
  published_timestamp: number;
  // `score` is possibly CVSS v2 based on https://github.com/neuvector/scanner/blob/765fb1db2cf678ea6c6d386f3eb0f720311d745a/cvetools/cvesearch.go#L1416.
  score: number;
  // In the NeuVector Scanning & Compliance documentation, Score (V3) is selectable by a dropdown. This could be the CVSS v3 score.
  score_v3: number;
  // Could be CVSS v3, since info for v2 and v4 doesn't always exist for CVEs.
  severity: string;
  tags?: string[];
  // Could be the CVSS v2 vector.
  vectors: string;
  // Could be the CVSS v3 vector.
  vectors_v3: string;
};

export type RESTScanModule = {
  cpes?: string[];
  cves?: RESTModuleCve[];
  file: string;
  name: string;
  source: string;
  version: string;
};

export type RESTModuleCve = {
  name: string;
  status: string;
};

type RESTBenchItem = RESTBenchCheck & {
  evidence?: string;
  group?: string;
  level: string;
  location?: string;
  message: string[];
};

type RESTBenchCheck = {
  automated: boolean;
  category: string;
  description: string;
  profile: string;
  remediation: string;
  scored: boolean;
  tags?: string[]; // Tygo: Tags provide list of compliance that related to the cis test item.
  tags_v2?: Record<string, unknown>; // Tygo: TagsV2 provide compliance details for each compliance tag
  test_number: string;
  type: string;
};

type RESTScanSecret = {
  evidence: string;
  path: string;
  suggestion: string;
  type: string;
};

type RESTScanSetIdPerm = {
  evidence: string;
  path: string;
  type: string;
};

type RESTScanSignatureInfo = {
  verification_timestamp: string;
  verifiers?: string[];
};

type RESTScanReport = {
  // `checks` lines up with CIS benchmarks
  checks?: RESTBenchItem[];
  // Dockerfile CMDs
  cmds?: string[];
  // Environment variables used within the Docker image
  envs?: string[];
  labels?: Record<string, string>;
  modules?: RESTScanModule[];
  secrets?: RESTScanSecret[];
  setid_perms?: RESTScanSetIdPerm[];
  signature_data?: RESTScanSignatureInfo;
  vulnerabilities: RESTVulnerability[];
};

export type RESTScanRepoReport = RESTScanReport & {
  author: string;
  base_os: string;
  created_at: string;
  cvedb_create_time: string;
  cvedb_version: string;
  digest: string;
  image_id: string;
  layers: RESTScanLayer[];
  registry: string;
  repository: string;
  size: number;
  tag: string;
  verdict?: string;
};

type RESTScanLayer = {
  cmds: string;
  digest: string;
  size: number;
  vulnerabilities: RESTVulnerability[];
};

export type NeuVectorScanJson = {
  error_message: string;
  report: RESTScanRepoReport;
};
