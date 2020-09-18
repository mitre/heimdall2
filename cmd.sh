#!/bin/bash
set -e
yarn backend sequelize-cli db:migrate
yarn backend sequelize-cli db:seed:all
node main.js
