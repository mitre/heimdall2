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
        issuer: `https://${configService.get('OKTA_DOMAIN') || 'disabled'}`,
        authorizationURL: `https://${configService.get('OKTA_DOMAIN') || 'disabled'}/oauth2/v1/authorize`,
        tokenURL: `https://${configService.get('OKTA_DOMAIN') || 'disabled'}/oauth2/v1/token`,
        userInfoURL: `https://${configService.get('OKTA_DOMAIN') || 'disabled'}/oauth2/v1/userinfo`,
        clientID: configService.get('OKTA_CLIENTID') || 'disabled',
        clientSecret: configService.get('OKTA_CLIENTSECRET') || 'disabled',
        callbackURL: `${configService.get('EXTERNAL_URL') || 'disabled'}/authn/okta/callback`,
        scope: ['openid', 'email', 'profile']
      },
      async function (
        _issuer: string,
        profile: Profile,
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        done: any
      ) {
        if (profile.emails.length > 0 && profile.emails[0].value) {
          const user = await authnService.validateOrCreateUser(
            profile.emails[0].value,
            profile.name.givenName,
            profile.name.familyName,
            'okta'
          );
          return done(null, user);
        }
        throw new UnauthorizedException('Incorrect Username or Password');
      }
    );
  }
}
