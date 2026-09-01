# Heimdall Backend

Login-provider logos except SAML are sourced from SVG Repo and covered by its Logo License or MIT License: https://www.svgrepo.com/page/licensing/. The SAML logo is sourced from [Worldvectorlogo](https://worldvectorlogo.com/logo/saml-1).

Create the database by setting the appropriate environment variables found in `.env-example` in `.env`

Run the following to create, migrate, and seed the database:
* `npx yarn sequelize db:create`
* `npx yarn sequelize db:migrate`
* `npx yarn sequelize db:seed`

Run the application `npm run start`
