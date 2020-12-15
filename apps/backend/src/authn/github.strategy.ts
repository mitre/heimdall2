import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import axios from 'axios';
import {Strategy} from 'passport-github';
import {AuthnService} from './authn.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private authnService: AuthnService) {
    super({
      clientID: process.env.GITHUB_CLIENTID,
      clientSecret: process.env.GITHUB_CLIENTSECRET,
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
    // Get first email
    const primaryEmail = githubEmails.data[0];
    console.log(primaryEmail);
    // Only validate if the user has verified their email with Github
    if (primaryEmail.verified) {
      // Check if the user already exists, if not they will be created
      const user = await this.authnService.oauthValidateUser(
        primaryEmail.email
      );
      // Return session
      return user;
    } else {
      throw new UnauthorizedException(
        'You need to verify your email with Github before you can log into Heimdall.'
      );
    }
  }
}
