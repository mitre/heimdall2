# Okta OpenID Client Implementation PR

## Overview
This PR implements a more robust Okta authentication strategy using the `openid-client` library, replacing the previous `passport-openidconnect` implementation. The new implementation addresses first-time login issues and improves security with PKCE.

## Key Changes

### 1. Replaced the Okta Strategy
- Switched from `passport-openidconnect` to `openid-client`
- Added automatic discovery of OpenID Connect endpoints
- Implemented PKCE (Proof Key for Code Exchange) for better security
- Enhanced validation and error handling

### 2. Improved Authentication Exception Filter
- Added cryptographically secure correlation IDs (UUID v4) for tracking authentication errors
- Implemented cookie clearing to prevent cascading errors
- Enhanced error reporting with more user-friendly messages
- Added structured logging with contextual information for better debugging

### 3. Enhanced Session Management
- Fixed session middleware configuration
- Improved cookie settings (httpOnly, SameSite, etc.)
- Added proper serialization/deserialization
- Implemented session debugging in development mode

### 4. Updated Authentication Controller
- Added proper exception filters for each auth type
- Enhanced cookie settings for user session cookies
- Improved logging throughout authentication flow

## Files Modified
1. `/apps/backend/package.json` - Added openid-client v5.7.1 dependency
2. `/apps/backend/src/authn/okta.strategy.ts` - Complete rewrite using openid-client
3. `/apps/backend/src/authn/authn.controller.ts` - Updated with better logging
4. `/apps/backend/src/filters/authentication-exception.filter.ts` - Enhanced error handling
5. `/apps/backend/src/main.ts` - Improved session configuration
6. `/apps/backend/src/authn/okta.*.spec.ts` - Updated test files for v5.7.1 compatibility

## Testing
- Unit tests for the Okta strategy have been updated
- Tests cover email verification, PKCE implementation, and token handling
- Authentication controller tests have been updated to match new implementation

## Configuration
The implementation requires the same environment variables as before:
- `OKTA_DOMAIN` - Your Okta domain (e.g., dev-123456.okta.com)
- `OKTA_CLIENTID` - Client ID for your Okta application
- `OKTA_CLIENTSECRET` - Client secret for your Okta application
- `EXTERNAL_URL` - The external URL of your application (for callback URL)

## Implementation Details
The core issue addressed is that the original implementation using passport-openidconnect was failing during the first authentication attempt, likely due to issues with OpenID Connect state parameter handling and session management.

The key insight of our solution is to use the more robust openid-client library (v5.7.1) specifically for Okta authentication, while maintaining compatibility with other authentication methods that use Passport.

**Note on Package Selection**: We deliberately chose openid-client v5.7.1 instead of the latest v6.x. This decision was made after encountering ESM compatibility issues in the CI environment with v6.x, which is ESM-only and conflicts with NestJS's CommonJS structure. Version 5.7.1 provides all the necessary security features while avoiding module system incompatibilities.

Key technical components:

1. **Endpoint Discovery**: We use the Issuer.discover() method to automatically find the correct endpoints for the Okta identity provider.

2. **State Parameter Handling**: The openid-client library has better handling of the state parameter, which helps prevent the "Unable to verify authorization request state" errors.

3. **PKCE Implementation**: We added PKCE (Proof Key for Code Exchange) for enhanced security.

4. **Session Configuration**: We improved the session middleware configuration with better cookie settings and explicit passport serialization.

5. **Error Recovery**: We implemented cookie clearing on authentication failures to ensure a clean start for subsequent attempts.

6. **Secure Correlation ID Generation**: We implemented a utility module for generating cryptographically secure correlation IDs using UUID v4, replacing insecure random number generation used previously.

7. **Code Quality Improvements**: We addressed numerous code quality issues detected by SonarCloud, including replacing logical OR with nullish coalescing for safer type handling, and eliminating unused imports.

By combining these approaches, we've created a robust hybrid solution that addresses the authentication issues without requiring a complete rewrite of the authentication system.