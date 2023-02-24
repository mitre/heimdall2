ARG BASE_CONTAINER=node:16-alpine

FROM $BASE_CONTAINER as builder

ARG YARNREPO_MIRROR=https://registry.yarnpkg.com
ENV YARNREPO=$YARNREPO_MIRROR

WORKDIR /src

RUN apk update && apk upgrade

##find a way to add these into a folder and extract its contents to root
COPY --link package.json yarn.lock lerna.json tsconfig.json .prettierrc ./
COPY --link apps ./apps
COPY --link libs ./libs
##run all of these together?
RUN apk add python3 make g++
RUN sed -i s^https://registry.yarnpkg.com^$YARNREPO^g yarn.lock
RUN yarn install --frozen-lockfile --production --network-timeout 600000
RUN yarn run build

### Production image

FROM $BASE_CONTAINER as app

RUN apk update && apk upgrade

EXPOSE 3000

WORKDIR /app
# The permissions setting is to ensure that the user cannot modify the files accidentally and can't be read, executed or changed by another account.  Removing these permissions doesn't improve image size or performance meaningfully, but keeping them adds a potential safeguard.#or performance, but keeping them adds a potential safeguard
COPY --from=builder --chown=node --chmod=0400 --link /src/package.json ./
COPY --from=builder --chown=node --chmod=0400 --link /src/apps/frontend/package.json apps/frontend/
COPY --from=builder --chown=node --chmod=0400 --link /src/libs/interfaces/package.json libs/interfaces/
COPY --from=builder --chown=node --chmod=0500 --link /src/libs/password-complexity/ libs/password-complexity/
COPY --from=builder --chown=node --chmod=0500 --link /src/apps/backend/package.json /src/apps/backend/.sequelizerc apps/backend/
COPY --from=builder --chown=node --chmod=0500 --link /src/apps/backend/node_modules apps/backend/node_modules
COPY --from=builder --chown=node --chmod=0500 --link /src/apps/backend/dist apps/backend/dist
COPY --from=builder --chown=node --link /src/dist/ dist/
COPY --from=builder --chown=node --chmod=0500 --link /src/apps/backend/db apps/backend/db
COPY --from=builder --chown=node --chmod=0500 --link /src/apps/backend/config apps/backend/config
COPY --from=builder --chown=node --chmod=0500 --link /src/apps/backend/migrations apps/backend/migrations
COPY --from=builder --chown=node --chmod=0500 --link /src/apps/backend/seeders apps/backend/seeders
COPY --chmod=555 cmd.sh /usr/local/bin/

USER node

CMD ["/usr/local/bin/cmd.sh"]
