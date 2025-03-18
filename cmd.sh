#!/bin/sh
set -e
yarn backend sequelize-cli db:migrate
yarn backend sequelize-cli db:seed:all
# TODO: make this flag based on an envfile
yarn backend start:fips
