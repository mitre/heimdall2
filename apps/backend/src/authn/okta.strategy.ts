import {Injectable, Logger, OnModuleInit, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {TokenEndpointResponse, UserInfoResponse} from 'oauth4webapi';
import {ConfigService} from '../config/config.service';
import {AuthnService} from './authn.service';

// Import the Passport integration directly
const {Strategy} = require('openid-client/passport');
const {Issuer} = require('openid-client');

@Injectable()
export class OktaStrategy extends PassportStrategy(Strategy, 'okta') implements OnModuleInit {
  private readonly logger = new Logger(OktaStrategy.name);
  private client: any = null; // Using any until we fix all type issues

  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService
  ) {
    super({
      client: null, // Will be set during onModuleInit
      params: {
        scope: 'openid email profile'
      },
      passReqToCallback: false, // We don't need the request object in the verify function
      usePKCE: true // Use PKCE for more security (Proof Key for Code Exchange)
    });
  }

  /**
   * Initialize the OpenID Connect client during module initialization
   * This allows us to use async operations like Issuer.discover()
   */
  async onModuleInit() {
    try {
      const oktaDomain = this.configService.get('OKTA_DOMAIN') || 'disabled';
      const issuerUrl = `https://${oktaDomain}/oauth2/default`;
      
      this.logger.log(`Discovering OpenID Connect endpoints from ${issuerUrl}`);
      
      // Discover OpenID Connect endpoints automatically
      const oktaIssuer = await Issuer.discover(issuerUrl);
      
      this.logger.log('OpenID Connect endpoints discovered successfully');
      
      // Create OIDC client
      this.client = new oktaIssuer.Client({
        client_id: this.configService.get('OKTA_CLIENTID') || 'disabled',
        client_secret: this.configService.get('OKTA_CLIENTSECRET') || 'disabled',
        redirect_uris: [`${this.configService.get('EXTERNAL_URL')}/authn/okta/callback`],
        response_types: ['code'],
      });
      
      // Update the strategy with the client
      Object.assign(this, {client: this.client});
      
      this.logger.log('Okta OIDC strategy initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Okta OIDC strategy: ${error.message}`);
      console.error(error);
      // Continue running even if Okta strategy initialization fails
      // This allows the application to start and other auth methods to work
    }
  }

  /**
   * Validate the user from the TokenSet and Userinfo
   * This is the verify callback function for passport-openid-client
   */
  async validate(tokenSet: TokenEndpointResponse, userinfo: UserInfoResponse) {
    this.logger.log(`Validating Okta user with email: ${userinfo.email}`);
    
    if (!userinfo.email) {
      this.logger.error('Email not provided in Okta userinfo response');
      throw new UnauthorizedException('Email is required for authentication');
    }
    
    if (userinfo.email_verified !== true) {
      this.logger.warn(`User email ${userinfo.email} is not verified`);
      throw new UnauthorizedException('Email verification required');
    }
    
    try {
      const user = await this.authnService.validateOrCreateUser(
        userinfo.email,
        userinfo.given_name || '',
        userinfo.family_name || '',
        'okta'
      );
      
      this.logger.log(`Okta authentication successful for user: ${userinfo.email}`);
      return user;
    } catch (error) {
      this.logger.error(`Error validating Okta user: ${error.message}`);
      throw new UnauthorizedException('Failed to authenticate with Okta');
    }
  }
}