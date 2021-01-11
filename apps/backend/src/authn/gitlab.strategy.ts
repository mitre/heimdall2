import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-gitlab2';
import {ConfigService} from '../config/config.service';
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
  ): Promise<any> {
    const nameArray = profile._json.name.split(' ');
    const email = profile.emails[0].value;
    const firstName: string = nameArray.slice(0, -1).join(' ');
    const lastName = nameArray[nameArray.length - 1];
    return this.authnService.oauthValidateUser(email, firstName, lastName);
  }
}
