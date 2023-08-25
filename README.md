# Heimdall

![Run E2E Backend + Frontend Tests](https://github.com/mitre/heimdall2/workflows/Run%20E2E%20Backend%20+%20Frontend%20Tests/badge.svg) ![Run Frontend Tests](https://github.com/mitre/heimdall2/workflows/Run%20Frontend%20Tests/badge.svg) ![Run Backend Tests](https://github.com/mitre/heimdall2/workflows/Run%20Backend%20Tests/badge.svg)

This repository contains the source code for Heimdall's [Backend](https://github.com/mitre/heimdall2/tree/master/apps/backend), [Frontend (AKA Heimdall Lite)](https://github.com/mitre/heimdall2/tree/master/apps/frontend), [HDF Converters](https://github.com/mitre/heimdall2/tree/master/libs/hdf-converters), and [InSpecJS](https://github.com/mitre/heimdall2/tree/master/libs/inspecjs).

## Contents

- [Heimdall](#heimdall)
  - [Contents](#contents)
  - [Demos](#demos)
    - [Video](#video)
    - [Hosted](#hosted)
      - [*These demos are only intended to show the functionality of Heimdall, please do not upload any sensitive data to them.*](#these-demos-are-only-intended-to-show-the-functionality-of-heimdall-please-do-not-upload-any-sensitive-data-to-them)
      - [Released Previews](#released-previews)
      - [Current *Development Master Branch* Preview](#current-development-master-branch-preview)
  - [Heimdall (Lite) vs Heimdall with Backend (Server)](#heimdall-lite-vs-heimdall-with-backend-server)
    - [Heimdall-Lite](#heimdall-lite)
    - [Heimdall with Backend (Server)](#heimdall-with-backend-server)
    - [Features](#features)
    - [Use Cases](#use-cases)
  - [Getting Started / Installation](#getting-started--installation)
    - [Heimdall Lite](#heimdall-lite-1)
      - [Running via npm](#running-via-npm)
      - [Running via Docker](#running-via-docker)
    - [Heimdall Server - Docker](#heimdall-server---docker)
      - [Setup Docker Container (Clean Install)](#setup-docker-container-clean-install)
      - [Updating Docker Container](#updating-docker-container)
      - [Stopping the Container](#stopping-the-container)
      - [Helm Chart](#helm-chart)
      - [Running via Cloud.gov](#running-via-cloudgov)
  - [External Data Sources (Interfaces)](#external-data-sources-interfaces)
    - [AWS S3](#aws-s3)
    - [Splunk](#splunk)
    - [Tenable.SC](#tenablesc)
  - [API Usage](#api-usage)
  - [For Developers](#for-developers)
    - [How to Install](#how-to-install)
    - [Debugging Heimdall Server](#debugging-heimdall-server)
    - [Developing Heimdall Lite Standalone](#developing-heimdall-lite-standalone)
    - [Lint and fix files](#lint-and-fix-files)
    - [Compile and minify the frontend and backend for production](#compile-and-minify-the-frontend-and-backend-for-production)
    - [Run tests](#run-tests)
      - [Run Cypress End to End Tests](#run-cypress-end-to-end-tests)
    - [Creating a Release](#creating-a-release)
  - [Versioning and State of Development](#versioning-and-state-of-development)
  - [Contributing, Issues and Support](#contributing-issues-and-support)
    - [Contributing](#contributing)
    - [Issues and Support](#issues-and-support)

## Demos

### Video

![](https://github.com/mitre/docs-mitre-inspec/raw/master/images/Heimdall_demo.gif)

### Hosted

#### *These demos are only intended to show the functionality of Heimdall, please do not upload any sensitive data to them.*

#### Released Previews
[Heimdall Lite](https://heimdall-lite.mitre.org) | [Heimdall Server](https://heimdall-demo.mitre.org/) &nbsp;&nbsp;
<a href="https://pages.github.com/">
<picture>
   <source media="(prefers-color-scheme: dark)" srcset="apps/frontend/src/assets/GitHub-Mark-Light-64px.png">
   <source media="(prefers-color-scheme: light)" srcset="apps/frontend/src/assets/GitHub-Mark-64px.png">
    <img alt="Github Logo" src="apps/frontend/src/assets/GitHub-Mark-64px.png" height="25">
</picture>
</a>


#### Current *Development Master Branch* Preview
[Heimdall Lite](https://heimdall-lite.netlify.com/) &nbsp;&nbsp; <a href="https://www.netlify.com">
<picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://www.netlify.com/v3/img/components/full-logo-dark-simple.svg">
   <source media="(prefers-color-scheme: light)" srcset="https://www.netlify.com/v3/img/components/full-logo-light-simple.svg">
   <img alt="Netlify Logo" src="https://www.netlify.com/v3/img/components/full-logo-dark-simple.svg" height="25">
</picture>
</a> 
<br />

[Heimdall Server](https://mitre-heimdall-staging.herokuapp.com/) &nbsp;&nbsp; <a href="https://www.heroku.com/"><img src="https://www.herokucdn.com/deploy/button.svg" height="25"/></a>

## Heimdall (Lite) vs Heimdall with Backend (Server)

There are two ways to deploy the MITRE Heimdall application - Heimdall-Lite and the full Heimdall with Backend Server. Both share the same frontend but have been produced to meet different needs and use-cases.

### Heimdall-Lite

As a single-page javascript app - you can run Heimdall-Lite from any web-server, a _secured_ S3 bucket or directly via GitHub Pages (as it is here). Heimdall-Lite gives you the ability to easily review and produce reports about your InSpec run, filter the results for easy review and hot-wash, print out reports, and much more.

### Heimdall with Backend (Server)

Heimdall with Backend, or Heimdall Server runs the same front end as Heimdall-Lite, but is supported with a backend database to store persistent data overtime.

### Features
| Features | Heimdall-Lite | Heimdall with Backend |
| :----------------------------------------------------------- | :------------------------------------------------------: | :----------------------------------------------------------: |
| Additional Installation Requirements    |      |     Postgres Server |
| Overview Dashboard & Counts | :white_check_mark: | :white_check_mark: |
| Deep Dive View of Security Control Results and Metadata | :white_check_mark: | :white_check_mark: |
| 800-53 Partition and TreeMap View     | :white_check_mark: | :white_check_mark: |
| Comparison View      | :white_check_mark: | :white_check_mark: |
| Advanced Data / Filters for Reports and Viewing     | :white_check_mark: |  :white_check_mark: |
| Multiple Report Output<br />(DISA Checklist XML, CAT, XCCDF-Results, and more) | :white_check_mark: | :white_check_mark: |
| View Multiple Guidance Formats (InSpec profile, Checklist, DISA & CIS XCCDF) | :white_check_mark: | :white_check_mark: |
| Automatic Conversion of [Various Security Formats](https://saf-cli.mitre.org/) | :white_check_mark: | :white_check_mark: |
| Authenticated REST API       |   | :white_check_mark: |
| CRUD Capabilities            |   | :white_check_mark: |
| Users & Roles & multi-team support    |   | :white_check_mark: |
| Authentication & Authorization        | Hosting Webserver | Hosting Webserver<br />LDAP<br />OAuth Support for:<br /> GitHub, GitLab, Google, and Okta. |

### Use Cases

| Heimdall-Lite | Heimdall with Backend  |
| :------------------------------------------------------: | :------------------------------------------------------: |
| Just-in-Time Use | Multiple Teams |
| Minimal Footprint & Deployment Time  | Timeline and Report History |
| Local or Disconnected Use | Centralized Deployment Model |
| Minimal Authorization & Approval Time |  |

## Getting Started / Installation

### Heimdall Lite

Heimdall Lite is published to npmjs.org and is available [here](https://www.npmjs.com/package/heimdall-lite).

#### Running via npm

To run Heimdall Lite locally, just use the `npm` built-in utility `npx`:

```bash
npx @mitre/heimdall-lite
```

If you use this tool often and want to have it installed locally, use the following command:

```bash
npm install -g @mitre/heimdall-lite
```

Then, any subsequent `npx @mitre/heimdall-lite` will use the local version and load much more quickly.

#### Running via Docker

It is also possible to run Heimdall-Lite using Docker, using the following command:

```bash
docker run -d -p 8080:80 mitre/heimdall-lite:release-latest
```

You can then access Heimdall-Lite at [`http://localhost:8080`](http://localhost:8080).

If you would prefer to run the bleeding edge version of Heimdall-Lite, replace `mitre/heimdall-lite:release-latest` with `mitre/heimdall-lite:latest`.

---

### Heimdall Server - Docker

Given that Heimdall requires at least a database service, we use Docker and Docker Compose to provide a simple deployment experience. This process will also deploy an NGINX webserver in front of Heimdall to handle TLS.

Heimdall's frontend container image is distributed on [DockerHub](https://hub.docker.com/r/mitre/heimdall2), and on [Iron Bank](https://ironbank.dso.mil/repomap/details;registry1Path=mitre%252Fsaf%252Fheimdall2).

#### Setup Docker Container (Clean Install)

1. Install Docker

2. Download and extract the most recent Heimdall release from our [releases page](https://github.com/mitre/heimdall2/releases). Alternatively, you can clone this repository and navigate to the `heimdall2` folder.

3. Navigate to the base folder where `docker-compose.yml` is located

4. By default Heimdall will generate self-signed certificates that will last for 7 days. For production use, place your certificate files in `./nginx/certs/` with the names `ssl_certificate.crt` and `ssl_certificate_key.key` respectively. For development use, you can use the default generated certificates which means you do not need to put any certificate files in the `./nginx/certs/` folder.

*NGINX Configuration Note: You can configure NGINX settings by changing values in the `nginx/conf/default.conf` file.*

5. Run the following commands in a terminal window from the Heimdall source directory. For more information on the .env file, visit [Environment Variables Configuration.](https://github.com/mitre/heimdall2/wiki/Environment-Variables-Configuration)
   - ```bash
     ./setup-docker-env.sh
     # If you would like to further configure your Heimdall instance, edit the .env file generated after running the previous line
     docker-compose up
     ```

6. Navigate to [`https://127.0.0.1`](http://127.0.0.1). You should see the application's login page. (Note that if you used the option to generate your own self-signed certs, you will get warnings about them from your browser.) 

#### Updating Docker Container

> **Starting with version 2.5.0, Heimdall on Docker uses SSL by default. Place your certificate files in `./nginx/certs/` with the names `ssl_certificate.crt` and `ssl_certificate_key.key` respectively.**

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

#### Helm Chart

<https://github.com/mitre/heimdall2-helm>

#### Running via Cloud.gov

Cloud.gov is a [FEDRAMP moderate Platform-as-a-Service (PaaS)](https://marketplace.fedramp.gov/#!/product/18f-cloudgov?sort=productName). This repository includes a sample [manifest.yml.example](manifest.yml.example) file ready to be pushed and run the latest version of Heimdall2 as a container. Make a copy of the example file and update the key values as appropriate.
`$ cp manifest.yml.example manifest.yml`

1. Setup a cloud.gov account - https://cloud.gov/docs/getting-started/accounts/ 

2. Install the cf-cli - https://cloud.gov/docs/getting-started/setup/

3. Run the following commands in a terminal window from the Heimdall source directory.
```
$ cd ~/Documents/Github/Heimdall2
$ cf login -a api.fr.cloud.gov  --sso 
# Follow the link to copy the Temporary Authentication Code when prompted
```

4. Setup a demo application space
```
$ cf target -o sandbox-rename create-space heimdall2-rename
```

5. Create a postgresql database
```
# Update manifest.yml file to rename application and database key name
$ cf marketplace
$ cf create-service aws-rds medium-psql heimdall2-rename
$ cf create-service-key heimdall2-db-rename heimdall2-db-test-key
$ cf push
```

**You should be returned the URL for your new test instance to navigate to.**

> Note: This is only for demonstration purposes, in order to run a production level federal/FISMA system. You will need to contact the [cloud.gov program](https://cloud.gov) and consult your organization's security team (for risk assessment and an Authority to Operate).

## External Data Sources (Interfaces)

Heimdall currently provides connectivity to the following services for importing and visualizing scans:
  - AWS S3
  - Splunk
  - Tenable.SC

### AWS S3

For detail information on how to setup and connect to an `AWS S3` bucket see the [Heimdall Interface Connection - AWS S3 Wiki](https://github.com/mitre/heimdall2/wiki/Heimdall-Interface-Connections#aws-s3)

### Splunk

For detail information on how to setup and connect to an `Splunk` instances (logical or virtual) see the [Heimdall Interface Connection - Splunk Wiki](https://github.com/mitre/heimdall2/wiki/Heimdall-Interface-Connections#splunk)

### Tenable.SC

For detail information on how to setup and connect to an `Tenable.SC` instance see the [Heimdall Interface Connection - Tenable.SC Wiki](https://github.com/mitre/heimdall2/wiki/Heimdall-Interface-Connections#tenablesc)


## API Usage

API usage only works when using Heimdall Enterprise Server (AKA "Server Mode").

Heimdall API documentation is being compiled and it is located in this  [wiki](https://github.com/mitre/heimdall2/wiki/Heimdall-API-Documentation) page. In the meantime here are quick instructions for uploading evaluations to Heimdall Server.

```sh
# To use API Keys, ensure you have set the API_KEY_SECRET environment variable. To create a secret run: openssl rand -hex 33
# Create an API key using the Heimdall frontend (within the edit user profile modal) and upload an evaluation with the following command
curl -F "data=@<Path to Evaluation File>" -F "filename=<Filename To Show in Heimdall>" -F "public=true/false" -F "evaluationTags=<tag-name>,<another-tag-name>..." -H "Authorization: Api-Key apikeygoeshere" "http://localhost:3000/evaluations"
# You can upload multiple files at once (up to 100)
curl -F "data=@<Path to first evaluation File>" -F "data=@<Path to second evaluation File>" ... -F "public=true/false" -F "evaluationTags=<tag-name>,<another-tag-name>..." -H "Authorization: Api-Key apikeygoeshere" "http://localhost:3000/evaluations"
```

## For Developers

### How to Install

If you would like to change Heimdall to your needs, you can use Heimdall's 'Development Mode' to ease the development process. The benefit to using this mode is that it will automatically rebuild itself and use those changes as soon as you make them. Please note that you should not run development mode when deploying Heimdall for general usage.

1. Install system dependencies with your system's package manager. NodeJS is required and can be installed via your system's package manager, or an alternative method if desired. Documented below is the installation via your system's package manager.

   Ubuntu:

   - ```bash
     # grab nodesource for recent version of nodejs
     sudo curl -sL https://deb.nodesource.com/setup_18.x -o /tmp/nodesource_setup.sh
     sudo bash /tmp/nodesource_setup.sh

     # use apt to install dependencies
     sudo apt install postgresql nodejs git
     sudo apt install nano                        # recommended installation
     sudo npm install -g yarn
     ```
     
   OSX:
   
   - ```bash
     brew install postgresql node@18 git      
     brew install nano                        # recommended installation
     sudo npm install -g yarn
     ```

2. Clone this repository:

   - ```bash
     git clone https://github.com/mitre/heimdall2
     ```

3. Run the Postgres server:

   Ubuntu:
   
   - ```sql
     # Switch to the OS postgres user
     sudo -u postgres -i

     # Start the Postgres terminal
     psql postgres
  
     # Create the database user
     CREATE USER <username> with encrypted password '<password>';
     ALTER USER <username> CREATEDB;
     \q

     # Switch back to your original OS user
     exit
     ```
   OSX:

    - ```sql
      # Start the postgres server corresponding to your installation method
      pg_ctl -D /opt/homebrew/var/postgres start
      # Alternatively, you may find postgres in another location like the following:
      pg_ctl -D /usr/local/var/postgres start
      # Brew method
      brew services start postgresql@13

      # Start the Postgres terminal
      psql postgres
  
      # Create the database user
      CREATE USER <username> with encrypted password '<password>';
      ALTER USER <username> CREATEDB;
      \q

      # Switch back to your original OS user
      exit
      ```   

   
4. Install project dependencies:

   - ```bash
     cd heimdall2
     yarn install
     ```

5. Edit your apps/backend/.env file using the provided `setup-dev-env.sh` script. Make sure to set a DATABASE_USERNAME and DATABASE_PASSWORD that match what you set for the PostgresDB in step 3.

You can also open the apps/backend/.env file in a text editor and set additional optional configuration values. For more info on configuration values see [Enviroment Variables Configuration](https://github.com/mitre/heimdall2/wiki/Environment-Variables-Configuration).

6. Create the database:

   - ```bash
     yarn backend sequelize-cli db:create
     yarn backend sequelize-cli db:migrate
     yarn backend sequelize-cli db:seed:all
     ```

6. Start Heimdall:

   - ```bash
     yarn start:dev
     ```

This will start both the frontend and backend in development mode, meaning any changes you make to the source code will take effect immediately. Please note we already have a Visual Studio Code workspace file you can use to organize your workspace.

### Debugging Heimdall Server

If you are using Visual Studio Code, it is very simple to debug this application locally. First open up the Visual Studio Code workspace and ensure the [Node debuger Auto Attach](https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_auto-attach) feature in Visual Studio Code is enabled. Next, open the integrated Visual Studio Code terminal and run:

```
yarn backend start:debug
```

Visual Studio Code will then automatically attach a debugger and stop and any breakpoints you place in the application.

### Developing Heimdall Lite Standalone

If you only want to make changes to the frontend (heimdall-lite) use the following command:

    yarn frontend start:dev

### Lint and fix files

To validate and lint your code run:

    yarn run lint

### Compile and minify the frontend and backend for production

    yarn build

### Run tests

To test your code to make sure everything still works:

    # Run Frontend Vue Tests
    yarn frontend test
    # Run Backend Nest Tests
    yarn backend test:ci-cov

#### Run Cypress End to End Tests

The application includes E2E frontend + Backend tests (built using the [cypress.io](https://www.cypress.io/) framework). These perform automated checking that Heimdall Server is running as intended. In order to run these tests, a running instance of the application is required.

    CYPRESS_TESTING=true yarn start:dev
    CYPRESS_BASE_URL=http://localhost:8080 yarn test:ui:open

The first command will start an instance of Heimdall Server and exposes additional routes required to allow the tests to run. The second will open the Cypress UI which will run the tests any time code changes are made.

### Creating a Release

**Note:** This action requires appropriate privileges on the repository to perform.

The steps to create a release are now on the [wiki](https://github.com/mitre/heimdall2/wiki/How-to-create-a-Heimdall2-release).

## Versioning and State of Development

This project uses the [Semantic Versioning Policy](https://semver.org/)

## Contributing, Issues and Support

### Contributing

Please feel free to look through our issues, make a fork and submit _PRs_ and improvements. We love hearing from our end-users and the community and will be happy to engage with you on suggestions, updates, fixes or new capabilities.

### Issues and Support

Please feel free to contact us by **opening an issue** on the issue board, or, at [inspec@mitre.org](mailto:inspec@mitre.org) should you have any suggestions, questions or issues. If you have more general questions about the use of our software or other concerns, please contact us at [opensource@mitre.org](mailto:opensource@mitre.org).
