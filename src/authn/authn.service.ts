import {Injectable} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {UsersService} from '../users/users.service';
import {User} from '../users/user.model';
import {compare} from 'bcrypt';
import {ConfigService} from '../config/config.service';

@Injectable()
export class AuthnService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findModelByEmail(email);
    if (user && (await compare(password, user.encryptedPassword))) {
      this.usersService.updateLoginMetadata(user);
      return user;
    } else {
      return null;
    }
  }

  async login(user: User): Promise<any> {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      forcePasswordChange: user.forcePasswordChange
    };
    if (payload.forcePasswordChange) {
      // Give the user 10 minutes to (hopefully) change their password.
      return {
        accessToken: this.jwtService.sign(payload, {expiresIn: '600s'})
      };
    } else {
      return {
        accessToken: this.jwtService.sign(payload)
      };
    }
  }
}
