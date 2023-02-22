ARG BASE_CONTAINER=node:16-alpine

FROM $BASE_CONTAINER as builder

ARG YARNREPO_MIRROR=https://registry.yarnpkg.com
ENV YARNREPO=$YARNREPO_MIRROR

WORKDIR /src
USER 0

COPY package.json yarn.lock lerna.json tsconfig.json .prettierrc ./
COPY apps ./apps
COPY libs ./libs
RUN apk add python3 make g++
RUN sed -i s^https://registry.yarnpkg.com^$YARNREPO^g yarn.lock
RUN yarn install --frozen-lockfile --production --network-timeout 600000

RUN yarn run build

### Production image

FROM $BASE_CONTAINER as app

WORKDIR /app
# The permissions setting is to ensure that the user cannot modify the files accidentally and can't be read, executed or changed by another account.  Removing these permissions doesn't improve image size or performance meaningfully, but keeping them adds a potential safeguard.
COPY --from-builder --chown= --chmod=0400 ./package.json ./
COPY --from=builder --chown= --chmod=0400 /src/apps/frontend/package.json apps/frontend/
COPY --from=builder --chown= --chmod=0400 /src/libs/interfaces/package.json libs/interfaces/
COPY --from=builder --chown= --chmod=0500 /src/libs/password-complexity/ libs/password-complexity/
COPY --from=builder --chown= --chmod=0500 /src/apps/backend/package.json apps/backend/
COPY --from=builder --chown= --chmod=0500 /src/apps/backend/node_modules apps/backend/node_modules
COPY --from=builder --chown= --chmod=0500 /src/apps/backend/dist apps/backend/dist
COPY --from=builder --chown= /src/dist/ dist/
COPY --from=builder --chown= --chmod=0500 /src/apps/backend/.sequelizerc /app/apps/backend/
COPY --from=builder --chown= --chmod=0500 /src/apps/backend/db /app/apps/backend/db
COPY --from=builder --chown= --chmod=0500 /src/apps/backend/config /app/apps/backend/config
COPY --from=builder --chown= --chmod=0500 /src/apps/backend/migrations /app/apps/backend/migrations
COPY --from=builder --chown= --chmod=0500 /src/apps/backend/seeders /app/apps/backend/seeders


EXPOSE 3000

COPY --chmod=555 cmd.sh /usr/local/bin/

USER node

CMD ["/usr/local/bin/cmd.sh"]
