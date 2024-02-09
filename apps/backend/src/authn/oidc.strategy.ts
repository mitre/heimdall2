import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-openidconnect';
import {ConfigService} from '../config/config.service';
import {GroupsService} from '../groups/groups.service';
import {AuthnService} from './authn.service';
import { Context } from 'vm';

interface OIDCProfile {
  id: string;
  displayName: string;
  name: {familyName: string, givenName: string};
  emails: [ { value: string } ];
  _raw: string;
  _json: {
    given_name: string;
    family_name: string;
    email: string;
    email_verified: boolean;
    groups: string[];
  };
}


/*{
  id: undefined,
  displayName: 'Example User',
  name: { familyName: 'User', givenName: 'Example' },
  emails: [ { value: 'example@example.com' } ],
  _raw: '{"email":"example@example.com","email_verified":true,"name":"Example User","given_name":"Example","family_name":"User"}',
  _json: {
    email: 'example@example.com',
    email_verified: true,
    name: 'Example User',
    given_name: 'Example',
    family_name: 'User'
  }
} */

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
        issuer: any, //Unused param. Should be 'issuer' based on spec. 'issuer' is defined on line 27 of this file
        uiProfile: any,
        profile: OIDCProfile, //idProfile
        context: Context,
        idToken: any,
        _accessToken: string,
        _refreshToken: string, //profile: any, //Unused param. Should be 'context' based on spec. 'context' is not defined in this file
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params: any,
        done: any
      ) {
        //console.log(Object.keys(profile)); //['id']
        console.log(typeof profile);
        console.log(issuer);
        //console.log(uiProfile);
        console.log(profile);
        //console.log(profile['id']); // johndoe
        //console.log(context);
        //console.log(idToken);
        //console.log(_accessToken); //issuer: http://localhost:8082
        //console.log(_refreshToken); //context: {}
        //console.log(params);
        //console.log(done); //[Function: verified]
        const userData = profile._json;
        console.log(profile._json)
        console.log(userData);
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
