import type {Agent} from 'http';
import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from '@govtechsg/passport-openidconnect';
import winston from 'winston';
import {ConfigService} from '../config/config.service';
import {GroupsService} from '../groups/groups.service';
import { User } from '../users/user.model';
import {AuthnService} from './authn.service';

interface OIDCProfile {
  id: string;
  displayName: string;
  name: {familyName: string; givenName: string};
  emails: [{value: string}];
  _raw: string;
  _json: {
    given_name: string;
    family_name: string;
    email: string;
    email_verified: boolean;
    groups: string[];
  };
}

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc', 9) {
  private readonly line = '_______________________________________________\n';
  public loggingTimeFormat = 'MMM-DD-YYYY HH:mm:ss Z';
  public logger = winston.createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.timestamp({
        format: this.loggingTimeFormat
      }),
      winston.format.printf(
        (info) =>
          `${this.line}[${[info.timestamp]}] (Authn Service): ${info.message}`
      )
    )
  });

  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService,
    private readonly groupsService: GroupsService,
    private readonly httpsAgent?: Agent
  ) {
    super({
      issuer: configService.get('OIDC_ISSUER') || 'disabled',
      authorizationURL:
        configService.get('OIDC_AUTHORIZATION_URL') || 'disabled',
      tokenURL: configService.get('OIDC_TOKEN_URL') || 'disabled',
      userInfoURL: configService.get('OIDC_USER_INFO_URL') || 'disabled',
      clientID: configService.get('OIDC_CLIENTID') || 'disabled',
      clientSecret: configService.get('OIDC_CLIENT_SECRET') || 'disabled',
      callbackURL: `${configService.getExternalUrl()}/authn/oidc_callback`,
      pkce:
        configService.get('OIDC_USES_PKCE_S256') === 'true'
          ? 'S256'
          : configService.get('OIDC_USES_PKCE_PLAIN') === 'true'
            ? 'plain'
            : undefined,
      scope: ['openid', 'email', 'profile'],
      skipUserProfile: false,
      proxy:
        configService.get('OIDC_USE_HTTPS_PROXY') === 'true'
          ? true
          : undefined,
      agent: httpsAgent
    });
  }

  async validate(...parameters: [
    string,
    OIDCProfile,
    object,
    object,
    string,
    string,
    string,
    object,
  ]): Promise<User> {
    const [, uiProfile] = parameters;
    this.logger.debug('in oidc strategy file');
    this.logger.debug(JSON.stringify(uiProfile, null, 2));
    const userData = uiProfile._json;
    const {given_name, family_name, email, email_verified, groups} = userData;
    if (
      this.configService.get('OIDC_USES_VERIFIED_EMAIL') === 'false' ||
      email_verified
    ) {
      const user = await this.authnService.validateOrCreateUser(
        email,
        given_name,
        family_name,
        'oidc'
      );

      if (
        this.configService.get('OIDC_EXTERNAL_GROUPS') === 'true' &&
        groups !== undefined
      ) {
        await this.groupsService.syncUserGroups(user, groups);
      }

      return user;
    }
    throw new UnauthorizedException(
      'Please verify your name and email with your identity provider before logging into Heimdall.'
    );
  }
}
