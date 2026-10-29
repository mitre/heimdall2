ARG BASE_CONTAINER=registry.access.redhat.com/ubi9/ubi-minimal:9.8
# Node.js compiled against UBI libraries (Dockerfile.node). docker-bake.hcl supplies this as a build context.
ARG NODE_CONTAINER=heimdall-node:22

FROM $NODE_CONTAINER AS node

FROM $BASE_CONTAINER AS builder

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

ARG YARNREPO_MIRROR=https://registry.npmjs.org
ENV YARNREPO=$YARNREPO_MIRROR

USER 0
WORKDIR /src

COPY --from=node /usr/ /usr/
# Build native modules against the headers of the node we ship
ENV npm_config_nodedir=/usr

# python3/make/compiler is a requirement for node-gyp
RUN microdnf install -y --setopt=install_weak_deps=0 libbrotli python3 make gcc-c++ \
    && microdnf clean all \
    && npm install -g --ignore-scripts yarn@1.22.22

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

# Change PACKAGE_REFRESH to pick up OS package updates published since the last cached build
ARG PACKAGE_REFRESH=0
RUN echo "package refresh: ${PACKAGE_REFRESH}" \
    && microdnf update -y \
    && microdnf install -y --setopt=install_weak_deps=0 libstdc++ libbrotli zlib \
    && microdnf clean all

COPY --from=node /usr/bin/node /usr/bin/node
COPY --from=node /usr/lib64/libnode.so.* /usr/lib64/
COPY --from=node /usr/share/node-22/icudata /usr/share/node-22/icudata
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
