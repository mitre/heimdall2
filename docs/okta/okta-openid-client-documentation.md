# Okta OpenID-client Implementation Research & Testing Analysis

## Current Implementation Overview

Our implementation uses a hybrid authentication approach with `openid-client` for Okta authentication, leveraging the modern features of this library rather than the traditional Passport-Okta strategy.

### Key Components

1. **OktaStrategy (src/authn/okta.strategy.ts)**
   - Extends PassportStrategy with `openid-client`'s Strategy
   - Uses asynchronous initialization in `onModuleInit()` to discover endpoints
   - Implements PKCE (Proof Key for Code Exchange) for enhanced security
   - Validates users with proper email verification checks
   - Handles errors with detailed logging

2. **AuthnController (src/authn/authn.controller.ts)**
   - Exposes endpoints for Okta authentication
   - Handles callbacks from Okta with session cookie management
   - Uses AuthenticationExceptionFilter for error handling

3. **Tests (src/authn/okta.strategy.spec.ts)**
   - Unit tests for validate method
   - Tests for error handling (missing email, unverified email)
   - Mocking of openid-client library and dependencies

## Technology Stack Details

1. **openid-client v5.7.1**:
   - Modern, standards-compliant OIDC implementation
   - Supports advanced security features like PKCE
   - Uses functional approach rather than class-based
   - Certified OpenID Connect implementation
   - Compatible with CommonJS module system
   
   > **Note**: We deliberately use v5.7.1 instead of v6.x to avoid ESM compatibility issues with NestJS and CI environments. During implementation, we encountered a runtime error in the CI environment with v6.x due to its ESM-only nature, which caused conflicts with NestJS's CommonJS structure. After evaluating multiple approaches (complex runtime imports, Node.js experimental features, or downgrading), we determined that downgrading to v5.7.1 provided the best balance of compatibility and security. This version maintains all core security features (PKCE, state validation) while avoiding the module system incompatibilities. Import paths are also simplified with v5.x as Strategy is exported directly from the main module rather than a separate passport subdirectory.

2. **NestJS Passport Integration**:
   - Uses PassportStrategy adapter pattern
   - Requires custom strategy implementation for openid-client

3. **Authentication Flow**:
   - Initial redirect to Okta authorization endpoint
   - PKCE-secured authorization code flow
   - Token and userinfo validation
   - User creation/validation with AuthnService
   - Session establishment with JWT tokens

## Testing Status and Enhancement Plan

### Current Test Coverage

1. **Unit Tests** for OktaStrategy:
   - Testing for successful validation
   - Testing error cases for missing email
   - Testing error cases for unverified email
   - Tests for AuthenticationExceptionFilter

2. **Simplified Unit Tests**:
   - `okta.validate.spec.ts` - Core validation logic tests
   - `okta.simple.spec.ts` - TypeScript-independent tests for validation and controller integration
   - `okta.controller.spec.ts` - Controller tests for Okta authentication flow

### Testing Gaps

1. **TypeScript Compatibility Issues**: Current tests have TypeScript compatibility issues with openid-client v6.4.2
   - The types in our implementation don't match the latest openid-client exports
   - We've had to use `@ts-nocheck` for our simplified tests to work around this

2. **E2E Testing**: No tests for end-to-end workflow
   - Missing tests with actual HTTP requests
   - Missing mock OIDC server for complete flow testing

### Recommended Test Enhancements

1. **Unit Test Enhancements**:
   ```typescript
   it('should initialize OIDC client during onModuleInit', async () => {
     // Mock the necessary services
     jest.spyOn(Issuer, 'discover').mockResolvedValue({
       Client: jest.fn().mockImplementation(() => ({})),
       metadata: {
         issuer: 'https://test-okta-domain.okta.com',
         authorization_endpoint: 'https://test-okta-domain.okta.com/oauth2/v1/authorize',
         token_endpoint: 'https://test-okta-domain.okta.com/oauth2/v1/token',
         userinfo_endpoint: 'https://test-okta-domain.okta.com/oauth2/v1/userinfo',
       }
     });
     
     await oktaStrategy.onModuleInit();
     
     expect(Issuer.discover).toHaveBeenCalledWith('https://test-okta-domain.okta.com/oauth2/default');
     expect(oktaStrategy['client']).toBeDefined();
   });

   it('should handle errors during initialization', async () => {
     jest.spyOn(Issuer, 'discover').mockRejectedValue(new Error('Discovery failed'));
     jest.spyOn(oktaStrategy['logger'], 'error');
     
     await oktaStrategy.onModuleInit();
     
     expect(oktaStrategy['logger'].error).toHaveBeenCalledWith(
       expect.stringContaining('Failed to initialize Okta OIDC strategy')
     );
   });
   ```

