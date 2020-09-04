# Heimdall Enterprise Server 2.0

This repository contains the source code for the Heimdall 2 Backend and Frontend (Heimdall-Lite).

## How to Install

This project uses [Lerna](https://lerna.js.org/) (multi-project manager) to manage dependencies and run the applications. Installing dependencies can be done by running

    npm install -g lerna
    npx lerna bootstrap --hoist

## How to Run

#### Heimdall Server + Frontend Development

In order to run Heimdall Server, Postgresql must be installed and the following one-time steps must be performed:

    cp apps/backend/.env-example apps/backend/.env
    # Edit /apps/backend/.env to reflect the appropriate configuration for your system
    npx lerna exec "npx sequelize-cli db:create" --scope heimdall-server
    npx lerna exec "npx sequelize-cli db:migrate" --scope heimdall-server

Once the above steps are completed it is possible to start heimdall-server using the following command

    npm run start:dev

#### Heimdall Lite Standalone

    npm run lite:dev


### Run With Docker

Given that Heimdall requires at least a database service, we use Docker Compose.

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

##### Updating Docker Container

A new version of the docker container can be retrieved by running:

```
docker-compose pull
docker-compose up -d
```

This will fetch the latest version of the container, redeploy if a newer version exists, and then apply any database migrations if applicable. No data should be lost by this operation.

##### Stopping the Container

`docker-compose down` # From the source directory you started from


# License

### NOTICE

© 2019-2020 The MITRE Corporation.

Approved for Public Release; Distribution Unlimited. Case Number 18-3678.

### NOTICE

MITRE hereby grants express written permission to use, reproduce, distribute, modify, and otherwise leverage this software to the extent permitted by the licensed terms provided in the LICENSE.md file included with this project.

### NOTICE

This software was produced for the U. S. Government under Contract Number HHSM-500-2012-00008I, and is subject to Federal Acquisition Regulation Clause 52.227-14, Rights in Data-General.

No other use other than that granted to the U. S. Government, or to those acting on behalf of the U. S. Government under that Clause is authorized without the express written permission of The MITRE Corporation.

For further information, please contact The MITRE Corporation, Contracts Management Office, 7515 Colshire Drive, McLean, VA 22102-7539, (703) 983-6000.
