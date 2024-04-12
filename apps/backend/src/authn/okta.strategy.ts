import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-openidconnect';
import {ConfigService} from '../config/config.service';
import {AuthnService} from './authn.service';

interface OktaProfile {
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
        callbackURL: `${configService.get('EXTERNAL_URL')}/authn/okta/callback`,
        scope: 'openid email profile'
      },
      async function (
        _issuer: string,
        uiProfile: OktaProfile,
        _idProfile: object,
        _context: object,
        _idToken: string,
        _accessToken: string,
        _refreshToken: string,
        _params: object,
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        done: any
      ) {
        const userData = uiProfile._json;
        const {given_name, family_name, email, email_verified} = userData;
        if (email_verified) {
          const user = await authnService.validateOrCreateUser(
            email,
            given_name,
            family_name,
            'okta'
          );
          return done(null, user);
        } else {
          throw new UnauthorizedException('Incorrect Username or Password');
        }
      }
    );
  }
}
