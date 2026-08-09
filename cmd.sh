#!/bin/sh
set -e
# ADR-006 §11: libuv reads UV_THREADPOOL_SIZE at first threadpool use, before
# app config loads — set it in the process environment (defense in depth with
# the Dockerfile ENV; also covers non-container invocations of this script).
export UV_THREADPOOL_SIZE="${UV_THREADPOOL_SIZE:-8}"
yarn backend sequelize db:migrate
yarn backend sequelize db:seed:all
yarn backend start
