import type {Agent} from 'http';
import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from '@govtechsg/passport-openidconnect';
import winston from 'winston';
import {ConfigService} from '../config/config.service';
import {GroupsService} from '../groups/groups.service';
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
//eslint-disable-next-line @typescript-eslint/no-explicit-any -- Passport v11 changed their types and many 3rd party strategies are not compatible with the types despite actually still working just fine
export class OidcStrategy extends PassportStrategy(Strategy as any, 'oidc') {
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
    super(
      {
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
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        done: any
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
          done
        );
      }
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
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    done: any
  ) {
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

      return done(null, user);
    }
    return done(
      new UnauthorizedException(
        'Please verify your name and email with your identity provider before logging into Heimdall.'
      )
    );
  }
}
