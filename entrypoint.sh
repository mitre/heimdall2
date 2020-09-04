#!/bin/bash
set -e


if [ "$1" = 'node' ]; then

    export DATABASE_USERNAME=${DATABASE_USERNAME:=postgres}
    export DATABASE_NAME=${DATABASE_NAME:=postgres} 
    export JWT_SECRET=${JWT_SECRET:-$(openssl rand -hex 64)}
    export JWT_EXPIRE_TIME=${JWT_EXPIRE_TIME:-60s}

    echo "
    HEIMDALL_SERVER_PORT=$HEIMDALL_SERVER_PORT
    DATABASE_HOST=$DATABASE_HOST
    DATABASE_PORT=$DATABASE_PORT
    DATABASE_USERNAME=$DATABASE_USERNAME
    DATABASE_PASSWORD=$DATABASE_PASSWORD
    DATABASE_NAME=$DATABASE_NAME
    JWT_SECRET=$JWT_SECRET
    JWT_EXPIRE_TIME=$JWT_EXPIRE_TIME
    NODE_ENV=$NODE_ENV
    " >> /app/dist/server/.env

    npx lerna exec "npx sequelize-cli db:migrate" --scope heimdall-server
fi
exec "$@"
