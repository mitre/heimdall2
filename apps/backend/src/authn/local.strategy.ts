import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Request} from 'express';
import {CallBack} from 'ldapjs';
import {Strategy} from 'passport-local';
import {User} from '../users/user.model';
import {AuthnService} from './authn.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authnService: AuthnService) {
    super({
      usernameField: 'email',
      passReqToCallback: true
    });
  }

  async validate(
    req: Request,
    email: string,
    password: string,
    _done: CallBack
  ): Promise<User> {
    const user = await this.authnService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Incorrect Username or Password');
    }
    return user;
  }
}
