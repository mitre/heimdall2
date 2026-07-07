"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=neuvector-types.js.map