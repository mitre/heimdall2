import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthnService } from './authn.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authnService: AuthnService) {
    super();
  }

  // The validate method MUST implement username as a parameter even
  // though its reall any email.
  async validate(username: string, password: string): Promise<any> {
    const user = await this.authnService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
