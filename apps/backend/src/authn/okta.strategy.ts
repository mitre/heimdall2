import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException
} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {TokenEndpointResponse, UserInfoResponse} from 'oauth4webapi';
import {ConfigService} from '../config/config.service';
import {AuthnService} from './authn.service';

// Constants for logging contexts to avoid duplication
const CONTEXT_INIT = 'OktaStrategy.onModuleInit';
const CONTEXT_VALIDATE = 'OktaStrategy.validate';

// Import the Passport integration directly
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {Strategy} = require('openid-client/passport');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {Issuer} = require('openid-client');

@Injectable()
export class OktaStrategy
  extends PassportStrategy(Strategy, 'okta')
  implements OnModuleInit
{
  private readonly logger = new Logger(OktaStrategy.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null; // Using any until we fix all type issues

  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService
  ) {
    // Read configuration at constructor time
    const scope = configService.get('OKTA_SCOPE') ?? 'openid email profile';
    const usePKCE =
      configService.get('OKTA_USE_PKCE')?.toLowerCase() !== 'false';
    const passReqToCallback =
      configService.get('OKTA_PASS_REQ_TO_CALLBACK')?.toLowerCase() === 'true';

    super({
      client: null, // Will be set during onModuleInit
      params: {scope},
      passReqToCallback, // Whether to include request in callback (useful for capturing headers/IP)
      usePKCE, // Use PKCE for more security (Proof Key for Code Exchange)
      
      // SECURITY: State parameter is automatically generated and validated by the openid-client library
      // During the authorization request, a random state value is generated and stored in the session
      // When the callback is received, the state in the request is compared with the stored state
      // This prevents CSRF attacks where an attacker could forge a authentication callback
      // If state validation fails, the AuthenticationExceptionFilter will handle the error and restart the flow
    });
  }

  /**
   * Initialize the OpenID Connect client during module initialization
   * This allows us to use async operations like Issuer.discover()
   */
  async onModuleInit() {
    try {
      const oktaDomain = this.configService.get('OKTA_DOMAIN') ?? 'disabled';
      const authServerPath =
        this.configService.get('OKTA_AUTH_SERVER_PATH') ?? '/oauth2/default';
      const issuerUrl = `https://${oktaDomain}${authServerPath}`;

      // Get customizable scope
      const scope =
        this.configService.get('OKTA_SCOPE') ?? 'openid email profile';

      // Configure PKCE usage (default to true for security)
      const usePKCE =
        this.configService.get('OKTA_USE_PKCE')?.toLowerCase() !== 'false';

      // Get custom callback path
      const callbackPath =
        this.configService.get('OKTA_CALLBACK_PATH') ?? '/authn/okta/callback';
      const redirectUri = `${this.configService.get('EXTERNAL_URL')}${callbackPath}`;

      // Discovery timeout configuration
      const discoveryTimeout = parseInt(
        this.configService.get('OKTA_DISCOVERY_TIMEOUT') ?? '10000',
        10
      );

      this.logger.verbose(`Discovering OpenID Connect endpoints`, {
        issuerUrl,
        scope,
        usePKCE,
        callbackPath,
        context: CONTEXT_INIT
      });

      // Discover OpenID Connect endpoints with configurable timeout
      let oktaIssuer;
      try {
        // Use Promise.race to implement timeout
        oktaIssuer = await Promise.race([
          Issuer.discover(issuerUrl),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Discovery timeout')),
              discoveryTimeout
            )
          )
        ]);
      } catch (discoveryError) {
        this.logger.error(`OIDC discovery failed: ${discoveryError.message}`, {
          context: CONTEXT_INIT,
          issuerUrl,
          timeout: discoveryTimeout
        });

        // Check if retry is enabled
        if (
          this.configService.get('OKTA_RETRY_DISCOVERY')?.toLowerCase() ===
          'true'
        ) {
          this.logger.warn('Retrying OIDC discovery once...', {
            context: CONTEXT_INIT
          });
          oktaIssuer = await Issuer.discover(issuerUrl);
        } else {
          throw discoveryError;
        }
      }

      this.logger.debug('OpenID Connect endpoints discovered successfully', {
        context: CONTEXT_INIT,
        issuer: oktaIssuer.metadata.issuer,
        authEndpoint: oktaIssuer.metadata.authorization_endpoint
      });

      // Setup token refresh options if enabled
      const tokenRefreshEnabled =
        this.configService.get('OKTA_ENABLE_TOKEN_REFRESH')?.toLowerCase() ===
        'true';

      // Create OIDC client
      this.client = new oktaIssuer.Client({
        client_id: this.configService.get('OKTA_CLIENTID') ?? 'disabled',
        client_secret:
          this.configService.get('OKTA_CLIENTSECRET') ?? 'disabled',
        redirect_uris: [redirectUri],
        response_types: ['code'],
        // Add token refresh support if configured
        token_endpoint_auth_method: tokenRefreshEnabled
          ? 'client_secret_post'
          : undefined
      });

      // Update the strategy with all configurable options
      Object.assign(this, {
        client: this.client,
        params: {scope},
        usePKCE
      });

      this.logger.log('Okta OIDC strategy initialized successfully', {
        context: CONTEXT_INIT,
        pkceEnabled: usePKCE,
        redirectUri,
        scope,
        tokenRefreshEnabled
      });
    } catch (error) {
      // Use structured logging with context object for better debugging
      this.logger.error(
        `Failed to initialize Okta OIDC strategy: ${error.message}`,
        {
          stack: error.stack,
          name: error.name,
          details: error.toString(),
          context: CONTEXT_INIT
        }
      );
      // Continue running even if Okta strategy initialization fails
      // This allows the application to start and other auth methods to work
    }
  }

  /**
   * Validate the user from the TokenSet and Userinfo
   * This is the verify callback function for passport-openid-client
   */
  async validate(tokenSet: TokenEndpointResponse, userinfo: UserInfoResponse) {
    // Import the utility function for generating correlation IDs
    const {generateCorrelationId} = await import('../utils/correlation-id.util');
    
    // Generate correlation ID for tracing this validation process
    const correlationId = generateCorrelationId('okta');

    this.logger.verbose(`Validating Okta user`, {
      email: userinfo.email,
      context: CONTEXT_VALIDATE,
      hasIdToken: !!tokenSet.id_token,
      correlationId
    });

    if (!userinfo.email) {
      this.logger.error('Email not provided in Okta userinfo response', {
        context: CONTEXT_VALIDATE,
        userinfo: JSON.stringify(userinfo),
        correlationId
      });
      throw new UnauthorizedException('Email is required for authentication');
    }

    // Check if email verification is required (configurable)
    const requireEmailVerified =
      this.configService.get('OKTA_REQUIRE_EMAIL_VERIFIED')?.toLowerCase() !==
      'false';

    if (requireEmailVerified && userinfo.email_verified !== true) {
      this.logger.warn(`User email is not verified`, {
        email: userinfo.email,
        context: CONTEXT_VALIDATE,
        correlationId
      });
      throw new UnauthorizedException('Email verification required');
    }

    try {
      // Get name mapping config - this allows mapping different OIDC provider claim names
      const givenNameClaim =
        this.configService.get('OKTA_GIVEN_NAME_CLAIM') ?? 'given_name';
      const familyNameClaim =
        this.configService.get('OKTA_FAMILY_NAME_CLAIM') ?? 'family_name';

      // Use the configured claim names with fallbacks - ensure string type
      const firstName = String(
        userinfo[givenNameClaim] ?? userinfo.given_name ?? ''
      );
      const lastName = String(
        userinfo[familyNameClaim] ?? userinfo.family_name ?? ''
      );

      const user = await this.authnService.validateOrCreateUser(
        userinfo.email,
        firstName,
        lastName,
        'okta'
      );

      this.logger.log(`Okta authentication successful`, {
        email: userinfo.email,
        userId: user.id,
        context: CONTEXT_VALIDATE,
        correlationId
      });
      return user;
    } catch (error) {
      this.logger.error(`Error validating Okta user`, {
        email: userinfo.email,
        error: error.message,
        stack: error.stack,
        context: CONTEXT_VALIDATE,
        correlationId
      });
      throw new UnauthorizedException('Failed to authenticate with Okta');
    }
  }
}
