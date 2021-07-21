import {ForbiddenException, Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import HeaderAPIKeyStrategy from 'passport-headerapikey';
import {User} from '../users/user.model';
import {AuthnService} from './authn.service';

@Injectable()
export class APIKeyStrategy extends PassportStrategy(
  HeaderAPIKeyStrategy,
  'apikey'
) {
  constructor(private readonly authnService: AuthnService) {
    super(
      {header: 'Authorization', prefix: 'Api-Key '},
      false,
      async (
        apikey: string,
        done: (
          exception: null | ForbiddenException,
          user: Promise<User | null> | boolean
        ) => unknown
      ) => {
        const user = this.authnService.validateApiKey(apikey);
        if (await user) {
          return done(null, user);
        } else {
          return done(new ForbiddenException('Bad Api-Key'), user);
        }
      }
    );
  }
}
