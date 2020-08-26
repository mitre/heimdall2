# Heimdall2k

This repository contains the source code for the Heimdall 2 Backend and Frontend (Heimdall-Lite).

## How to Install

This project uses [Lerna](https://lerna.js.org/) (multi-project manager) to manage dependencies and run the applications. Installing dependencies can be done by running

    npm install
    npx lerna bootstrap

## How to Run

#### Heimdall Server + Frontend Development

In order to run Heimdall Server, Postgresql must be installed and the following one-time steps must be performed:

    cp apps/backend/.env-example apps/backend/.env
    npx lerna exec "npx sequelize-cli db:create" --scope heimdall-server
    npx lerna exec "npx sequelize-cli db:migrate" --scope heimdall-server

Once the above steps are completed it is possible to start heimdall-server using the following command

    npm run start:dev

#### Heimdall Lite Standalone

    npm run lite:dev

# License

NOTICE

© 2019-2020 The MITRE Corporation.

Approved for Public Release; Distribution Unlimited. Case Number 18-3678.
NOTICE

MITRE hereby grants express written permission to use, reproduce, distribute, modify, and otherwise leverage this software to the extent permitted by the licensed terms provided in the LICENSE.md file included with this project.
NOTICE

This software was produced for the U. S. Government under Contract Number HHSM-500-2012-00008I, and is subject to Federal Acquisition Regulation Clause 52.227-14, Rights in Data-General.

No other use other than that granted to the U. S. Government, or to those acting on behalf of the U. S. Government under that Clause is authorized without the express written permission of The MITRE Corporation.

For further information, please contact The MITRE Corporation, Contracts Management Office, 7515 Colshire Drive, McLean, VA 22102-7539, (703) 983-6000.
