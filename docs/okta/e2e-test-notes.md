# Okta OpenID Connect E2E Testing Notes

## E2E Test Design

The E2E tests for the Okta OpenID Connect authentication have been designed with the following considerations:

1. **Environment Independence**: The tests use a conditional approach (`runIfOIDCConfigured`) to only run when proper Okta/OIDC credentials are present in the environment. This prevents CI failures when credentials aren't available.

2. **Partial Flow Testing**: Due to the nature of OAuth flows requiring user interaction:
   - Tests verify only the initial redirect to the authentication provider
   - Tests confirm essential PKCE parameters are present in the redirect URL
   - Tests validate authorization endpoint discovery works correctly

3. **Mocking Strategy**:
   - The tests mock the discovery endpoint using axios
   - They create a direct instance of the OktaStrategy to validate initialization
   - Full browser-based testing would require Zitadel OIDC server setup

## Test Challenges

Some challenges with the E2E testing approach:

1. **ES Module Compatibility**:
   - The openid-client library is an ES module
   - NestJS and the test environment use CommonJS
   - We use `require('openid-client/passport')` to bridge this gap

2. **Environment Dependencies**:
   - Full E2E testing requires a running Zitadel OIDC server
   - Tests are skipped if credentials aren't available
   - In CI, tests validate redirect format but not complete auth flow

3. **Jest Configuration**:
   - Jest has limitations with ES modules in CommonJS environments
   - The test config includes appropriate transformations and settings

## Recommended Test Approach

For thorough testing of the Okta implementation:

1. Run unit tests: `yarn workspace heimdall-server test src/authn`
2. For full E2E validation:
   - Set up Zitadel with Docker: `docker-compose -f docker-compose.okta.yml up -d`
   - Configure test environment with test credentials
   - Run: `yarn workspace heimdall-server test:e2e:okta`

3. Manual validation:
   - Copy `.env.okta.example` to `apps/backend/.env`
   - Configure with real Okta credentials
   - Test the login flow in a browser

## CI Considerations

In CI environments:
- Unit tests fully validate the core functionality
- E2E tests verify the initial redirect but skip the complete flow
- The `runIfOIDCConfigured` function helps avoid false failures

This approach balances thorough testing with the practical limitations of testing OAuth flows in CI pipelines.