2. **Integration Tests**:
   ```typescript
   describe('Integration with controller', () => {
     let authnController: AuthnController;
     
     beforeEach(async () => {
       // Create a test module that includes both controller and strategy
       const moduleRef = await Test.createTestingModule({
         controllers: [AuthnController],
         providers: [
           OktaStrategy,
           {
             provide: ConfigService,
             useValue: mockConfigService
           },
           {
             provide: AuthnService,
             useValue: mockAuthnService
           }
         ]
       }).compile();
       
       authnController = moduleRef.get<AuthnController>(AuthnController);
       oktaStrategy = moduleRef.get<OktaStrategy>(OktaStrategy);
     });
     
     it('should handle Okta callback correctly', async () => {
       // Mock the request with user data (simulating passport's work)
       const req = {
         user: {
           email: 'test@example.com',
           firstName: 'Test',
           lastName: 'User'
         },
         res: {
           cookie: jest.fn(),
           redirect: jest.fn()
         }
       };
       
       await authnController.getUserFromOkta(req as any);
       // Test that the callback works and sets cookies appropriately
       expect(req.res.cookie).toHaveBeenCalledTimes(2);
       expect(req.res.redirect).toHaveBeenCalledWith('/');
     });
   });
   ```

3. **Authentication Flow Tests**:
   ```typescript
   it('should handle authentication service failures', async () => {
     const mockTokenSet = {
       access_token: 'test-access-token',
       id_token: 'test-id-token',
       token_type: 'Bearer'
     };
     
     const mockUserinfo = {
       email: 'test@example.com',
       email_verified: true,
       given_name: 'Test',
       family_name: 'User',
       sub: '123456'
     };
     
     // Mock the auth service to throw an error
     jest.spyOn(authnService, 'validateOrCreateUser').mockRejectedValue(new Error('Service error'));
     
     await expect(oktaStrategy.validate(mockTokenSet, mockUserinfo))
       .rejects
       .toThrow(UnauthorizedException);
       
     expect(oktaStrategy['logger'].error).toHaveBeenCalledWith(
       expect.stringContaining('Error validating Okta user')
     );
   });
   ```

4. **Mock Server Tests (Optional)**:
   ```typescript
   // Using jest-mock-express or similar
   describe('E2E Authentication Flow', () => {
     let app;
     let mockOidcServer;
     
     beforeAll(async () => {
       // Set up mock OIDC server
       mockOidcServer = new MockOidcProvider({
         issuer: 'https://test-okta-domain.okta.com',
         clients: [{
           client_id: 'test-client-id',
           client_secret: 'test-client-secret',
           redirect_uris: ['https://heimdall-test.example.com/authn/okta/callback']
         }]
       });
       await mockOidcServer.start();
       
       // Configure app to use mock server URL
       // ...
     });
     
     afterAll(async () => {
       await mockOidcServer.stop();
     });
     
     it('should complete full authentication flow', async () => {
       // Test initiating auth, callback, and session creation
     });
   });
   ```

## Implementation Best Practices

1. **Security**:
   - PKCE implementation is essential for security (already implemented)
   - State parameter validation for CSRF protection (already implemented)
   - Proper token validation
   - Email verification checks
   - Secure cookie handling based on environment

2. **Error Handling**:
   - Graceful handling of authentication failures
   - Proper logging with context objects and cryptographically secure correlation IDs
   - User-friendly error redirection
   - Configurable retry mechanisms for discovery

3. **Scalability**:
   - Stateless design where possible
   - Proper session management
   - Performance considerations for token validation
   - Timeout handling for external service calls

4. **Configurability**:
   - Extensive environment variable configuration options
   - Custom authorization server path support
   - Flexible scope configuration
   - Customizable callback paths
   - Session cookie configuration options

## References and Community Resources

