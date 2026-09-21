#!/bin/sh
set -e
yarn backend sequelize db:migrate
yarn backend sequelize db:seed:all
yarn backend start
