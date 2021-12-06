import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import axios from 'axios';
import {Strategy} from 'passport-github';
import {ConfigService} from '../config/config.service';
import {User} from '../users/user.model';
import {AuthnService} from './authn.service';

interface GithubProfile {
  name: string | null;
  login: string;
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
      authorizationURL: `
        ${
          configService.get('GITHUB_ENTERPRISE_INSTANCE_BASE_URL') ||
          configService.defaultGithubBaseURL
        }login/oauth/authorize`,
      tokenURL: `${
        configService.get('GITHUB_ENTERPRISE_INSTANCE_BASE_URL') ||
        configService.defaultGithubBaseURL
      }login/oauth/access_token`,
      userProfileURL: `${
        configService.get('GITHUB_ENTERPRISE_INSTANCE_API_URL') ||
        configService.defaultGithubAPIURL
      }user`,
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
      .get<GithubEmail[]>(
        `${
          this.configService.get('GITHUB_ENTERPRISE_INSTANCE_API_URL') ||
          this.configService.defaultGithubAPIURL
        }user/emails`,
        {
          headers: {Authorization: `token ${accessToken}`}
        }
      )
      .then(({data}) => {
        return data;
      });
    // Get user's info
    const userInfoResponse = await axios
      .get<GithubProfile>(
        `${
          this.configService.get('GITHUB_ENTERPRISE_INSTANCE_API_URL') ||
          this.configService.defaultGithubAPIURL
        }user`,
        {
          headers: {Authorization: `token ${accessToken}`}
        }
      )
      .then(({data}) => {
        return data;
      });
    let firstName = userInfoResponse.login;
    let lastName = '';
    if (typeof userInfoResponse.name === 'string') {
      firstName = this.authnService.splitName(userInfoResponse.name).firstName;
      lastName = this.authnService.splitName(userInfoResponse.name).lastName;
    }

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
