import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-local';
import {User} from '../users/user.model';
import {AuthnService} from './authn.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authnService: AuthnService) {
    super({
      usernameField: 'email'
    });
  }

  async validate(email: string, password: string): Promise<User> {
    const user = await this.authnService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Incorrect Username or Password');
    }
    return user;
  }
}
