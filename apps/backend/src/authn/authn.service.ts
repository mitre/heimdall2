import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {compare} from 'bcryptjs';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import moment from 'moment';
import ms from 'ms';
import winston from 'winston';
import {eq} from 'drizzle-orm';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';
import {AuthService} from '@thallesp/nestjs-better-auth';
import {ApiKeyService} from '../apikeys/apikey.service';
import {ConfigService} from '../config/config.service';
import {DRIZZLE} from '../db/drizzle.module';
import {ba_user, ba_account} from '../db/auth-schema.generated';
import type {SelectGroup, SelectUser} from '../db/zod-schemas';
import {limitJWTTime} from '../token/token.providers';
import {CreateUserDto} from '../users/dto/create-user.dto';
import {UsersService} from '../users/users.service';

export interface LoginUser {
  id: string;
  email: string;
  role: string;
  forcePasswordChange: boolean | null | undefined;
}

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
      winston.format.printf(
        (info) =>
          `${this.line}[${[info.timestamp]}] (Authn Service): ${info.message}`
      )
    )
  });

  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase,
    private readonly authService: AuthService,
    private readonly apiKeyService: ApiKeyService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<{id: string; email: string; role: string; forcePasswordChange: boolean | null} | null> {
    const [baUser] = await this.db
      .select()
      .from(ba_user)
      .where(eq(ba_user.email, email));
    if (baUser) {
      const [account] = await this.db
        .select()
        .from(ba_account)
        .where(eq(ba_account.userId, baUser.id));
      if (account?.password && (await compare(password, account.password))) {
        return {
          id: baUser.id,
          email: baUser.email,
          role: baUser.role ?? 'user',
          forcePasswordChange: baUser.forcePasswordChange,
        };
      }
    }

    try {
      const legacyUser = await this.usersService.findByEmail(email);
      if (legacyUser && (await compare(password, legacyUser.encryptedPassword))) {
        await this.usersService.updateLoginMetadata(legacyUser);
        return {
          id: String(legacyUser.id),
          email: legacyUser.email,
          role: legacyUser.role,
          forcePasswordChange: legacyUser.forcePasswordChange,
        };
      }
    } catch {
      // User not in legacy table either
    }

    return null;
  }

  async validateApiKey(apikey: string): Promise<SelectUser | SelectGroup | null> {
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
          if (matchingKey.apiKey && await compare(JWTSignature, matchingKey.apiKey)) {
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
    creationMethod: 'local' | 'ldap' | 'github' | 'gitlab' | 'google' | 'okta' | 'oidc',
  ): Promise<SelectUser> {
    let user: SelectUser;
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
        creationMethod: creationMethod,
      };
      await this.usersService.create(createUser);
      user = await this.usersService.findByEmail(email);
    }

    if (user) {
      await this.usersService.updateOAuthProfile(user, firstName, lastName);
      await this.usersService.updateLoginMetadata(user);
    }

    return user;
  }

  async login(user: {
    id: string;
    email: string;
    role: string;
    forcePasswordChange: boolean | null | undefined;
  }): Promise<{userID: string; accessToken: string}> {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      forcePasswordChange: user.forcePasswordChange ?? false,
    };

    let jwtSecret = '';
    const numericId = Number(user.id);
    if (Number.isFinite(numericId) && numericId > 0) {
      const loginUser = await this.usersService.findById(user.id);
      if (
        !loginUser.jwtSecret ||
        this.configService.get('ONE_SESSION_PER_USER')?.toLowerCase() === 'true'
      ) {
        await this.usersService.updateUserSecret(loginUser);
      }
      jwtSecret = loginUser.jwtSecret ?? '';
    } else {
      jwtSecret = crypto.randomBytes(32).toString('hex');
    }
    if (payload.forcePasswordChange || user.role === 'admin') {
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
          secret: crypto.createHmac('sha256', this.configService.get('JWT_SECRET') || '').update(jwtSecret).digest('hex'),
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
          secret: crypto.createHmac('sha256', this.configService.get('JWT_SECRET') || '').update(jwtSecret).digest('hex'),
        })
      };
    }
  }

  async createBetterAuthSession(email: string, password: string): Promise<{token: string; user: {id: string}} | null> {
    try {
      const result = await this.authService.api.signInEmail({body: {email, password}});
      if (result && 'token' in result) {
        return result as {token: string; user: {id: string}};
      }
    } catch {
      // better-auth sign-in not available, fall back to JWT
    }
    return null;
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
    user: {encryptedPassword: string},
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
