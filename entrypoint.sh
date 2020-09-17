#!/bin/bash
set -e

if [ "$1" = 'node' ]; then

    export DATABASE_USERNAME=${DATABASE_USERNAME:=postgres}

    export JWT_SECRET=${JWT_SECRET:-$(openssl rand -hex 64)}
    export JWT_EXPIRE_TIME=${JWT_EXPIRE_TIME:-60s}

    export MIGRATE_DATABASE=${MIGRATE_DATABASE:-true}
    export SEED_DATABASE=${SEED_DATABASE:-true}

    if [[ ${MIGRATE_DATABASE} == true ]]; then
        yarn backend sequelize-cli db:migrate
    fi

    if [[ ${SEED_DATABASE} == true ]]; then
        yarn backend sequelize-cli db:seed:all
    fi
fi
exec "$@"
