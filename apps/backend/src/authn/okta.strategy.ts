import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-openidconnect';
import {ConfigService} from '../config/config.service';
import {AuthnService} from './authn.service';

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
      (req: any, token: any, tokenSecret: any, profile: any, done: any) => {
        const userData = profile._json;
        const firstName = userData.given_name;
        const lastName = userData.family_name;
        const email = userData.email;
        const emailVerified = userData.email_verified;
        if (emailVerified) {
          const user = this.authnService.oauthValidateUser(
            email,
            firstName,
            lastName
          );
          return done(null, user);
        } else {
          throw new UnauthorizedException('Incorrect Username or Password');
        }
      }
    );
  }
}
