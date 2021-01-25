import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-openidconnect';
import {ConfigService} from '../config/config.service';
import {AuthnService} from './authn.service';

interface OktaProfile {
  [key: string]: any;
  _json: {
    given_name: string;
    family_name: string;
    email: string;
    email_verified: boolean;
    [key: string]: any;
  };
}

@Injectable()
export class OktaStrategy extends PassportStrategy(Strategy, 'okta') {
  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService
  ) {
    super(
      {
        issuer: `https://${
          configService.get('OKTA_DOMAIN') || 'disabled'
        }/oauth2/default`,
        authorizationURL: `https://${
          configService.get('OKTA_DOMAIN') || 'disabled'
        }/oauth2/default/v1/authorize`,
        tokenURL: `https://${
          configService.get('OKTA_DOMAIN') || 'disabled'
        }/oauth2/default/v1/token`,
        userInfoURL: `https://${
          configService.get('OKTA_DOMAIN') || 'disabled'
        }/oauth2/default/v1/userinfo`,
        clientID: configService.get('OKTA_CLIENTID') || 'disabled',
        clientSecret: configService.get('OKTA_CLIENTSECRET') || 'disabled',
        callbackURL:
          `${configService.get('EXTERNAL_URL')}/authn/okta/callback` ||
          'disabled',
        scope: 'openid email profile',
        passReqToCallback: true
      },
      (
        req: any,
        token: string,
        tokenSecret: string,
        profile: OktaProfile,
        done: any
      ) => {
        const userData = profile._json;
        const {given_name, family_name, email, email_verified} = userData;
        if (email_verified) {
          const user = this.authnService.oauthValidateUser(
            email,
            given_name,
            family_name
          );
          return done(null, user);
        } else {
          throw new UnauthorizedException('Incorrect Username or Password');
        }
      }
    );
  }
}
