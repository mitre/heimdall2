import type { Agent } from 'http';
import { Strategy } from '@govtechsg/passport-openidconnect';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import winston from 'winston';
import { ConfigService } from '../config/config.service';
import { GroupsService } from '../groups/groups.service';
import { AuthnService } from './authn.service';

type OIDCProfile = {
  _json: {
    email: string;
    email_verified: boolean;
    family_name: string;
    given_name: string;
    groups: string[];
  };
  _raw: string;
  displayName: string;
  emails: [{ value: string }];
  id: string;
  name: { familyName: string; givenName: string };
};

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy as any, 'oidc') {
  public loggingTimeFormat = 'MMM-DD-YYYY HH:mm:ss Z';
  private readonly line = '_______________________________________________\n';
  public logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp({ format: this.loggingTimeFormat }),
      winston.format.printf(
        info =>
          `${this.line}[${[info.timestamp]}] (Authn Service): ${info.message}`,
      ),
    ),
    transports: [new winston.transports.Console()],
  });

  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService,
    private readonly groupsService: GroupsService,
    private readonly httpsAgent?: Agent,
  ) {
    super(
      {
        agent: httpsAgent,
        authorizationURL:
          configService.get('OIDC_AUTHORIZATION_URL') || 'disabled',
        callbackURL: `${configService.getExternalUrl()}/authn/oidc_callback`,
        clientID: configService.get('OIDC_CLIENTID') || 'disabled',
        clientSecret: configService.get('OIDC_CLIENT_SECRET') || 'disabled',
        issuer: configService.get('OIDC_ISSUER') || 'disabled',
        pkce:
          configService.get('OIDC_USES_PKCE_S256') === 'true'
            ? 'S256'
            : (configService.get('OIDC_USES_PKCE_PLAIN') === 'true'
              ? 'plain'
              : undefined),
        proxy:
          configService.get('OIDC_USE_HTTPS_PROXY') === 'true'
            ? true
            : undefined,
        scope: ['openid', 'email', 'profile'],
        skipUserProfile: false,
        tokenURL: configService.get('OIDC_TOKEN_URL') || 'disabled',
        userInfoURL: configService.get('OIDC_USER_INFO_URL') || 'disabled',
      },
      // using the 9-arity function so that we can access the underlying JSON response and extract the 'email_verified' attribute
      async (
        _issuer: string,
        uiProfile: OIDCProfile,
        _idProfile: object,
        _context: object,
        _idToken: string,
        _accessToken: string,
        _refreshToken: string,
        _params: object,

        done: any,
      ) => {
        return this.validate(
          _issuer,
          uiProfile,
          _idProfile,
          _context,
          _idToken,
          _accessToken,
          _refreshToken,
          _params,
          done,
        );
      },
    );
  }

  async validate(
    _issuer: string,
    uiProfile: OIDCProfile,
    _idProfile: object,
    _context: object,
    _idToken: string,
    _accessToken: string,
    _refreshToken: string,
    _params: object,

    done: any,
  ) {
    this.logger.debug('in oidc strategy file');
    this.logger.debug(JSON.stringify(uiProfile, null, 2));
    const userData = uiProfile._json;
    const { email, email_verified, family_name, given_name, groups } = userData;
    if (
      this.configService.get('OIDC_USES_VERIFIED_EMAIL') === 'false'
      || email_verified
    ) {
      const user = await this.authnService.validateOrCreateUser(
        email,
        given_name,
        family_name,
        'oidc',
      );

      if (
        this.configService.get('OIDC_EXTERNAL_GROUPS') === 'true'
        && groups !== undefined
      ) {
        await this.groupsService.syncUserGroups(user, groups);
      }

      return done(null, user);
    }
    return done(
      new UnauthorizedException(
        'Please verify your name and email with your identity provider before logging into Heimdall.',
      ),
    );
  }
}
