ARG BASE_CONTAINER=registry.access.redhat.com/ubi8/nodejs-18-minimal:1

FROM $BASE_CONTAINER as builder

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

ARG YARNREPO_MIRROR=https://registry.yarnpkg.com
ENV YARNREPO=$YARNREPO_MIRROR

USER 0
WORKDIR /src

# python3/make/compiler is a requirement for node-gyp
RUN curl -sL https://dl.yarnpkg.com/rpm/yarn.repo -o /etc/yum.repos.d/yarn.repo && microdnf install -y python3 make gcc-c++ yarn && microdnf clean all && rm -rf /mnt/rootfs/var/cache/* /mnt/rootfs/var/log/dnf* /mnt/rootfs/var/log/yum.*

COPY package.json yarn.lock lerna.json tsconfig.json postcss.config.js ./
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

FROM $BASE_CONTAINER as app

EXPOSE 3000

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

USER 0
WORKDIR /app

RUN curl -sL https://dl.yarnpkg.com/rpm/yarn.repo -o /etc/yum.repos.d/yarn.repo && microdnf install -y yarn && microdnf clean all && rm -rf /mnt/rootfs/var/cache/* /mnt/rootfs/var/log/dnf* /mnt/rootfs/var/log/yum.*

COPY --from=builder /src/package.json ./
COPY --from=builder /src/apps/backend/package.json apps/backend/

COPY --from=builder /src/apps/backend/node_modules apps/backend/node_modules
COPY --from=builder /src/apps/backend/.sequelizerc apps/backend/
COPY --from=builder /src/apps/backend/db apps/backend/db
COPY --from=builder /src/apps/backend/config apps/backend/config
COPY --from=builder /src/apps/backend/migrations apps/backend/migrations
COPY --from=builder /src/apps/backend/seeders apps/backend/seeders

COPY --from=builder /src/libs/password-complexity/ libs/password-complexity

COPY --from=builder /src/apps/backend/dist apps/backend/dist
COPY --from=builder /src/dist/ dist/

RUN chown -R 1001 .

COPY cmd.sh /usr/local/bin/
RUN chmod 755 /usr/local/bin/cmd.sh

USER 1001

CMD ["/usr/local/bin/cmd.sh"]
