import type { Agent } from 'http';
import { Strategy } from '@govtechsg/passport-openidconnect';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import winston from 'winston';
import { ConfigService } from '../config/config.service';
import { AuthnService } from './authn.service';

type Profile = {
  displayName: string;
  emails: { value: string }[];
  id: string;
  name: {
    familyName: string;
    givenName: string;
    middleName: string;
  };
  provider: string;
};

@Injectable()

export class OktaStrategy extends PassportStrategy(Strategy as any, 'okta') {
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
    private readonly httpsAgent?: Agent,
  ) {
    super(
      {
        agent: httpsAgent,
        authorizationURL:
          configService.get('OKTA_AUTHORIZATION_URL')
          || `https://${configService.get('OKTA_DOMAIN') || 'disabled'}/oauth2/v1/authorize`,
        callbackURL: `${configService.getExternalUrl()}/authn/okta_callback`,
        clientID: configService.get('OKTA_CLIENTID') || 'disabled',
        clientSecret: configService.get('OKTA_CLIENTSECRET') || 'disabled',
        issuer:
          configService.get('OKTA_ISSUER_URL')
          || `https://${configService.get('OKTA_DOMAIN')}`
          || 'disabled',
        proxy:
          configService.get('OKTA_USE_HTTPS_PROXY') === 'true'
            ? true
            : undefined,
        scope: ['openid', 'email', 'profile'],
        skipUserProfile: false,
        tokenURL:
          configService.get('OKTA_TOKEN_URL')
          || `https://${configService.get('OKTA_DOMAIN') || 'disabled'}/oauth2/v1/token`,
        userInfoURL:
          configService.get('OKTA_USER_INFO_URL')
          || `https://${configService.get('OKTA_DOMAIN') || 'disabled'}/oauth2/v1/userinfo`,
      },
      // Okta has no concept of a 'verified' email - the account has to have an email address associated with it - which is why we can use the 3-arity function since we don't need access to the underlying JSON response
      async (
        _issuer: string,
        profile: Profile,

        done: any,
      ) => {
        return this.validate(_issuer, profile, done);
      },
    );
  }

  async validate(
    _issuer: string,
    profile: Profile,

    done: any,
  ) {
    this.logger.debug('in okta strategy file');
    this.logger.debug(JSON.stringify(profile, null, 2));
    if (profile.emails.length > 0 && profile.emails[0].value) {
      const user = await this.authnService.validateOrCreateUser(
        profile.emails[0].value,
        profile.name.givenName,
        profile.name.familyName,
        'okta',
      );
      return done(null, user);
    }
    return done(new UnauthorizedException('Incorrect Username or Password'));
  }
}
