# Heimdall Enterprise Server 2.0

![Run E2E Backend + Frontend Tests](https://github.com/mitre/heimdall2/workflows/Run%20E2E%20Backend%20+%20Frontend%20Tests/badge.svg) ![Run Frontend Tests](https://github.com/mitre/heimdall2/workflows/Run%20Frontend%20Tests/badge.svg) ![Run Backend Tests](https://github.com/mitre/heimdall2/workflows/Run%20Backend%20Tests/badge.svg)

This repository contains the source code for the Heimdall 2 Backend and Frontend (Heimdall-Lite).

## Heimdall Lite

### Demos

![Heimdall Lite 2.0 Demo GIF](/apps/frontend/public/heidmall-lite-2.0-demo-5fps.gif)

#### Video

[![Heimdall Lite 2.0 Demo YouTube](https://img.youtube.com/vi/1jXHWZ0gHQg/0.jpg)](https://www.youtube.com/watch?v=1jXHWZ0gHQg)

### Hosted

#### Current Development (master branch) Preview

These demos are only intended to show the functionality of Heimdall, please do not upload any sensitive data to them!

[Heimdall Lite](https://heimdall-lite.netlify.com/)

[Heimdall Server](https://mitre-heimdall-staging.herokuapp.com/)

#### Release Preview

[Heimdall Lite](https://heimdall-lite.mitre.org)

[Heimdall Server](https://mitre-heimdall.herokuapp.com/)

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

### Running Heimdall Lite

Heimdall Lite is a standard VueJS app so for help with a local deployment, please see: <https://cli.vuejs.org/guide/deployment.html#general-guidelines>

Heimdall Lite is published to the <npmjs.org> MITRE site at <https://www.npmjs.com/package/heimdall-lite>.

#### Running via npm

To run Heimdall Lite locally, just use the `npm` built-in utility `npx`:

`npx heimdall-lite`

If you use this tool often and want to have it installed locally, use the following command:

`npm install -g heimdall-lite`

Then, any subsequent `npx heimdall-lite` will use the local version and load much more quickly.

#### Running via Docker

It is also possible to run heimdall-lite using Docker, using the following command:

`docker run -d -p 8080:80 heimdall-lite:release-latest`

You can then access heimdall-lite via: localhost:8080

If you would prefer to run the bleeding edge version of heimdall-lite, replace `heimdall-lite:release-latest` with `heimdall-lite:latest`.

### Running Heimdall Server

Given that Heimdall requires at least a database service, we use Docker and Docker Compose to provide a simple deployment experience.

#### Setup Docker Container (Clean Install)

1. Install Docker
2. Download heimdall by running `git clone https://github.com/mitre/heimdall2.git`.
3. Navigate to the base folder where `docker-compose.yml` is located
4. Run the following commands in a terminal window from the heimdall source directory:
   1. `./setup-docker-secrets.sh`
   2. `docker-compose up -d`
6. Navigate to `http://127.0.0.1:3000`

#### Running Docker Container

Make sure you have run the setup steps at least once before following these steps!

1. Run the following command in a terminal window:
   - `docker-compose up -d`
2. Go to `127.0.0.1:3000` in a web browser

#### Updating Docker Container

A new version of the docker container can be retrieved by running:

```
docker-compose pull
docker-compose up -d
```

This will fetch the latest version of the container, redeploy if a newer version exists, and then apply any database migrations if applicable. No data should be lost by this operation.

#### Stopping the Container

`docker-compose down` # From the source directory you started from

## For Developers

### How to Install

This project uses [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/) and [Lerna](https://lerna.js.org/) to manage dependencies across the Frontend and Backend applications.

    yarn install

### Development Environment

It is suggested to use VSCode for development on this project. For convenience, a heimdall2.code-workspace file has been provided at the root of this repository. Loading this workspace into VSCode will fix Intellisense imports and configures editor defaults to match what eslint will check for during PRs.

### Heimdall Server + Frontend Development

To run Heimdall Server, Postgresql must be installed and a user account must exist with the permission to create databases. If you would like to use something other than the default 'postgres' user, these steps:

    # Start the Postgres terminal
    psql postgres

    # Create the user
    CREATE USER <username> with encrypted password '<password>';
    ALTER USER <username> CREATEDB;
    quit

Then, the following one-time steps must be performed:

    cp apps/backend/.env-example apps/backend/.env
    # Edit /apps/backend/.env to reflect the appropriate configuration for your system
    yarn backend sequelize-cli db:create
    yarn backend sequelize-cli db:migrate

Once the above steps are completed it is possible to start heimdall-server using the following command

    yarn run start:dev

### Developing Heimdall Lite Standalone

    yarn frontend start:dev

### Lint and fix files

    yarn run lint

### Compile and minify the frontend and backend for production

    yarn run build

### Run tests

    # Frontend + Backend End to End Tests (Expects lerna run build to have been run)
    yarn backend test:ui
    # Run Frontend Vue Tests
    yarn frontend test
    # Run Backend Nest Tests
    yarn backend test:e2e
    yarn backend test:ci-cov
    
### Creating a Release

**Note:** This action requires appropriate privileges on the repository to perform.

1. Ensure you have pulled the latest copy of the code locally onto your machine.
1. Using `lerna version`, run `lerna version <explicit version>` or alternatively use one of the appropriate lerna keywords: `'major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', or 'prerelease'` to bump the version. This will push a new tag to Github.
1. Navigate to `Releases` on Github and edit the release notes that `Release Drafter` has created for you, and assign them to the tag that you just pushed.

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
