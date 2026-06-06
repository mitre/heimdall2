import {ForbiddenException, Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import HeaderAPIKeyStrategy from 'passport-headerapikey';
import type {SelectGroup, SelectUser} from '../db/zod-schemas';
import {AuthnService} from './authn.service';

@Injectable()
export class APIKeyStrategy extends PassportStrategy(
  HeaderAPIKeyStrategy,
  'apikey',
) {
  constructor(private readonly authnService: AuthnService) {
    super({header: 'Authorization', prefix: 'Api-Key '}, false);
  }

  async validate(
    apikey: string,
    done: (
      exception: null | ForbiddenException,
      user: Promise<SelectUser | SelectGroup | null> | boolean,
    ) => unknown,
  ) {
    const auth = this.authnService.validateApiKey(apikey);
    if (await auth) {
      return done(null, auth);
    } else {
      return done(new ForbiddenException('Bad Api-Key'), auth);
    }
  }
}
