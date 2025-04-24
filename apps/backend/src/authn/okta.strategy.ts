import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException
} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
// In openid-client v5.x, Strategy is exported from the main module, not a separate passport directory
import {Issuer, Strategy, TokenSet, UserinfoResponse} from 'openid-client';
import {ConfigService} from '../config/config.service';
import {AuthnService} from './authn.service';

// Constants for logging contexts to avoid duplication
const CONTEXT_INIT = 'OktaStrategy.onModuleInit';
const CONTEXT_VALIDATE = 'OktaStrategy.validate';

@Injectable()
export class OktaStrategy
  extends PassportStrategy(Strategy, 'okta')
  implements OnModuleInit
{
  private readonly logger = new Logger(OktaStrategy.name);
  // Client type from openid-client package
  private client: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService
  ) {
    // NOTE: For openid-client v5.x, we need to create a placeholder client instance
    // that will be replaced with the real client during onModuleInit
    // Import these inline to avoid ESM loading issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {Issuer} = require('openid-client');
    const dummyIssuer = new Issuer({
      issuer: 'placeholder',
      authorization_endpoint: 'placeholder',
      token_endpoint: 'placeholder'
    });
    const dummyClient = new dummyIssuer.Client({
      client_id: 'placeholder',
      redirect_uris: ['placeholder']
    });

    // Read configuration at constructor time
    const scope = configService.get('OKTA_SCOPE') ?? 'openid email profile';
    const usePKCE =
      configService.get('OKTA_USE_PKCE')?.toLowerCase() !== 'false';
    const passReqToCallback =
      configService.get('OKTA_PASS_REQ_TO_CALLBACK')?.toLowerCase() === 'true';

    super({
      client: dummyClient, // Temporary placeholder client that will be replaced during onModuleInit
      params: {scope},
      passReqToCallback, // Whether to include request in callback (useful for capturing headers/IP)
      usePKCE // Use PKCE for more security (Proof Key for Code Exchange)

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let oktaIssuer: Issuer<any>;
      try {
        // Use Promise.race to implement timeout
        const raceResult = await Promise.race([
          Issuer.discover(issuerUrl),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Discovery timeout')),
              discoveryTimeout
            )
          )
        ]);

        // Cast the result to Issuer type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        oktaIssuer = raceResult as Issuer<any>;
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

      // For openid-client v5.x, we need to access the internal _client property
      // This is how the client instance is stored in the OpenIDConnectStrategy
      Object.defineProperty(this, '_client', {
        value: this.client,
        writable: true,
        configurable: true
      });

      // Also update params and usePKCE for consistency
      // We need to access internal properties of the OpenIDConnectStrategy
      // that aren't exposed in the TypeScript definitions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion
      const currentParams = (this as any)['_params'] || {};
      Object.defineProperty(this, '_params', {
        value: {...currentParams, scope},
        writable: true,
        configurable: true
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.defineProperty(this, '_usePKCE', {
        value: usePKCE,
        writable: true,
        configurable: true
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

      // NOTE: We intentionally do not rethrow the error here to allow graceful degradation
      // This is a deliberate design choice to prevent Okta initialization failures from
      // blocking the entire application startup.
      //
      // Benefits of this approach:
      // 1. Other authentication methods can still function properly
      // 2. The application can start and operate in a degraded state
      // 3. Administrators have time to fix Okta configuration issues
      //
      // When a user attempts to use Okta authentication, they will receive a proper
      // error message, and the auth exception filter will handle the failure gracefully
    }
  }

  /**
   * Validate the user from the TokenSet and Userinfo
   * This is the verify callback function for passport-openid-client
   */
  async validate(tokenSet: TokenSet, userinfo: UserinfoResponse) {
    // Import the utility function for generating correlation IDs
    const {generateCorrelationId} = await import(
      '../utils/correlation-id.util'
    );

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
