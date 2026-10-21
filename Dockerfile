# Node.js 22.23.4, bookworm-slim.
ARG BUILD_CONTAINER=node@sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d
# UBI 9.8 minimal.
ARG BASE_CONTAINER=registry.access.redhat.com/ubi9/ubi-minimal@sha256:c4c285d42941ebb2bd4da878479008e1e4536bb599aad1dbe568f89de9053661

FROM $BUILD_CONTAINER AS builder

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

ARG YARNREPO_MIRROR=https://registry.npmjs.org
ENV YARNREPO=$YARNREPO_MIRROR

USER 0
WORKDIR /src

# python3/make/compiler is a requirement for node-gyp
RUN apt-get update && apt-get install -y --no-install-recommends g++ make python3 && rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock lerna.json tsconfig.json postcss.config.js ./
COPY apps/backend/package.json apps/backend/tsconfig.* ./apps/backend/
COPY apps/frontend/package.json apps/frontend/tsconfig.* ./apps/frontend/
COPY libs/hdf-converters/package.json libs/hdf-converters/tsconfig.* ./libs/hdf-converters/
COPY libs/inspecjs/package.json libs/inspecjs/tsconfig.* ./libs/inspecjs/
COPY libs/common/package.json libs/common/tsconfig.json ./libs/common/
COPY libs/password-complexity/package.json ./libs/password-complexity/

RUN sed -i s^https://registry.yarnpkg.com^$YARNREPO^g yarn.lock
RUN yarn install --frozen-lockfile --production --network-timeout 600000

COPY apps ./apps
COPY libs ./libs
RUN yarn build

FROM $BASE_CONTAINER AS app

EXPOSE 3000

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

USER 0
WORKDIR /app

RUN microdnf update -y && microdnf install -y libstdc++ && microdnf clean all

# Use the security-patched upstream runtime; UBI's Node RPM currently lags it.
COPY --from=builder /usr/local/bin/node /usr/local/bin/node
RUN node --version

COPY --from=builder --chown=1001 /src/package.json ./
COPY --from=builder --chown=1001 /src/apps/backend/package.json apps/backend/

COPY --from=builder --chown=1001 /src/apps/backend/node_modules apps/backend/node_modules
COPY --from=builder --chown=1001 /src/apps/backend/.sequelizerc apps/backend/
COPY --from=builder --chown=1001 /src/apps/backend/db apps/backend/db
COPY --from=builder --chown=1001 /src/apps/backend/config apps/backend/config
COPY --from=builder --chown=1001 /src/apps/backend/migrations apps/backend/migrations
COPY --from=builder --chown=1001 /src/apps/backend/seeders apps/backend/seeders

COPY --from=builder --chown=1001 /src/libs/password-complexity/ libs/password-complexity

COPY --from=builder --chown=1001 /src/apps/backend/dist apps/backend/dist
COPY --from=builder --chown=1001 /src/dist/ dist/

COPY --chmod=755 cmd.sh /usr/local/bin/

USER 1001

CMD ["/usr/local/bin/cmd.sh"]
