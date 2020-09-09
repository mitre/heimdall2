# Heimdall Enterprise Server 2.0

![Run E2E Backend + Frontend Tests](https://github.com/mitre/heimdall2/workflows/Run%20E2E%20Backend%20+%20Frontend%20Tests/badge.svg) ![Run Frontend Tests](https://github.com/mitre/heimdall2/workflows/Run%20Frontend%20Tests/badge.svg) ![Run Backend Tests](https://github.com/mitre/heimdall2/workflows/Run%20Backend%20Tests/badge.svg)

This repository contains the source code for the Heimdall 2 Backend and Frontend (Heimdall-Lite).

## Heimdall Lite

### Demos

![Heimdall Lite 2.0 Demo GIF](/apps/frontend/public/heidmall-lite-2.0-demo-5fps.gif)

#### Video

[![Heimdall Lite 2.0 Demo YouTube](https://img.youtube.com/vi/1jXHWZ0gHQg/0.jpg)](https://www.youtube.com/watch?v=1jXHWZ0gHQg)

### Hosted

#### Netlify (Built off Master Branch)

<https://heimdall-lite.netlify.com/>

#### GitHub Pages (Built off Last Release)

<https://heimdall-lite.mitre.org>

## Installation & Use

As a single-page javascript app - you can run Heimdall-Lite from any web-server, a _secured_ S3 bucket or directly via GitHub Pages (as it is here). Heimdall-Lite gives you the ability to easily review and produce reports about your InSpec run, filter the results for easy review and hot-wash, print out reports, generate System Security Plan (SSP) content, and much more.

### Heimdall vs Heimdall-Lite

There are two versions of the MITRE Heimdall Viewer - the full Heimdall Enterprise Server and the Heimdall-Lite version. Both share the same frontend but have been produced to meet different needs and use-cases.

### Features

|                                                                                | [Heimdall-Lite](https://github.com/mitre/heimdall-lite/) | [Heimdall](https://github.com/mitre/heimdall/)                                |
| :----------------------------------------------------------------------------- | :------------------------------------------------------- | :---------------------------------------------------------------------------- |
| Installation Requirements                                                      | any web server                                           | rails 5.x Server <br /> Postgres Server                                       |
| Overview Dashboard & Counts                                                    | x                                                        | x                                                                             |
| 800-53 Partition and TreeMap View                                              | x                                                        | x                                                                             |
| Data Table / Control Summary                                                   | x                                                        | x                                                                             |
| InSpec Code / Control Viewer                                                   | x                                                        | x                                                                             |
| SSP Content Generator                                                          |                                                          | x                                                                             |
| PDF Report and Print View                                                      | x                                                        | x                                                                             |
|                                                                                |                                                          |                                                                               |
| Users & Roles & multi-team support                                             |                                                          | x                                                                             |
| Authentication & Authorization                                                 | Hosting Webserver                                        | Hosting Webserver<br />LDAP<br />GitHub OAUTH & SAML<br />GitLab OAUTH & SAML |
| Advanced Data / Filters for Reports and Viewing                                |                                                          | x                                                                             |
| Multiple Report Output<br />(DISA Checklist XML, CAT, XCCDF-Results, and more) |                                                          | x                                                                             |
| Authenticated REST API                                                         |                                                          | x                                                                             |
| InSpec Run 'Delta' View                                                        |                                                          | x                                                                             |
| Multi-Report Tagging, Filtering and Delta View                                 |                                                          | x                                                                             |

### Use Cases

| [Heimdall-Lite](https://github.com/mitre/heimdall-lite/) | [Heimdall](https://github.com/mitre/heimdall/)           |
| :------------------------------------------------------- | :------------------------------------------------------- |
| Ship the App & Data via simple Email                     | Multiple Teams Support                                   |
| Minimal Footprint & Deployment Time                      | Timeline and Report History                              |
| Local or disconnected Use                                | Centralized Deployment Model                             |
| One-Time Quick Reviews                                   | Need to view the delta between one or more runs          |
| Decentralized Deployment                                 | Need to view subsets of the 800-53 control alignment     |
| Minimal A&A Time                                         | Need to produce more complex reports in multiple formats |

## General Deployment

### NodeJS Deployment

Heimdall Lite is a standard VueJS app so for help with a local deployment, please see: <https://cli.vuejs.org/guide/deployment.html#general-guidelines>

Heimdall Lite is published to the <npmjs.org> MITRE site at <https://www.npmjs.com/package/heimdall-lite>.

#### Running via npm

To run Heimdall Lite locally, just use the `npm` built-in utility `npx`:

`npx heimdall-lite`

If you use this tool often and want to have it installed locally, use the following command:

`npm install -g heimdall-lite`

Then, any subsequent `npx heimdall-lite` will use the local version and load much more quickly.

## For Developers

### How to Install

This project uses [Lerna](https://lerna.js.org/) (multi-project manager) to manage dependencies and run the applications. Installing dependencies can be done by running

    npm install -g lerna
    npx lerna bootstrap --hoist

### Development Environment

It is suggested to use VSCode for development on this project. For convenience, a heimdall2.code-workspace file has been provided at the root of this repository. Loading this workspace into VSCode will fix Intellisense imports and configures editor defaults to match what eslint will check for during PRs.

### Heimdall Server + Frontend Development

In order to run Heimdall Server, Postgresql must be installed and the following one-time steps must be performed:

    cp apps/backend/.env-example apps/backend/.env
    # Edit /apps/backend/.env to reflect the appropriate configuration for your system
    npx lerna exec "npx sequelize-cli db:create" --scope heimdall-server
    npx lerna exec "npx sequelize-cli db:migrate" --scope heimdall-server

Once the above steps are completed it is possible to start heimdall-server using the following command

    npm run start:dev

### Developing Heimdall Lite Standalone

    npm run lite:dev

### Lint and fix files

    lerna run lint

### Compile and minify the frontend and backend for production

    lerna run build

### Run tests

    # Frontend + Backend End to End Tests (Expects lerna run build to have been run)
    lerna run test:ui --stream
    # Run Frontend Vue Tests
    lerna run test --scope heimdall-lite --stream
    # Run Backend Nest Tests
    lerna run test:e2e --stream
    lerna run test:ci-cov --stream

## Versioning and State of Development

This project uses the [Semantic Versioning Policy](https://semver.org/)

## Contributing, Issues and Support

### Contributing

Please feel free to look through our issues, make a fork and submit _PRs_ and improvements. We love hearing from our end-users and the community and will be happy to engage with you on suggestions, updates, fixes or new capabilities.

### Issues and Support

Please feel free to contact us by **opening an issue** on the issue board, or, at [inspec@mitre.org](mailto:inspec@mitre.org) should you have any suggestions, questions or issues. If you have more general questions about the use of our software or other concerns, please contact us at [opensource@mitre.org](mailto:opensource@mitre.org).

### NOTICE

© 2019-2020 The MITRE Corporation.

Approved for Public Release; Distribution Unlimited. Case Number 18-3678.

### NOTICE

MITRE hereby grants express written permission to use, reproduce, distribute, modify, and otherwise leverage this software to the extent permitted by the licensed terms provided in the LICENSE.md file included with this project.

### NOTICE

This software was produced for the U. S. Government under Contract Number HHSM-500-2012-00008I, and is subject to Federal Acquisition Regulation Clause 52.227-14, Rights in Data-General.

No other use other than that granted to the U. S. Government, or to those acting on behalf of the U. S. Government under that Clause is authorized without the express written permission of The MITRE Corporation.

For further information, please contact The MITRE Corporation, Contracts Management Office, 7515 Colshire Drive, McLean, VA 22102-7539, (703) 983-6000.
