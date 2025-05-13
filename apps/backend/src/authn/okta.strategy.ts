import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from '@govtechsg/passport-openidconnect';
import {ConfigService} from '../config/config.service';
import {AuthnService} from './authn.service';

type Profile = {
  provider: string;
  id: string;
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
    middleName: string;
  };
  emails: {value: string}[];
};

@Injectable()
export class OktaStrategy extends PassportStrategy(Strategy, 'okta') {
  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService
  ) {
    super(
      {
        issuer:
          configService.get('OKTA_ISSUER_URL') ||
          `https://${configService.get('OKTA_DOMAIN')}` ||
          'disabled',
        authorizationURL:
          configService.get('OKTA_AUTHORIZATION_URL') ||
          `https://${configService.get('OKTA_DOMAIN') || 'disabled'}/oauth2/v1/authorize`,
        tokenURL:
          configService.get('OKTA_TOKEN_URL') ||
          `https://${configService.get('OKTA_DOMAIN') || 'disabled'}/oauth2/v1/token`,
        userInfoURL:
          configService.get('OKTA_USER_INFO_URL') ||
          `https://${configService.get('OKTA_DOMAIN') || 'disabled'}/oauth2/v1/userinfo`,
        clientID: configService.get('OKTA_CLIENTID') || 'disabled',
        clientSecret: configService.get('OKTA_CLIENTSECRET') || 'disabled',
        callbackURL: `${configService.get('EXTERNAL_URL')}/authn/okta_callback`,
        scope: ['openid', 'email', 'profile'],
        skipUserProfile: false
      },
      // Okta has no concept of a 'verified' email - the account has to have an email address associated with it - which is why we can use the 3-arity function since we don't need access to the underlying JSON response
      async function (
        _issuer: string,
        profile: Profile,
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        done: any
      ) {
        console.log('profile object');
        console.log(JSON.stringify(profile, null, 2));
        if (profile.emails.length > 0 && profile.emails[0].value) {
          const user = await authnService.validateOrCreateUser(
            profile.emails[0].value,
            profile.name.givenName,
            profile.name.familyName,
            'okta'
          );
          return done(null, user);
        }
        return done(
          new UnauthorizedException('Incorrect Username or Password')
        );
      }
    );
  }
}
