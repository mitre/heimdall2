# Heimdall Enterprise Server 2.0

![Run E2E Backend + Frontend Tests](https://github.com/mitre/heimdall2/workflows/Run%20E2E%20Backend%20+%20Frontend%20Tests/badge.svg) ![Run Frontend Tests](https://github.com/mitre/heimdall2/workflows/Run%20Frontend%20Tests/badge.svg) ![Run Backend Tests](https://github.com/mitre/heimdall2/workflows/Run%20Backend%20Tests/badge.svg)

This repository contains the source code for the Heimdall 2 Backend and Frontend (Heimdall-Lite).

## Demos

### Images

| Loading Files                                                | Video                                                        |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![Heimdall Lite 2.0 Demo GIF](https://github.com/mitre/heimdall2/raw/master/apps/frontend/public/heimdall-lite-2.0-demo-5fps.gif) | [![Heimdall Lite 2.0 Demo YouTube](https://i.imgur.com/ezi3ov2.jpg)](https://www.youtube.com/watch?v=1jXHWZ0gHQg) |

### Hosted

#### *These demos are only intended to show the functionality of Heimdall, please do not upload any sensitive data to them.*

#### Released Previews

[Heimdall Lite](https://heimdall-lite.mitre.org) | [Heimdall Server](https://mitre-heimdall.herokuapp.com/)

#### Current *Development Master Branch* Preview

[Heimdall Lite](https://heimdall-lite.netlify.com/) | [Heimdall Server](https://mitre-heimdall-staging.herokuapp.com/)



## Heimdall vs Heimdall-Lite

As a single-page javascript app - you can run Heimdall-Lite from any web-server, a _secured_ S3 bucket or directly via GitHub Pages (as it is here). Heimdall-Lite gives you the ability to easily review and produce reports about your InSpec run, filter the results for easy review and hot-wash, print out reports, generate System Security Plan (SSP) content, and much more.

There are two versions of the MITRE Heimdall Viewer - the full Heimdall Enterprise Server and the Heimdall-Lite version. Both share the same frontend but have been produced to meet different needs and use-cases.

### Features

|                                                              | [Heimdall-Lite](https://github.com/mitre/heimdall-lite/) |        [Heimdall](https://github.com/mitre/heimdall/)        |
| :----------------------------------------------------------- | :------------------------------------------------------: | :----------------------------------------------------------: |
| Installation Requirements                                    |                      any web server                      |           rails 5.x Server <br /> Postgres Server            |
| Overview Dashboard & Counts                                  |                            x                             |                              x                               |
| 800-53 Partition and TreeMap View                            |                            x                             |                              x                               |
| Data Table / Control Summary                                 |                            x                             |                              x                               |
| InSpec Code / Control Viewer                                 |                            x                             |                              x                               |
| SSP Content Generator                                        |                                                          |                              x                               |
| PDF Report and Print View                                    |                            x                             |                              x                               |
| Users & Roles & multi-team support                           |                                                          |                              x                               |
| Authentication & Authorization                               |                    Hosting Webserver                     | Hosting Webserver<br />LDAP<br />OAuth Support for:<br /> GitHub, GitLab, Google, and Okta. |
| Advanced Data / Filters for Reports and Viewing              |                                                          |                              x                               |
| Multiple Report Output<br />(DISA Checklist XML, CAT, XCCDF-Results, and more) |                                                          |                              x                               |
| Authenticated REST API                                       |                                                          |                              x                               |
| InSpec Run 'Delta' View                                      |                                                          |                              x                               |
| Multi-Report Tagging, Filtering and Delta View               |                                                          |                              x                               |

### Use Cases

| [Heimdall-Lite](https://github.com/mitre/heimdall-lite/) | [Heimdall](https://github.com/mitre/heimdall/)           |
| :------------------------------------------------------- | :------------------------------------------------------- |
| Ship the App & Data via simple Email                     | Multiple Teams Support                                   |
| Minimal Footprint & Deployment Time                      | Timeline and Report History                              |
| Local or disconnected Use                                | Centralized Deployment Model                             |
| One-Time Quick Reviews                                   | Need to view the delta between one or more runs          |
| Decentralized Deployment                                 | Need to view subsets of the 800-53 control alignment     |
| Minimal A&A Time                                         | Need to produce more complex reports in multiple formats |



## Getting Started / Installation

### Heimdall Lite

Heimdall Lite is published to npmjs.org and is available [here](https://www.npmjs.com/package/heimdall-lite).

#### Running via npm

To run Heimdall Lite locally, just use the `npm` built-in utility `npx`: 

```bash
npx heimdall-lite
```

If you use this tool often and want to have it installed locally, use the following command: 

```bash
npm install -g heimdall-lite
```

Then, any subsequent `npx heimdall-lite` will use the local version and load much more quickly.

#### Running via Docker

It is also possible to run heimdall-lite using Docker, using the following command:

```bash
docker run -d -p 8080:80 mitre/heimdall-lite:release-latest
```

You can then access heimdall-lite at [`http://localhost:8080`](http://localhost:8080).

If you would prefer to run the bleeding edge version of heimdall-lite, replace `mitre/heimdall-lite:release-latest` with `mitre/heimdall-lite:latest`.

---

### Heimdall Server - Docker

Given that Heimdall requires at least a database service, we use Docker and Docker Compose to provide a simple deployment experience.

#### Setup Docker Container (Clean Install)

1. Install Docker

2. Download and extract the most recent heimdall release from our [releases page](https://github.com/mitre/heimdall2/releases).

3. Navigate to the base folder where `docker-compose.yml` is located

4. Run the following commands in a terminal window from the heimdall source directory:
   1. ```bash
      ./setup-docker-secrets.sh
      ```
   
   2. ```bash
      docker-compose up -d
      ```
   
6. Navigate to  [`http://127.0.0.1:3000`](http://127.0.0.1:3000).

#### Running Docker Container

Make sure you have run the setup steps at least once before following these steps!

1. Run the following command in a terminal window:
   
   - ```bash
     docker-compose up -d
     ```
2. Go to `127.0.0.1:3000` in a web browser

#### Updating Docker Container

A new version of the docker container can be retrieved by running:

```bash
docker-compose pull
docker-compose up -d
```

This will fetch the latest version of the container, redeploy if a newer version exists, and then apply any database migrations if applicable. No data should be lost by this operation.

#### Stopping the Container

From the source directory you started from run:

```bash
docker-compose down
```

---

### Heimdall Server - Native

If you have your own database service, and would like to run Heimdall on your own server, you can do that as well. Instructions are only provided for a distributions with apt as a package manager (such as [Ubuntu Server](https://ubuntu.com/download/server)), however, the steps are the same for other distributions after installing dependencies.  

1. Install system dependencies:

   - ```bash
     sudo apt install postgresql nodejs wget nano
     sudo npm install -g yarn
     ```

2. Download and extract the most recent release from our [releases page](https://github.com/mitre/heimdall2/releases) using wget:

   - ```bash
     wget <url>
     unzip <filename>
     ```

3. Create the Postgres role:

   - ```sql
     # Start the Postgres terminal
     psql postgres
     
     # Create the user
     CREATE USER <username> with encrypted password '<password>';
     ALTER USER <username> CREATEDB;
     \q
     ```

4. Install project dependencies:

   - ```bash
     cd <directory>
     yarn install
     ```

5. Edit your .env file:

   - ```bash
     nano apps/backend/.env-example
     # Replace the comments with your values, if you want the default value, you can delete the line.
     mv apps/backend/.env-example apps/backend/.env
     ```

6. Build  and start the app:

   - ```
     yarn build
     yarn start
     ```

7. Heimdall server is now running. You can visit Heimdall on your server's IP on port 3000, unless you used a different port.



## API Usage

API usage only works when using Heimdall Enterprise Server (AKA "Server Mode").

Proper API documentation does not exist yet. In the meantime here are quick instructions for uploading evaluations to Heimdall Server.

```sh
# Create a user (only needs to be done once)
curl -X POST -H "Content-Type: application/json" -d '{"email": "user@example.com", "password": "password", "passwordConfirmation": "password", "role": "user" }' http://localhost:3000/users
# Log in
curl -X POST -H "Content-Type: application/json" -d '{"email": "user@example.com", "password": "password" }' http://localhost:3000/authn/login
# The previous command returns a Bearer Token that needs to get placed in the following command
# Upload evaluation
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer bearertokengoeshere" -d "@/home/example/Desktop/test.json" http://localhost:8000/evaluations
```



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
    \q

Then, the following one-time steps must be performed:

    cp apps/backend/.env-example apps/backend/.env
    # Edit /apps/backend/.env to reflect the appropriate configuration for your system
    yarn backend sequelize-cli db:create
    yarn backend sequelize-cli db:migrate
    yarn backend sequelize-cli db:seed:all

Once the above steps are completed it is possible to start heimdall-server using the following command

    yarn run start:dev

### Developing Heimdall Lite Standalone

    yarn frontend start:dev

### Lint and fix files

    yarn run lint

### Compile and minify the frontend and backend for production

    yarn run build

### Run tests

    # Run Frontend Vue Tests
    yarn frontend test
    # Run Backend Nest Tests
    yarn backend test:e2e
    yarn backend test:ci-cov

#### Run Cypress End to End Tests

The application includes E2E frontend + Backend tests (built using the [cypress.io](https://www.cypress.io/) framework). These perform automated checking that Heimdall Server is running as intended. In order to run these tests, a running instance of the application is required.

    CYPRESS_TESTING=true yarn start:dev
    CYPRESS_BASE_URL=http://localhost:8080 yarn test:ui:open

The first command will start an instance of Heimdall Server and exposes additional routes required to allow the tests to run. The second will open the Cypress UI which will run the tests any time code changes are made.

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
