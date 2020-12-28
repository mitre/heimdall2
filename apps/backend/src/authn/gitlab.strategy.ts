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
        configService.get('GITLAB_CALLBACK') ||
        'http://127.0.0.1:3000/authn/gitlab/callback'
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: {
      [key: string]: any;
    }
  ): Promise<any> {
    const email = profile.emails[0].value;
    const firstName: string = profile._json.name.substr(
      0,
      profile._json.name.indexOf(' ')
    );
    const lastName: string = profile._json.name.substr(
      profile._json.name.indexOf(' ') + 1
    );
    return this.authnService.oauthValidateUser(email, firstName, lastName);
  }
}
