#!/bin/sh
set -e
cd /app/apps/backend
node node_modules/sequelize-cli/lib/sequelize db:migrate
node node_modules/sequelize-cli/lib/sequelize db:seed:all
exec node dist/src/main
