FROM node:lts-alpine as builder

WORKDIR /src
USER 0

COPY package.json yarn.lock lerna.json tsconfig.json .prettierrc ./
COPY apps ./apps
COPY libs ./libs

# https://github.com/kelektiv/node.bcrypt.js/wiki/Installation-Instructions
# This allows for building in offline environments, and according to the
# documentation fixes some segfaults with alpine and node-bcrypt.
ENV npm_config_build_from_source true
RUN apk --no-cache add --virtual builds-deps build-base python

RUN yarn --frozen-lockfile --production

RUN yarn run build

### Production image

FROM node:lts-alpine as app

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
