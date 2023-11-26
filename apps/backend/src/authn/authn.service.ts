import {
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {compare} from 'bcryptjs';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import moment from 'moment';
import ms from 'ms';
import winston from 'winston';
import {ApiKeyService} from '../apikeys/apikey.service';
import {ConfigService} from '../config/config.service';
import {Group} from '../groups/group.model';
import {limitJWTTime} from '../token/token.providers';
import {CreateUserDto} from '../users/dto/create-user.dto';
import {User} from '../users/user.model';
import {UsersService} from '../users/users.service';

@Injectable()
export class AuthnService {
  private readonly line = '_______________________________________________\n';
  public loggingTimeFormat = 'MMM-DD-YYYY HH:mm:ss Z';
  public logger = winston.createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.timestamp({
        format: this.loggingTimeFormat
      }),
      winston.format.printf((info) => `${this.line}[${[info.timestamp]}] (Authn Service): ${info.message}`)
    )
  });

  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
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
      return user;
    } else {
      return null;
    }
  }

  async validateApiKey(apikey: string): Promise<User | Group | null> {
    const APIKeySecret = this.configService.get('API_KEY_SECRET');
    if (APIKeySecret) {
      try {
        const jwtPayload = jwt.verify(apikey, APIKeySecret) as {
          token: string;
          keyId: string;
          createdAt: Date;
        };
        const JWTSignature = apikey.split('.')[2];
        if (_.has(jwtPayload, 'keyId')) {
          const matchingKey = await this.apiKeyService.findById(
            jwtPayload.keyId
          );
          if (await compare(JWTSignature, matchingKey.apiKey)) {
            if (matchingKey.type === 'user') {
              return matchingKey.user;
            } else if (matchingKey.type === 'group') {
              return matchingKey.group;
            } else {
              return null;
            }
          } else {
            return null;
          }
        } else {
          return null;
        }
      } catch {
        return null;
      }
    } else {
      throw new ForbiddenException(
        'API Keys have been disabled as the API-Key secret is not set'
      );
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
    // Users have their own JWT Secret to allow for session invalidation on sign out
    const loginUser = await this.usersService.findById(user.id);
    if (
      !loginUser.jwtSecret ||
      this.configService.get('ONE_SESSION_PER_USER')?.toLowerCase() === 'true'
    ) {
      this.usersService.updateUserSecret(loginUser);
    }
    if (payload.forcePasswordChange || user.role === 'admin') {
      // Admin sessions are only valid for 10 minutes, for regular users give them 10 minutes to (hopefully) change their password.
      const expireTime = moment(new Date(Date.now() + ms('600s'))).format(
        this.loggingTimeFormat
      );
      this.logger.info({
        message: `New session for User<ID: ${user.id}> expires at ${expireTime}`
      });
      return {
        userID: user.id,
        accessToken: this.jwtService.sign(payload, {
          expiresIn: '600s',
          secret: this.configService.get('JWT_SECRET') + loginUser.jwtSecret
        })
      };
    } else {
      const expiresIn = limitJWTTime(
        this.configService.get('JWT_EXPIRE_TIME') || '60s',
        false
      );
      const expireTime = moment(new Date(Date.now() + expiresIn)).format(
        this.loggingTimeFormat
      );
      this.logger.info({
        message: `New session for User<ID: ${user.id}> expires at ${expireTime}`
      });
      return {
        userID: user.id,
        accessToken: this.jwtService.sign(payload, {
          secret: this.configService.get('JWT_SECRET') + loginUser.jwtSecret
        })
      };
    }
  }

  splitName(fullName: string): {firstName: string; lastName: string} {
    const nameArray = fullName.split(' ');
    return {
      firstName: nameArray[0],
      lastName: nameArray.slice(1).join(' ')
    };
  }

  async testPassword(
    updateUserDto: {currentPassword?: string},
    user: User
  ): Promise<void> {
    try {
      if (
        !(await compare(
          updateUserDto.currentPassword || '',
          user.encryptedPassword
        ))
      ) {
        throw new ForbiddenException('Current password is incorrect');
      }
    } catch {
      throw new ForbiddenException('Current password is incorrect');
    }
  }
}
