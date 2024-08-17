ARG BASE_CONTAINER=registry.access.redhat.com/ubi8/nodejs-18-minimal:1

FROM $BASE_CONTAINER AS builder

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

ARG YARNREPO_MIRROR=https://registry.npmjs.org
ENV YARNREPO=$YARNREPO_MIRROR

USER 0
WORKDIR /src

# python3/make/compiler is a requirement for node-gyp
RUN curl -sL https://dl.yarnpkg.com/rpm/yarn.repo -o /etc/yum.repos.d/yarn.repo && microdnf install -y python3 make gcc-c++ yarn && microdnf clean all && rm -rf /mnt/rootfs/var/cache/* /mnt/rootfs/var/log/dnf* /mnt/rootfs/var/log/yum.*

COPY package.json yarn.lock nx.json tsconfig.json ./
COPY apps/backend/package.json apps/backend/tsconfig.* ./apps/backend/
COPY apps/frontend/package.json apps/frontend/tsconfig.* ./apps/frontend/
COPY libs/hdf-converters/package.json libs/hdf-converters/tsconfig.* ./libs/hdf-converters/
COPY libs/inspecjs/package.json libs/inspecjs/tsconfig.* ./libs/inspecjs/
COPY libs/interfaces/package.json libs/interfaces/tsconfig.json ./libs/interfaces/
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

RUN curl -sL https://dl.yarnpkg.com/rpm/yarn.repo -o /etc/yum.repos.d/yarn.repo && microdnf install -y yarn && microdnf clean all && rm -rf /mnt/rootfs/var/cache/* /mnt/rootfs/var/log/dnf* /mnt/rootfs/var/log/yum.*

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
