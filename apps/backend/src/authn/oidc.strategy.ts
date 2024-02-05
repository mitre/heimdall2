import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-openidconnect';
import {ConfigService} from '../config/config.service';
import {AuthnService} from './authn.service';

interface OIDCProfile {
  _json: {
    given_name: string;
    family_name: string;
    email: string;
    email_verified: boolean;
  };
}

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService
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
        callbackURL: `${configService.get('EXTERNAL_URL')}/authn/oidc/callback`,
        scope: 'openid profile email'
      },
      function (
        _accessToken: string, //Should be 'issuer' based on spec, but may function as is. Defined on line 24
        profile: OIDCProfile, 
        _refreshToken: string, //Should be 'context' based on spec, but context is not defined in this file.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        done: any
      ) {
        const userData = profile._json;
        const {given_name, family_name, email, email_verified} = userData;
        if (email_verified) {
          const user = authnService.validateOrCreateUser(
            email,
            given_name,
            family_name,
            'oidc'
          );
          return done(null, user);
        } else {
          throw new UnauthorizedException(
            'Please verify your email with your identity provider before logging into Heimdall.'
          );
        }
      }
    );
  }
}
