FROM node:lts as builder

WORKDIR /src
USER 0

COPY package.json ./
COPY lerna.json ./

COPY apps ./apps

RUN npm install -g lerna
RUN npx lerna bootstrap --hoist --ci
RUN npx lerna run build

### Production image

FROM node:lts-slim as app

WORKDIR /app

COPY package.json lerna.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
RUN npx lerna bootstrap --hoist --ci -- --production --no-optional 


COPY --from=builder /src/dist/ /app/dist/
COPY apps/backend/.sequelizerc /app/apps/backend/
COPY apps/backend/migrations /app/apps/backend/migrations
COPY apps/backend/seeders /app/apps/backend/seeders

WORKDIR /app/dist/server

EXPOSE 3000

COPY entrypoint.sh /usr/local/bin/
ENTRYPOINT ["sh", "/usr/local/bin/entrypoint.sh"]

CMD ["node", "main.js"]
