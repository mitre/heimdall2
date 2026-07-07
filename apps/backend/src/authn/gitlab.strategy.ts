import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-gitlab2';
import { ConfigService } from '../config/config.service';
import { User } from '../users/user.model';
import { AuthnService } from './authn.service';

type GitlabProfile = {
  displayName: string;
  emails: UserEmail[];
  username: string;
};

type UserEmail = { value: string };

@Injectable()
export class GitlabStrategy extends PassportStrategy(Strategy, 'gitlab') {
  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService,
  ) {
    super({
      baseURL: configService.get('GITLAB_BASEURL'),
      callbackURL:
        `${configService.getExternalUrl()}/authn/gitlab/callback` || 'disabled',
      clientID: configService.get('GITLAB_CLIENTID') || 'disabled',
      clientSecret: configService.get('GITLAB_SECRET') || 'disabled',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GitlabProfile,
  ): Promise<User> {
    const email = profile.emails[0].value;
    const { firstName, lastName } = this.authnService.splitName(
      profile.displayName,
    );
    return this.authnService.validateOrCreateUser(
      email,
      firstName,
      lastName,
      'gitlab',
    );
  }
}
