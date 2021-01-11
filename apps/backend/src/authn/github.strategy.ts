import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import axios from 'axios';
import {Strategy} from 'passport-github';
import {ConfigService} from '../config/config.service';
import {AuthnService} from './authn.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService
  ) {
    super({
      clientID: configService.get('GITHUB_CLIENTID') || 'disabled',
      clientSecret: configService.get('GITHUB_CLIENTSECRET') || 'disabled',
      scope: 'user:email',
      passReqToCallback: true
    });
  }

  async validate(
    req: Record<string, unknown>,
    accessToken: string
  ): Promise<any> {
    // Get user's linked emails from Github
    const githubEmails = await axios.get('https://api.github.com/user/emails', {
      headers: {Authorization: `token ${accessToken}`}
    });
    // Get user's info
    const userInfoResponse = await axios.get('https://api.github.com/user', {
      headers: {Authorization: `token ${accessToken}`}
    });
    const nameArray = userInfoResponse.data.name.split(' ');
    const firstName: string = nameArray.slice(0, -1).join(' ');
    const lastName = nameArray[nameArray.length - 1];
    // Get first email
    const primaryEmail = githubEmails.data[0];
    // Only validate if the user has verified their email with Github
    if (primaryEmail.verified) {
      // Check if the user already exists, if not they will be created
      return this.authnService.oauthValidateUser(
        primaryEmail.email,
        firstName,
        lastName
      );
    } else {
      throw new UnauthorizedException(
        'Please verify your email with Github before logging into Heimdall.'
      );
    }
  }
}
