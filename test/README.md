# End-to-end tests

This private Yarn workspace tests the frontend and backend together using Cypress. Run commands below from the repository root with Node 22.18 or later and Yarn 1.

## Layout and coverage

- `e2e/`: feature specs with assertions next to the behavior they verify.
- `support/`: Cypress setup, API authentication, test data, and repeated UI interactions. Helpers are plain functions; one-off interactions stay in specs.
- `services/`: local GitHub/OIDC mocks, the SonarQube fixture shared with converter tests, and Splunk configuration.

| Spec | Scenarios |
| --- | ---: |
| Login, including GitHub, LDAP, OIDC, and logout | 8 |
| Registration | 4 |
| Groups | 4 |
| Database results | 4 |
| Results and severity overrides | 3 |
| Account details and password | 1 |
| Splunk | 2 |
| Custom S3 endpoint | 1 |
| Total | 27 |

## Services

Use a **dedicated disposable database**: the suite clears all application data before every test. Tests against one database must run sequentially. Each test creates its own prerequisites, so specs and individual tests can run independently and be retried.

The [E2E workflow](../.github/workflows/e2e-ui-tests.yml) defines the service images and credentials used by CI:

| Service | Address | Setup |
| --- | --- | --- |
| PostgreSQL | `localhost:5432` | Password `postgres`; database settings come from the backend environment file |
| LDAP | `localhost:10389` | `rroemhild/test-openldap` with the CI bind/search settings |
| Splunk | `https://localhost:8089` | `splunk/splunk`, user `admin`, password `Valid_password!` |
| S3-compatible storage | `http://127.0.0.1:7070` | `versity/versitygw`, access key `myaccesskey`, secret `mysecretkey`, CORS enabled |
| GitHub/SonarQube mock | `http://127.0.0.1:3001` | `yarn cypress-test mock-json` |
| OIDC mock | `http://localhost:8082` | `yarn cypress-test mock-openid` |

After starting Splunk, run `bash test/services/configure_splunk.sh CONTAINER_ID https` to apply CORS while preserving its generated configuration. This waits for readiness before and after the restart. The converter workflow uses the same script with `http` for its non-TLS Splunk instance.

Create the S3 bucket `mybucket` and upload `libs/hdf-converters/sample_jsons/nessus_mapper/nessus-hdf-10.0.0.1.json` as `nessus-hdf.json`, using the AWS CLI commands in the workflow.

The JSON server exposes `/health`. Wait for OIDC at `/.well-known/openid-configuration`. OIDC tests explicitly select their response using `POST /__test__/profile` with `{"emailVerified":true}` or `{"emailVerified":false}`. The selected response persists until changed, including across repeated userinfo requests; it never depends on request order.

## Run against the production build

Configure `apps/backend/.env` using `apps/backend/test/.env-ci` as the example, with the disposable database and local service addresses. With the infrastructure services running:

```sh
yarn install --frozen-lockfile
NODE_ENV=production yarn build
yarn backend sequelize db:create
yarn backend sequelize db:migrate
yarn backend sequelize db:seed:all
```

Run each server in its own terminal:

```sh
NODE_ENV=test CYPRESS_TESTING=true yarn start
yarn cypress-test mock-json
yarn cypress-test mock-openid
```

Then run:

```sh
yarn cypress-test typecheck
yarn cypress-test lint:ci
yarn test:ui
```

`CYPRESS_TESTING=true` enables database reset and exempts test logins from rate limiting only when `NODE_ENV` is `test` or `development`. Production retains its restrictions even if the flag is set.

## Focused development

```sh
yarn test:ui:open
yarn test:ui --spec test/e2e/groups.cy.ts
yarn test:ui --spec 'test/e2e/registration.cy.ts,test/e2e/account.cy.ts' --config retries=0
```

For a frontend development server on another origin, set `CYPRESS_BASE_URL`, for example `CYPRESS_BASE_URL=http://localhost:8080 yarn test:ui:open`. Configure the backend's `EXTERNAL_URL` and provider callback URLs to match. The GitHub mock honors the requested callback URL.

Authentication and registration scenarios use the UI. Other scenarios create users and log in through the API, then initialize the same JSON-encoded local storage values the application uses. Do not cache sessions across database resets. Prefer retryable `should` assertions and request aliases over sleeps or forced clicks. The suite uses a 1440-by-900 desktop viewport and explicitly scrolls to lazy-rendered control rows.

See Cypress's [best practices](https://docs.cypress.io/app/core-concepts/best-practices) and [retry-ability guide](https://docs.cypress.io/app/core-concepts/retry-ability) for the reasoning behind this setup.

Full CI runs require every listed service. Missing services are failures, not reasons to skip or weaken scenarios. Screenshots and videos are written to ignored directories under `test/` and uploaded by CI on failure.
