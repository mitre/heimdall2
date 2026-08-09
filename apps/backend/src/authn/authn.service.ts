import {
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {compare} from 'bcryptjs';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import moment from 'moment';
import ms from 'ms';
import winston from 'winston';
import {ApiKeyService} from '../apikeys/apikey.service';
import {ConfigService} from '../config/config.service';
import {
  KdfOverloadedError,
  PasswordVerifyResult,
  verifyPassword
} from '../crypto/password';
import {PasswordService} from '../crypto/password.service';
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
      winston.format.printf(
        (info) =>
          `${this.line}[${[info.timestamp]}] (Authn Service): ${info.message}`
      )
    )
  });

  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService
  ) {}

  /**
   * §11: the bounded KDF queue rejects with `KdfOverloadedError` when it is
   * saturated, and the ADR assigns the mapping to "the auth layer" — this is
   * that layer for site 4. Left unmapped the error escapes as a 500 alongside
   * everyone else's 401, which is itself an enumeration oracle: under
   * saturation the absent-user dummy consumes a KDF slot while a legacy
   * `bcryptjs.compare` consumes none, separating "no such account" from
   * "account still on bcrypt". Returns null on overload (caller fails
   * generically); anything else is a real bug and propagates.
   */
  private async verifyOrGenericFailure(
    arguments_: {hash: string; password: string},
    userId?: string
  ): Promise<PasswordVerifyResult | null> {
    try {
      return await this.passwordService.verify(arguments_);
    } catch (error) {
      if (error instanceof KdfOverloadedError) {
        this.logger.info({
          message: `Password verification rejected — KDF queue saturated${
            userId === undefined ? '' : ` for User<ID: ${userId}>`
          }; returning the generic authentication failure.`
        });
        return null;
      }
      throw error;
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    let user: User;
    try {
      user = await this.usersService.findByEmail(email);
    } catch {
      // Absent-user timing mitigation (ADR-006 Risks). Pay the same constant-
      // work KDF cost a present user's verify would — an empty hash routes
      // verifyPassword to its reject-with-constant-work path — so user-exists
      // and user-absent are indistinguishable by timing. Then fail generically
      // (LocalStrategy maps a null return to the same 401 as any failure).
      await this.verifyOrGenericFailure({hash: '', password});
      return null;
    }

    const result = await this.verifyOrGenericFailure(
      {hash: user.encryptedPassword, password},
      user.id
    );
    if (result === null) {
      // KDF queue saturated — already logged; fail generically (§11).
      return null;
    }
    const {valid, needsRehash, requiresReset} = result;

    if (requiresReset === true) {
      // §3 refuse path: a bcrypt credential encountered under FIPS mode.
      // verifyPassword already paid the constant-work cost. Surface NOTHING
      // distinct to the caller (Risks: enumeration oracle) — LocalStrategy maps
      // this null to the same generic 401 as any other failure — but record it
      // server-side so an operator can see who still needs to migrate.
      this.logger.info({
        message: `User<ID: ${user.id}> presented a non-FIPS (bcrypt) credential; login refused under FIPS mode. A password reset is required.`
      });
      return null;
    }

    if (!valid) {
      return null;
    }

    if (needsRehash) {
      // §7 lazy rehash via compare-and-swap. The narrow writer takes the user
      // id and the ORIGINAL stored hash as the CAS predicate and NEVER mutates
      // this instance — so the un-awaited updateLoginMetadata save below cannot
      // carry the new hash outside the predicate and silently revert a
      // concurrent password change. A failed or lost (0-row) rehash must never
      // fail an otherwise successful login.
      const originalHash = user.encryptedPassword;
      try {
        const newHash = await this.passwordService.hash(password);
        await this.usersService.updateEncryptedPassword(
          user.id,
          originalHash,
          newHash
        );
      } catch (error) {
        this.logger.info({
          message: `Lazy password rehash failed for User<ID: ${user.id}>; login still succeeded: ${
            error instanceof Error ? error.message : String(error)
          }`
        });
      }
    }

    this.usersService.updateLoginMetadata(user);
    return user;
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
      // ADR-006 §6: 32 bytes → 64 hex chars = 256 bits of entropy for a
      // credential that is never used to log in. Kept well under the 128-char
      // PASSWORD_MAX_LENGTH so external-auth provisioning obeys the SAME hash-
      // path length cap as every other create() — an exemption for these users
      // would be a bypass waiting to be misused.
      const randomPass = crypto.randomBytes(32).toString('hex');
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
    this: void,
    updateUserDto: {currentPassword?: string},
    user: User
  ): Promise<void> {
    // Site 6 (ADR-006 §4): MUST stay `this`-free — users.service.ts calls
    // this method UNBOUND via AuthnService.prototype.testPassword(...), and
    // UsersService cannot inject AuthnService (circular). `this: void` makes
    // that constraint COMPILER-enforced: any future `this.` access in this
    // body is a type error. The pure verifyPassword handles PBKDF2 + legacy
    // bcrypt and never throws on malformed input, so no try/catch is needed.
    const {valid} = await verifyPassword({
      hash: user.encryptedPassword,
      password: updateUserDto.currentPassword || ''
    });
    if (!valid) {
      throw new ForbiddenException('Current password is incorrect');
    }
  }
}
