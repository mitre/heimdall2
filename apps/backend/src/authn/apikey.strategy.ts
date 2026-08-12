import { ForbiddenException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import HeaderAPIKeyStrategy from 'passport-headerapikey';
import { Group } from '../groups/group.model';
import { User } from '../users/user.model';
import { AuthnService } from './authn.service';

@Injectable()
export class APIKeyStrategy extends PassportStrategy(
  HeaderAPIKeyStrategy,
  'apikey',
) {
  constructor(private readonly authnService: AuthnService) {
    super({ header: 'Authorization', prefix: 'Api-Key ' }, false);
  }

  async validate(
    apikey: string,
    done: (
      exception: ForbiddenException | null,
      user: boolean | Promise<Group | null | User>,
    ) => unknown,
  ) {
    const auth = this.authnService.validateApiKey(apikey);
    return (await auth) ? done(null, auth) : done(new ForbiddenException('Bad Api-Key'), auth);
  }
}
