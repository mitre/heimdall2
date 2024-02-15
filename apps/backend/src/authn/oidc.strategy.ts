import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-openidconnect';
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
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService,
    private readonly groupsService: GroupsService
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
      async function (
        //changed from 4-arity function to 9-arity, because 'profile' in 4-arity was not providing required data
        //by changing to 9-arity we can access the data we need from the 'uiProfile' parameter
        //the lack of needed data in 4-arity function may be a bug
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
        const userData = uiProfile._json;
        const {given_name, family_name, email, email_verified, groups} =
          userData;
        if (email_verified) {
          const user = await authnService.validateOrCreateUser(
            email,
            given_name,
            family_name,
            'oidc'
          );

          if (
            configService.get('OIDC_EXTERNAL_GROUPS') === 'true' &&
            groups !== undefined
          ) {
            await groupsService.syncUserGroups(user, groups);
          }

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
