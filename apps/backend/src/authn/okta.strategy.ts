import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy, OktaProfile} from 'passport-okta-oauth20';
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
        audience: `https://${configService.get('OKTA_DOMAIN') || 'disabled'}`,
        clientID: configService.get('OKTA_CLIENTID') || 'disabled',
        clientSecret: configService.get('OKTA_CLIENTSECRET') || 'disabled',
        scope: ['openid', 'email', 'profile'],
        callbackURL: `${configService.get('EXTERNAL_URL') || 'disabled'}/authn/okta/callback`
      },
      async function (
        accessToken: string,
        refreshToken: string,
        profile: OktaProfile,
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        done: any
      ) {
        const {givenName, familyName, email, emailVerified} = profile;
        if (emailVerified) {
          const user = await authnService.validateOrCreateUser(
            email,
            givenName,
            familyName,
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
