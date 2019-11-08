# build stage
FROM node:lts-alpine as build-stage
WORKDIR /app
# update npm & install vue cli peer dependencies
RUN npm install -g npm
RUN npm install -g @vue/cli @vue/cli-service @vue/cli-plugin-typescript vue-template-compiler

COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build

# production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]