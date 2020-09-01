#!/bin/bash
set -e


if [ "$1" = 'node' ]; then
    echo "
    HEIMDALL_SERVER_PORT=$HEIMDALL_SERVER_PORT
    DATABASE_HOST=$DATABASE_HOST
    DATABASE_PORT=$DATABASE_PORT
    DATABASE_USERNAME=$DATABASE_USERNAME
    DATABASE_PASSWORD=$DATABASE_PASSWORD
    DATABASE_NAME=$DATABASE_NAME
    JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 32)}
    JWT_EXPIRE_TIME=${JWT_EXPIRE_TIME:-60s}
    NODE_ENV=$NODE_ENV
    " >> /app/dist/server/.env

    npx lerna exec "npx sequelize-cli db:migrate" --scope heimdall-server
fi
exec "$@"
