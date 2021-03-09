import {Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {compare} from 'bcrypt';
import * as crypto from 'crypto';
import {ConfigService} from '../config/config.service';
import {StatisticsService} from '../statistics/statistics.service';
import {CreateUserDto} from '../users/dto/create-user.dto';
import {User} from '../users/user.model';
import {UsersService} from '../users/users.service';

@Injectable()
export class AuthnService {
  constructor(
    private usersService: UsersService,
    private readonly statisticsService: StatisticsService,
    private readonly configService: ConfigService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    let user: User;
    try {
      user = await this.usersService.findByEmail(email);
    } catch {
      throw new UnauthorizedException('Incorrect Username or Password');
    }
    if (user && (await compare(password, user.encryptedPassword))) {
      this.usersService.updateLoginMetadata(user);
      this.statisticsService.incrementLoginCount();
      return user;
    } else {
      return null;
    }
  }

  async validateOrCreateUser(
    email: string,
    firstName: string,
    lastName: string,
    creationMethod: string
  ): Promise<User> {
    let user: User;
    try {
      user = await this.usersService.findByEmail(email);
    } catch {
      const randomPass = crypto.randomBytes(128).toString('hex');
      const createUser: CreateUserDto = {
        email: email,
        password: randomPass,
        passwordConfirmation: randomPass,
        firstName: firstName,
        lastName: lastName,
        organization: '',
        title: '',
        role: 'user',
        creationMethod: creationMethod
      };
      await this.usersService.create(createUser);
      user = await this.usersService.findByEmail(email);
    }

    if (user) {
      // If the users info has changed since they last logged in it will be reflected here.
      // Because we find the user by their email, we can't detect a change in email.
      if (user.firstName !== firstName || user.lastName !== lastName) {
        user.firstName = firstName;
        user.lastName = lastName;
        user.save();
      }
      this.usersService.updateLoginMetadata(user);
    }

    return user;
  }

  async login(user: {
    id: string;
    email: string;
    role: string;
    forcePasswordChange: boolean | undefined;
  }): Promise<{userID: string; accessToken: string}> {
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

  splitName(fullName: string): {firstName: string; lastName: string} {
    const nameArray = fullName.split(' ');
    return {
      firstName: nameArray.slice(0, -1).join(' '),
      lastName: nameArray[nameArray.length - 1]
    };
  }
}
