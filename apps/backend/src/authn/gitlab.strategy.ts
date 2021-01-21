import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-gitlab2';
import {ConfigService} from '../config/config.service';
import {User} from '../users/user.model';
import {AuthnService} from './authn.service';

@Injectable()
export class GitlabStrategy extends PassportStrategy(Strategy, 'gitlab') {
  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService
  ) {
    super({
      clientID: configService.get('GITLAB_CLIENTID') || 'disabled',
      clientSecret: configService.get('GITLAB_SECRET') || 'disabled',
      callbackURL:
        `${configService.get('EXTERNAL_URL')}/authn/gitlab/callback` ||
        'disabled'
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: {
      [key: string]: any;
    }
  ): Promise<User> {
    const email = profile.emails[0].value;
    const {firstName, lastName} = this.authnService.splitName(
      profile._json.name
    );
    return this.authnService.oauthValidateUser(email, firstName, lastName);
  }
}
