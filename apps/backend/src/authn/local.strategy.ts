import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Request} from 'express';
import {CallBack} from 'ldapjs';
import {Strategy} from 'passport-local';
import {LoggingService} from '../logging/logging.service';
import {User} from '../users/user.model';
import {UsersService} from '../users/users.service';
import {AuthnService} from './authn.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authnService: AuthnService,
    private readonly loggingService: LoggingService,
    private readonly usersService: UsersService
  ) {
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
      this.loggingService.logAuthenticationAction(
        req,
        'Failed Login As',
        await this.usersService.findByEmail(email)
      );
      throw new UnauthorizedException('Incorrect Username or Password');
    }
    return user;
  }
}
