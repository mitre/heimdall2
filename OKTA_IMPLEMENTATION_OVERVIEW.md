# Okta Authentication Implementation Overview

## Problem Statement

The original Okta authentication implementation using `passport-openidconnect` suffered from a critical issue:
- On the first authentication attempt, the OpenID token was not properly populated in the session object
- This resulted in authentication failures with the error "Unable to verify authorization request state"
- Subsequent authentication attempts would mysteriously succeed

This inconsistent behavior created a poor user experience and introduced security concerns.

## Solution Overview

We implemented a hybrid authentication approach that:
1. Uses the more robust `openid-client` library specifically for Okta authentication
2. Maintains compatibility with other Passport-based authentication methods
3. Enhances error handling, session management, and logging throughout the flow

## Key Technical Components

### 1. Okta Strategy Rewrite

The `OktaStrategy` class has been completely rewritten using the `openid-client` library:

```typescript
@Injectable()
export class OktaStrategy extends PassportStrategy(Strategy, 'okta') implements OnModuleInit {
  // ...
  
  async onModuleInit() {
    try {
      // Automatic endpoint discovery
      const oktaIssuer = await Issuer.discover(issuerUrl);
      
      // Create OIDC client with proper configuration
      this.client = new oktaIssuer.Client({
        client_id: this.configService.get('OKTA_CLIENTID') || 'disabled',
        client_secret: this.configService.get('OKTA_CLIENTSECRET') || 'disabled',
        redirect_uris: [`${this.configService.get('EXTERNAL_URL')}/authn/okta/callback`],
        response_types: ['code'],
      });
      
      // Update the strategy with the client
      Object.assign(this, {client: this.client});
    } catch (error) {
      // Error handling with proper logging
    }
  }
  
  // Validation function with proper error handling
  async validate(tokenSet: TokenSet, userinfo: UserinfoResponse) {
    // Validate user information
    // Create or validate user
    // Return user object
  }
}
```

Key improvements:
- Uses `OnModuleInit` to perform async initialization properly
- Implements automatic discovery of Okta endpoints
- Enables PKCE (Proof Key for Code Exchange) for enhanced security
- Provides comprehensive error handling and logging

### 2. Authentication Exception Filter Enhancement

The `AuthenticationExceptionFilter` has been enhanced to provide better error handling:

```typescript
@Catch(Error)
export class AuthenticationExceptionFilter implements ExceptionFilter {
  // ...
  
  catch(exception: Error, host: ArgumentsHost): void {
    // Generate correlation ID for traceability
    const correlationId = uuidv4();
    
    // Clear auth cookies on state verification failure
    if (_.get(request, 'authInfo.message') === 'Unable to verify authorization request state.') {
      this.clearAuthCookies(response);
      return response.redirect(302, `/authn/${this.authenticationType}`);
    }
    
    // Set user-friendly error messages with correlation ID
    // Redirect to home page
  }
  
  // Helper method to clear all auth-related cookies
  private clearAuthCookies(response: any): void {
    response.clearCookie('connect.sid');
    response.clearCookie('authenticationError');
    response.clearCookie('errorCorrelationId');
    response.clearCookie('userID');
    response.clearCookie('accessToken');
  }
}
```

Key improvements:
- Adds correlation IDs for better error traceability
- Implements cookie clearing to prevent cascading errors
- Provides user-friendly error messages for different scenarios
- Enhanced logging with detailed error context

### 3. Session Management Improvements

The session management in `main.ts` has been significantly improved:

```typescript
// Trust proxy in production for proper cookie handling
if (configService.isInProductionMode()) {
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
}

// Session middleware with better configuration
app.use(
  session({
    name: 'heimdall.sid', // Custom name to avoid collisions
    secret: generateDefault(),
    store: store,
    proxy: configService.isInProductionMode(),
    cookie: {
      maxAge: 60 * 60 * 1000, // 1 hour
      secure: configService.isInProductionMode(),
      httpOnly: true,
      sameSite: 'lax' // Balances security and usability
    },
    saveUninitialized: false,
    resave: false,
    rolling: true // Reset cookie expiration on each request
  })
);

// Setup passport session handling (must come after session middleware)
app.use(passport.session());

// Add default serialization/deserialization for Passport
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((obj: any, done) => {
  done(null, obj);
});
```

