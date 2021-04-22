ARG BASE_CONTAINER=node:lts-alpine

FROM $BASE_CONTAINER as builder

ARG YARNREPO_MIRROR=https://registry.yarnpkg.com
ENV YARNREPO=$YARNREPO_MIRROR

WORKDIR /src
USER 0

COPY package.json yarn.lock lerna.json tsconfig.json .prettierrc ./
COPY apps ./apps
COPY libs ./libs

RUN sed -i s^https://registry.yarnpkg.com^$YARNREPO^g yarn.lock
RUN yarn --frozen-lockfile --production --network-timeout 600000

RUN yarn run build

### Production image

FROM $BASE_CONTAINER as app

WORKDIR /app

COPY package.json yarn.lock lerna.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY libs/interfaces/package.json libs/interfaces/
COPY --from=builder /src/apps/backend/node_modules apps/backend/node_modules
COPY --from=builder /src/apps/frontend/node_modules apps/frontend/node_modules
COPY --from=builder /src/node_modules node_modules
COPY --from=builder /src/dist/ /app/dist/
COPY apps/backend/.sequelizerc /app/apps/backend/
COPY apps/backend/db /app/apps/backend/db
COPY apps/backend/config /app/apps/backend/config
COPY apps/backend/migrations /app/apps/backend/migrations
COPY apps/backend/seeders /app/apps/backend/seeders

WORKDIR /app/dist/server

EXPOSE 3000

COPY cmd.sh /usr/local/bin/
RUN chmod 755 /usr/local/bin/cmd.sh

USER node

CMD ["/usr/local/bin/cmd.sh"]
