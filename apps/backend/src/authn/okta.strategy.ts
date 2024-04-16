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
        // Like in oidc.strategy.ts, we changed the arity of the function to 9 to access the data we need from 'uiProfile' due to updates in the passport-openidconnect library which otherwise caused failures in the authentication process
        // NOTE: Some variables are not used in this function, but they are required to be present in the function signature. These are indicated with an underscore prefix.
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
