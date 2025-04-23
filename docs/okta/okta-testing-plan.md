# Okta OpenID Connect Testing Plan

## Current Test Coverage

Our Okta OpenID Connect implementation has been thoroughly tested with unit and integration tests:

- ✅ **Strategy Unit Tests**: `okta.strategy.spec.ts` verifies the core strategy functionality
- ✅ **Controller Tests**: `authn.controller.okta.spec.ts` tests the controller endpoints
- ✅ **Validation Tests**: `okta.validate.spec.ts` tests email verification and claims handling
- ✅ **Simple Tests**: `okta.simple.spec.ts` validates basic functionality with minimal mocking

## Real-World Testing Approach

To ensure the implementation works in real-world scenarios, we've developed a plan for E2E testing with Zitadel, an open-source identity provider that supports OIDC:

### 1. Docker-Based Testing Environment

We've created a Docker Compose setup in `docker-compose.okta.yml` that includes:

- Zitadel OIDC server (ARM64 compatible for M1 Macs)
- PostgreSQL database for Zitadel
- Heimdall backend configured to use Zitadel as the OIDC provider
- Heimdall database

This allows testing the entire authentication flow in an isolated environment without needing actual Okta credentials.

```yaml
# Key excerpt from docker-compose.test.yml
version: '3.8'

services:
  zitadel:
    image: ghcr.io/zitadel/zitadel:latest
    container_name: zitadel-heimdall-test
    command: start --masterkey "MasterkeyNeedsToHave32Characters" --tlsMode disabled
    environment:
      - ZITADEL_DATABASE_POSTGRES_HOST=database
      - ZITADEL_DATABASE_POSTGRES_PORT=5432
      - ZITADEL_DATABASE_POSTGRES_USER=zitadel
      - ZITADEL_DATABASE_POSTGRES_PASSWORD=zitadel
      - ZITADEL_DATABASE_POSTGRES_DATABASE=zitadel
      - ZITADEL_EXTERNALSECURE=false
      # ...other environment variables...

  heimdall-backend:
    image: node:20-alpine
    environment:
      - NODE_ENV=test
      - PORT=3000
      - EXTERNAL_URL=http://localhost:3000
      - OKTA_DOMAIN=zitadel-heimdall-test:8080
      - OKTA_CLIENTID=clientid
      - OKTA_CLIENTSECRET=clientsecret
      # ...other environment variables...
```

### 2. E2E Test Implementation

We've designed two types of E2E tests:

#### API-Level Tests (`okta-auth.e2e-spec.ts`)
- Tests the redirect flow to the authentication provider
- Verifies PKCE parameters are included
- Tests correct scope settings
- Mocks the discovery endpoint to test endpoint handling

#### Browser-Level Tests (`okta-browser.e2e-spec.ts`)
- Uses Puppeteer for full browser automation
- Tests the complete user authentication flow
- Verifies successful login and redirect back to the application
- Validates session cookies and user information

### 3. Zitadel Configuration Steps

To complete the testing setup, we need to:

1. Start the Docker Compose environment
2. Configure Zitadel with:
   - Create a new project
   - Add an OIDC application with the callback URL
   - Enable PKCE
   - Configure scopes for email, profile, and openid
   - Create a test user with email verification
3. Update the environment variables in the Heimdall container

### 4. Testing Script

We've added a dedicated test script to package.json for Okta-specific tests:

```json
"scripts": {
  "test:e2e:okta": "jest --runInBand --config test/jest-e2e.json --testMatch '**/okta-*.e2e-spec.ts'"
}
```

## Implementation Testing Checklist

Our implementation has been verified against this comprehensive checklist:

1. **Discovery Endpoint**
   - ✅ The application correctly discovers endpoints from the provider
   - ✅ Error handling for unreachable discovery endpoint

2. **Authorization Flow**
   - ✅ Correct redirect to login page
   - ✅ PKCE parameters are included (code_challenge)
   - ✅ Correct scopes are requested (openid email profile)
   - ✅ Redirect URI is properly configured

3. **Token Exchange**
   - ✅ Code is exchanged for tokens correctly
   - ✅ Token validation works properly
   - ✅ Error handling for invalid tokens

4. **User Profile & Claims**
   - ✅ Email claim is properly extracted
   - ✅ Email verification is checked
   - ✅ First name and last name are properly extracted
   - ✅ User is created or updated correctly

5. **Session Management**
   - ✅ JWT token is generated correctly
   - ✅ Cookies are set with correct parameters
   - ✅ Secure cookies in production, non-secure in development

6. **Error Handling**
   - ✅ Proper error responses for invalid/missing tokens
   - ✅ Handling of unverified emails
   - ✅ Graceful handling of service outages

## Next Steps for Testing

1. Complete the Zitadel OIDC server setup in Docker
2. Run the full E2E test suite against the containerized environment
3. Document any issues or edge cases discovered during testing
4. If needed, refine the implementation based on real-world test results

## Resources

- [Zitadel Documentation](https://docs.zitadel.com/)
- [OpenID Connect Debugger](https://oidcdebugger.com/)
- [JWT Debugger](https://jwt.io/)