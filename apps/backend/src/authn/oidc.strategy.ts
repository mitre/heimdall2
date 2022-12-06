import {Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-openidconnect';
import {ConfigService} from '../config/config.service';
import {AuthnService} from './authn.service';
import {GroupsService} from '../groups/groups.service';
import {CreateGroupDto} from '../groups/dto/create-group.dto';
import {GroupDto} from '../groups/dto/group.dto';
import {User} from '../users/user.model';

interface OIDCProfile {
  _json: {
    given_name: string;
    family_name: string;
    email: string;
    email_verified: boolean;
    groups: Array<string>;
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
      function (
        _accessToken: string,
        _refreshToken: string,
        profile: OIDCProfile,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        done: any
      ) {
        const userData = profile._json;
        const {given_name, family_name, email, email_verified, groups} = userData;
        if (email_verified) {
          authnService.validateOrCreateUser(
            email,
            given_name,
            family_name,
            'oidc'
          ).then((user) => {

            if(configService.get('OIDC_EXTERNAL_GROUPS') === "true" && groups !== undefined) {

              // Check if user is any existing groups that they should not be
              user.$get('groups', {include: [User]}).then((currentGroups) => {
                currentGroups.filter(group => !groups.includes(group.name)).forEach((groupToLeave) => {
                  groupsService.removeUserFromGroup(groupToLeave, user);
                })
              })

              groups.forEach((group) => {
                groupsService.findByName(group).then((existingGroup) => {
                  // Check if the user is already in that group
                  user.$get('groups', {include: [User]}).then((groups) => {
                    var groupMap = groups.map((group) => new GroupDto(group));

                    if(!groupMap.includes(existingGroup)) {
                      groupsService.addUserToGroup(existingGroup, user, "member");
                    } 
                  });
                }).catch((err) => {
                  if(err instanceof NotFoundException) {

                    const createGroup: CreateGroupDto = {
                      name: group,
                      public: false
                    };

                    groupsService.create(createGroup).then((newGroup) => {
                      groupsService.addUserToGroup(newGroup, user, "member");
                    });
                  }
                });
              });
            }

            return done(null, user);
        })
        } else {
          throw new UnauthorizedException(
            'Please verify your email with your identity provider before logging into Heimdall.'
          );
        }
      }
    );
  }
}
