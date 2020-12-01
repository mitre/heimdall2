import {Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {compare} from 'bcrypt';
import {User} from 'src/users/user.model';
import {UsersService} from '../users/users.service';

@Injectable()
export class AuthnService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    let user: User;
    try {
      user = await this.usersService.findModelByEmail(email);
    } catch {
      throw new UnauthorizedException('Incorrect Username or Password');
    }
    if (user && (await compare(password, user.encryptedPassword))) {
      this.usersService.updateLoginMetadata(user);
      return user;
    } else {
      return null;
    }
  }

  async login(user: {
    id: number;
    email: string;
    role: string;
    forcePasswordChange: boolean | undefined;
  }): Promise<{userID: number; accessToken: string}> {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      forcePasswordChange: user.forcePasswordChange
    };
    if (payload.forcePasswordChange) {
      // Give the user 10 minutes to (hopefully) change their password.
      return {
        userID: user.id,
        accessToken: this.jwtService.sign(payload, {expiresIn: '600s'})
      };
    } else {
      return {
        userID: user.id,
        accessToken: this.jwtService.sign(payload)
      };
    }
  }
}
