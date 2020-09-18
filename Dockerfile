FROM node:lts as builder

WORKDIR /src
USER 0

COPY package.json yarn.lock lerna.json ./
COPY apps ./apps
COPY libs ./libs
COPY tsconfig.json .

RUN yarn --frozen-lockfile

RUN yarn run build

### Production image

FROM node:lts-slim as app

WORKDIR /app

COPY package.json yarn.lock lerna.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY libs/interfaces/package.json libs/interfaces/
RUN yarn --production=true --frozen-lockfile

COPY --from=builder /src/dist/ /app/dist/
COPY apps/backend/.sequelizerc /app/apps/backend/
COPY apps/backend/migrations /app/apps/backend/migrations
COPY apps/backend/seeders /app/apps/backend/seeders

WORKDIR /app/dist/server

EXPOSE 3000

COPY cmd.sh /usr/local/bin/
RUN chmod 755 /usr/local/bin/cmd.sh

USER node

CMD ["/usr/local/bin/cmd.sh"]
