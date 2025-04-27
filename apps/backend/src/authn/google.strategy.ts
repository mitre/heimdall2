import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {OAuth2Strategy} from 'passport-google-oauth';
import {ConfigService} from '../config/config.service';
import {User} from '../users/user.model';
import {AuthnService} from './authn.service';

interface UserEmail {
  value: string;
  verified: boolean;
}

interface GoogleProfile {
  name: {
    familyName: string;
    givenName: string;
  };
  emails: UserEmail[];
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(OAuth2Strategy, 'google') {
  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENTID') || 'disabled',
      clientSecret: configService.get('GOOGLE_CLIENTSECRET') || 'disabled',
      callbackURL: configService.get('EXTERNAL_URL')
        ? `${configService.get('EXTERNAL_URL')}/authn/google/callback`
        : 'disabled',
      scope: ['email', 'profile']
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile
  ): Promise<User> {
    const {name, emails} = profile;
    const user = {
      email: emails[0],
      firstName: name.givenName,
      lastName: name.familyName
    };
    if (user.email.verified) {
      return this.authnService.validateOrCreateUser(
        user.email.value,
        user.firstName,
        user.lastName,
        'google'
      );
    } else {
      throw new UnauthorizedException(
        'Please verify your email with Google before logging into Heimdall.'
      );
    }
  }
}