1. **openid-client Documentation**:
   - [GitHub Repository](https://github.com/panva/openid-client)
   - [NPM Package](https://www.npmjs.com/package/openid-client)

2. **Testing Examples**:
   - Open-source projects with similar implementations:
     - [dBildungsplattform/oidc.strategy.spec.ts](https://github.com/dBildungsplattform/dbildungs-iam-server/blob/main/src/modules/authentication/passport/oidc.strategy.spec.ts)
     - [twentyhq/oidc-auth.spec.ts](https://github.com/twentyhq/twenty/blob/main/packages/twenty-server/src/engine/core-modules/auth/guards/oidc-auth.spec.ts)

3. **Okta Documentation**:
   - [Okta OpenID Connect Documentation](https://developer.okta.com/docs/reference/api/oidc/)
   - [Okta Authentication Guide](https://developer.okta.com/docs/guides/implement-auth-code/overview/)

4. **NestJS and Passport Integration**:
   - [NestJS Authentication Documentation](https://docs.nestjs.com/security/authentication)
   - [NestJS Passport Integration](https://docs.nestjs.com/recipes/passport)
   - [Passport.js OpenID Connect Strategy](https://www.passportjs.org/packages/openid-client/)

5. **OpenID Connect Standards**:
   - [OpenID Connect Core Specification](https://openid.net/specs/openid-connect-core-1_0.html)
   - [OpenID Connect Discovery](https://openid.net/specs/openid-connect-discovery-1_0.html)
   - [OpenID Connect PKCE Extension](https://datatracker.ietf.org/doc/html/rfc7636)

6. **Mock Libraries for Testing**:
   - [mock-oidc-provider](https://github.com/Soluto/oidc-server-mock) - For OIDC server mocking
   - [jest-openid-client](https://www.npmjs.com/package/jest-openid-client) - For Jest testing with openid-client
   - [nock](https://github.com/nock/nock) - For HTTP request mocking

## Security Features

Our implementation includes several security enhancements and best practices:

1. **Cryptographically Secure Correlation IDs**:
   - All correlation IDs are generated using UUID v4 for strong randomness
   - Implemented in the `utils/correlation-id.util.ts` utility module
   - Used consistently throughout the authentication flow for tracing and debugging
   - Replaces insecure pseudo-random number generation based on Math.random()

2. **PKCE Flow**:
   - Enabled by default and configurable via environment variables
   - Provides enhanced protection against authorization code interception attacks

3. **CSRF Protection with State Parameter**:
   - State parameter validation is implemented as required by the OpenID Connect specification
   - During authorization request, a cryptographically secure random state value is generated and stored in session
   - The state is included in the redirect to Okta and returned in the callback
   - Implementation validates that the returned state matches the one stored in session
   - If validation fails, the authentication flow is restarted with a clean session
   - Prevents attackers from forging authentication callbacks

4. **Proper Cookie Security**:
   - Configurable SameSite attributes
   - Secure flags in production environments
   - HTTPS-only cookies as a security best practice
   - Configurable expiration timeframes

## Environment Variables and Configuration

Our Okta implementation supports extensive configuration through environment variables, making it flexible for different organizational needs.

### Core Settings

| Environment Variable | Default Value | Description |
|---------------------|---------------|-------------|
| `OKTA_DOMAIN` | (required) | Your Okta domain (e.g., your-domain.okta.com) |
| `OKTA_CLIENTID` | (required) | Your Okta client ID |
| `OKTA_CLIENTSECRET` | (required) | Your Okta client secret |
| `EXTERNAL_URL` | (required) | Your application's external URL |

### Advanced OIDC Settings

| Environment Variable | Default Value | Description |
|---------------------|---------------|-------------|
| `OKTA_AUTH_SERVER_PATH` | `/oauth2/default` | Custom authorization server path |
| `OKTA_SCOPE` | `openid email profile` | OAuth scopes to request |
| `OKTA_USE_PKCE` | `true` | Whether to use PKCE for enhanced security |
| `OKTA_CALLBACK_PATH` | `/authn/okta/callback` | OAuth callback path |
| `OKTA_DISCOVERY_TIMEOUT` | `10000` | Timeout for OIDC discovery in ms |
| `OKTA_RETRY_DISCOVERY` | `false` | Whether to retry discovery on failure |
| `OKTA_ENABLE_TOKEN_REFRESH` | `false` | Enable token refresh capability |
| `OKTA_PASS_REQ_TO_CALLBACK` | `false` | Pass request object to callback function |

### User Profile Settings

| Environment Variable | Default Value | Description |
|---------------------|---------------|-------------|
| `OKTA_GIVEN_NAME_CLAIM` | `given_name` | Claim to use for user's first name |
| `OKTA_FAMILY_NAME_CLAIM` | `family_name` | Claim to use for user's last name |
| `OKTA_REQUIRE_EMAIL_VERIFIED` | `true` | Require email verification |

### Session and Cookies

| Environment Variable | Default Value | Description |
|---------------------|---------------|-------------|
| `OKTA_SESSION_MAXAGE` | `86400000` (24 hours) | Max age for session cookies in ms |
| `OKTA_COOKIE_SAMESITE` | `lax` | SameSite cookie setting (lax, strict, none) |
| `OKTA_COOKIE_HTTP_ONLY` | `false` | Whether cookies are HTTP only |
| `OKTA_REDIRECT_AFTER_LOGIN` | `/` | Path to redirect to after successful login |

### Usage Examples

#### Custom Authorization Server

For organizations using a custom authorization server:

```
OKTA_DOMAIN=your-domain.okta.com
OKTA_AUTH_SERVER_PATH=/oauth2/your-custom-server
```

#### Enhanced Security

For maximum security settings:

```
OKTA_USE_PKCE=true
OKTA_REQUIRE_EMAIL_VERIFIED=true
OKTA_COOKIE_SAMESITE=strict
OKTA_SESSION_MAXAGE=3600000  # 1 hour
```

#### Custom Claims Mapping

For IdPs with non-standard claim names:

```
OKTA_GIVEN_NAME_CLAIM=first_name
OKTA_FAMILY_NAME_CLAIM=last_name
```

## Next Steps

1. **Immediate Priorities**:
   - Implement enhanced unit tests, especially for `onModuleInit()`
   - Add integration tests for the controller interaction
   - Add error handling tests
   - Add tests for new environment variable configurations

2. **Future Improvements**:
   - Consider adding E2E tests with mock OIDC server
   - Refine error handling for better user experience
   - Consider session management optimizations 
   - Add refreshToken support for longer sessions

## Environment Setup for Testing

1. **Mock Dependencies**:
   - Mock `ConfigService` for configuration values
   - Mock `AuthnService` for user validation
   - Mock `openid-client` library components (Issuer, Client, Strategy)

2. **Test Fixtures**:
   ```typescript
   // TokenSet fixture
   const createMockTokenSet = (overrides = {}) => ({
     access_token: 'test-access-token',
     id_token: 'test-id-token',
     token_type: 'Bearer',
     expires_at: Math.floor(Date.now() / 1000) + 3600,
     ...overrides
   });

   // UserInfo fixture
   const createMockUserInfo = (overrides = {}) => ({
     sub: '123456789',
     email: 'test@example.com',
     email_verified: true,
     given_name: 'Test',
     family_name: 'User',
     name: 'Test User',
     ...overrides
   });

   // Mock request
   const createMockRequest = (overrides = {}) => ({
     user: createMockUser(),
     res: {
       cookie: jest.fn(),
       redirect: jest.fn()
     },
     ...overrides
   });
   ```

3. **Test Utilities**:
   ```typescript
   // Helper to create test module
   const createTestingModule = async (overrides = {}) => {
     const moduleRef = await Test.createTestingModule({
       providers: [
         OktaStrategy,
         {
           provide: ConfigService,
           useValue: {
             get: jest.fn().mockImplementation((key: string) => {
               if (key === 'OKTA_DOMAIN') return 'test-okta-domain.okta.com';
               if (key === 'OKTA_CLIENTID') return 'test-client-id';
               if (key === 'OKTA_CLIENTSECRET') return 'test-client-secret';
               if (key === 'EXTERNAL_URL') return 'https://heimdall-test.example.com';
               return undefined;
             }),
             isInProductionMode: jest.fn().mockReturnValue(false)
           }
         },
         {
           provide: AuthnService,
           useValue: {
             validateOrCreateUser: jest.fn().mockResolvedValue({
               id: 1,
               email: 'test@example.com',
               firstName: 'Test',
               lastName: 'User'
             }),
             login: jest.fn().mockResolvedValue({
               userID: 'user-123',
               accessToken: 'access-token-123'
             })
           }
         },
         ...(overrides.providers || [])
       ],
       ...(overrides)
     }).compile();

     return moduleRef;
   };
   ```

---

This document captures our current understanding, approach, and test plan for our Okta OpenID-client implementation. It serves as a reference for continuing development and ensures we can quickly regain context if needed.

## Research Sources and Search Queries

During our investigation and implementation research, we used the following search queries and resources:

1. **Browser Searches**:
   - "openid-client v6.4.2 TokenSet UserinfoResponse Strategy documentation"
   - "openid-client 6.4.2 API documentation"
   - "openid-client testing mocking examples jest"
   - "openid-client test suite github panva examples"
   - "nest.js openid-client passport testing example"
   - "openid-client V6 TokenSet interface javascript"

2. **GitHub Code Searches**:
   - "openid-client strategy test jest filename:.spec.ts"
   - "passport openid-client nest test"
   - "okta openid-client test examples"

3. **NPM Package Analysis**:
   - `npm info openid-client`
   - `yarn list --pattern openid-client`

4. **Code Repositories Examined**:
   - panva/openid-client-conformance-tests
   - panva/openid-client (main repository)
   - dBildungsplattform/dbildungs-iam-server
   - twentyhq/twenty
   - fossabot/finastra-nodejs-libs
   - hmcts/rpx-xui-node-lib

This documentation of search patterns and resources should help avoid duplicating research efforts if we need to resume this work in the future.