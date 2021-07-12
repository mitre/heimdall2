import {Injectable} from '@nestjs/common';
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
        done: (arg1: null, arg2: Promise<User | null> | boolean) => unknown
      ) => {
        return done(null, this.authnService.validateApiKey(apikey));
      }
    );
  }
}