Key improvements:
- Properly configures `trust proxy` for secure cookies behind load balancers
- Uses custom session name to avoid collisions
- Configures secure cookie settings (httpOnly, sameSite)
- Adds missing passport serialization/deserialization
- Ensures correct middleware ordering

### 4. Authentication Controller Updates

The `AuthnController` has been updated with better logging and error handling:

```typescript
@Get('okta')
@UseGuards(AuthGuard('okta'))
@UseFilters(new AuthenticationExceptionFilter('okta'))
async loginToOkta(@Req() req: Request): Promise<{userID: string; accessToken: string}> {
  this.logger.log(`Initiating Okta login flow`);
  return this.authnService.login(req.user as User);
}

@Get('okta/callback')
@UseGuards(AuthGuard('okta'))
@UseFilters(new AuthenticationExceptionFilter('okta'))
async getUserFromOkta(@Req() req: Request): Promise<void> {
  this.logger.log(`Okta login callback received for user: ${(req.user as User)?.email || 'unknown'}`);
  const session = await this.authnService.login(req.user as User);
  await this.setSessionCookies(req, session);
  this.logger.log(`Okta login completed successfully for user: ${(req.user as User).email}`);
}

// Enhanced cookie setting with better security configuration
async setSessionCookies(req: Request, session: { userID: string; accessToken: string }): Promise<void> {
  // Set cookies with proper security settings
  // Redirect to home page
}
```

Key improvements:
- Adds comprehensive logging throughout the authentication flow
- Uses proper exception filters for each authentication type
- Enhances cookie settings for user sessions
- Provides more detailed success/failure logging

## How This Fixes the Issue

The implementation addresses the root causes of the authentication failures:

1. **State Parameter Handling**: The `openid-client` library provides more robust handling of the OpenID Connect state parameter, which was the source of the "Unable to verify authorization request state" errors.

2. **Session Middleware Configuration**: The session middleware is now properly configured with the right options and correct ordering relative to the Passport middleware.

3. **Proper Initialization**: The Okta strategy now uses `onModuleInit` to properly initialize asynchronously, ensuring all endpoints are discovered before authentication attempts.

4. **Cookie Security Settings**: Cookie settings are now properly configured for both development and production environments, including settings for `Secure`, `HttpOnly`, and `SameSite`.

5. **Error Recovery**: The authentication exception filter now clears all auth-related cookies on failure, ensuring a clean slate for subsequent authentication attempts.

## Security Enhancements

This implementation also includes several security enhancements:

1. **PKCE Support**: Proof Key for Code Exchange is now used, providing additional protection against authorization code interception attacks.

2. **Correlation IDs**: Each authentication attempt and error now has a unique correlation ID for better traceability and security incident response.

3. **Enhanced Logging**: More detailed logging throughout the authentication flow helps with debugging and security analysis.

4. **Cookie Security**: Cookies are now properly secured with appropriate flags based on the environment.

5. **Trust Proxy Configuration**: The application now properly handles secure cookies when behind a load balancer or proxy.

## Debugging and Troubleshooting

The implementation includes enhanced debugging capabilities:

1. **Session Debugging Middleware**: In development mode, the application logs session details for authentication-related requests.

2. **Correlation IDs**: Each error has a unique correlation ID that appears in logs and error messages.

3. **User-Friendly Error Messages**: Error messages are now more user-friendly and include the correlation ID for reference.

4. **Comprehensive Logging**: Detailed logging throughout the authentication flow helps with troubleshooting.

## Conclusion

This hybrid authentication approach combines the robustness of the `openid-client` library for Okta authentication with the flexibility of Passport for other authentication methods. It addresses the core issue of first-time authentication failures while enhancing security, error handling, and user experience.

The implementation follows best practices for OpenID Connect authentication, including proper state parameter handling, PKCE support, and secure cookie management. It also provides comprehensive logging and debugging capabilities to help with troubleshooting.

This approach should provide a reliable and secure authentication experience for users of the Heimdall2 application.