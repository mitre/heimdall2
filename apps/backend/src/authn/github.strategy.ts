import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import axios from 'axios';
import {Strategy} from 'passport-github';
import {ConfigService} from '../config/config.service';
import {User} from '../users/user.model';
import {AuthnService} from './authn.service';

interface GithubProfile {
  name: string;
}

interface GithubEmail {
  email: string;
  verified: boolean;
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService
  ) {
    super({
      clientID: configService.get('GITHUB_CLIENTID') || 'disabled',
      clientSecret: configService.get('GITHUB_CLIENTSECRET') || 'disabled',
      authorizationURL:
        configService.get('GITHUB_ENTERPRISE_INSTANCE_URL') ||
        'https://github.com/login/oauth/authorize',
      tokenURL:
        configService.get('GITHUB_ENTERPRISE_TOKEN_URL') ||
        'https://github.com/login/oauth/access_token',
      userProfileURL:
        configService.get('GITHUB_ENTERPRISE_PROFILE_URL') ||
        'https://github.com/api/v3/user',
      scope: 'user:email',
      passReqToCallback: true
    });
  }

  async validate(
    req: Record<string, unknown>,
    accessToken: string
  ): Promise<User> {
    // Get user's linked emails from Github
    const githubEmails = await axios
      .get(
        this.configService.get('GITHUB_ENTERPRISE_EMAIL_URL') ||
          'https://api.github.com/user/emails',
        {
          headers: {Authorization: `token ${accessToken}`}
        }
      )
      .then((response): GithubEmail[] => {
        return response.data;
      });
    // Get user's info
    const userInfoResponse = await axios
      .get(
        this.configService.get('GITHUB_ENTERPRISE_PROFILE_URL') ||
          'https://api.github.com/user',
        {
          headers: {Authorization: `token ${accessToken}`}
        }
      )
      .then(
        (response): GithubProfile => {
          return response.data;
        }
      );
    const {firstName, lastName} = this.authnService.splitName(
      userInfoResponse.name
    );
    // Get first email
    const primaryEmail = githubEmails[0];
    // Only validate if the user has verified their email with Github
    if (primaryEmail.verified) {
      // Check if the user already exists, if not they will be created
      return this.authnService.validateOrCreateUser(
        primaryEmail.email,
        firstName,
        lastName,
        'github'
      );
    } else {
      throw new UnauthorizedException(
        'Please verify your email with Github before logging into Heimdall.'
      );
    }
  }
}
