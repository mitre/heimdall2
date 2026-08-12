import * as crypto from 'crypto';
import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'jsonwebtoken';
import _ from 'lodash';
import moment from 'moment';
import ms from 'ms';
import { createLogger, format, transports } from 'winston';
import { ApiKeyService } from '../apikeys/apikey.service';
import { ConfigService } from '../config/config.service';
import {
  KdfOverloadedError,
  PasswordHashError,
  PasswordVerifyResult,
  verifyPassword,
} from '../crypto/password';
import { PasswordService } from '../crypto/password.service';
import { Group } from '../groups/group.model';
import { limitJWTTime } from '../token/token.providers';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/user.model';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthnService {
  private readonly line = '_______________________________________________\n';
  // unicorn/consistent-class-member-order (privates-first) and
  // perfectionist/sort-classes (publics-first) are mutually exclusive on any
  // mixed class — documented floor class (password.service.ts carries the
  // same finding); perfectionist's order is kept.
  public loggingTimeFormat = 'MMM-DD-YYYY HH:mm:ss Z';
  public logger = createLogger({
    format: format.combine(
      format.timestamp({ format: this.loggingTimeFormat }),
      format.printf(
        info =>
          `${this.line}[${String(info.timestamp)}] (Authn Service): ${String(info.message)}`,
      ),
    ),
    transports: [new transports.Console()],
  });

  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
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
   *
   * `subject` is a pre-formatted label for the server-side log only — e.g.
   * `User<ID: 5>` or `ApiKey<ID: 3>` — so both credential paths share this
   * mapping without the helper knowing which one called it.
   */
  private async verifyOrGenericFailure(
    arguments_: { hash: string; password: string },
    subject?: string,
  ): Promise<null | PasswordVerifyResult> {
    try {
      return await this.passwordService.verify(arguments_);
    } catch (error) {
      if (error instanceof KdfOverloadedError) {
        this.logger.info({
          message: `Credential verification rejected — KDF queue saturated${
            subject === undefined ? '' : ` for ${subject}`
          }; returning the generic authentication failure.`,
        });
        return null;
      }
      throw error;
    }
  }

  async login(user: {
    email: string;
    forcePasswordChange: boolean | undefined;
    id: string;
    role: string;
  }): Promise<{ accessToken: string; userID: string }> {
    const payload = {
      email: user.email,
      forcePasswordChange: user.forcePasswordChange,
      role: user.role,
      sub: user.id,
    };
    // Users have their own JWT Secret to allow for session invalidation on sign out
    const loginUser = await this.usersService.findById(user.id);
    if (
      !loginUser.jwtSecret
      || this.configService.get('ONE_SESSION_PER_USER')?.toLowerCase() === 'true'
    ) {
      // The new jwtSecret is assigned synchronously; only its persistence
      // floats (legacy pattern — the token below signs with the new value).
      void this.usersService.updateUserSecret(loginUser);
    }
    if (payload.forcePasswordChange || user.role === 'admin') {
      // Admin sessions are only valid for 10 minutes, for regular users give them 10 minutes to (hopefully) change their password.
      const expireTime = moment(new Date(Date.now() + ms('600s'))).format(
        this.loggingTimeFormat,
      );
      this.logger.info({ message: `New session for User<ID: ${user.id}> expires at ${expireTime}` });
      return {
        accessToken: this.jwtService.sign(payload, {
          expiresIn: '600s',
          secret: this.configService.get('JWT_SECRET') + loginUser.jwtSecret,
        }),
        userID: user.id,
      };
    }
    const expiresIn = limitJWTTime(
      this.configService.get('JWT_EXPIRE_TIME') || '60s',
      false,
    );
    const expireTime = moment(new Date(Date.now() + expiresIn)).format(
      this.loggingTimeFormat,
    );
    this.logger.info({ message: `New session for User<ID: ${user.id}> expires at ${expireTime}` });
    return {
      accessToken: this.jwtService.sign(payload, { secret: this.configService.get('JWT_SECRET') + loginUser.jwtSecret }),
      userID: user.id,
    };
  }

  splitName(fullName: string): { firstName: string; lastName: string } {
    const nameArray = fullName.split(' ');
    return {
      firstName: nameArray[0],
      lastName: nameArray.slice(1).join(' '),
    };
  }

  async testPassword(
    this: void,
    updateUserDto: { currentPassword?: string },
    user: User,
  ): Promise<void> {
    // Site 6 (ADR-006 §4): MUST stay `this`-free — users.service.ts calls
    // this method UNBOUND via AuthnService.prototype.testPassword(...), and
    // UsersService cannot inject AuthnService (circular). `this: void` makes
    // that constraint COMPILER-enforced: any future `this.` access in this
    // body is a type error. The pure verifyPassword handles PBKDF2 + legacy
    // bcrypt and never throws on malformed input, so no try/catch is needed.
    const { valid } = await verifyPassword({
      hash: user.encryptedPassword,
      password: updateUserDto.currentPassword || '',
    });
    if (!valid) {
      throw new ForbiddenException('Current password is incorrect');
    }
  }

  async validateApiKey(apikey: string): Promise<Group | null | User> {
    const APIKeySecret = this.configService.get('API_KEY_SECRET');
    if (APIKeySecret) {
      try {
        const jwtPayload = verify(apikey, APIKeySecret) as {
          createdAt: Date;
          keyId: string;
          token: string;
        };
        const JWTSignature = apikey.split('.', 3)[2];
        if (_.has(jwtPayload, 'keyId')) {
          const matchingKey = await this.apiKeyService.findById(
            jwtPayload.keyId,
          );
          // Site 5 (§4). jwt.verify above has already gated this path, so the
          // KDF is unreachable without a valid signature (§11) — that ordering
          // is load-bearing and must not be relaxed.
          const result = await this.verifyOrGenericFailure(
            { hash: matchingKey.apiKey, password: JWTSignature },
            `ApiKey<ID: ${matchingKey.id}>`,
          );
          if (result === null) {
            return null;
          }
          const { needsRehash, requiresReset, valid } = result;

          if (requiresReset === true) {
            // §3 refuse path under FIPS. Same generic failure this path
            // already returns for every other error (Risks: no distinct
            // response), recorded server-side so an operator can find the
            // keys that must be regenerated — a key cannot be recovered.
            // Warn, not info: §17 treats operator-actionable states as
            // warnings (a key can only be regenerated, never recovered).
            const message = `ApiKey<ID: ${matchingKey.id}> is stored as a non-FIPS (bcrypt) hash; validation refused under FIPS mode. The key must be regenerated.`;
            this.logger.warn({ message });
            return null;
          }

          if (!valid) {
            return null;
          }

          if (needsRehash && !(await this.passwordService.writesEnabled())) {
            // §17: gate-skipped rehashes log too (same event as the login
            // path — migration debt accruing behind the closed §12 gate).
            this.logger.info({ message: `Lazy API-key rehash for ApiKey<ID: ${matchingKey.id}> skipped: PBKDF2 writes are disabled (§12 gate); the debt is re-reported on the next validation after the gate opens` });
          } else if (needsRehash) {
            // §7 CAS rehash, same shape as validateUser but against the
            // ApiKeys.apiKey column, behind the same §12 write gate (skip
            // while PBKDF2 writes are disabled — pre-N pods must keep
            // reading this row). Never mutates the instance — the formerly
            // un-awaited save at apikey.service.ts create() was the same
            // trap as the login path's. §12: this path serves CI and the
            // saf CLI, where no human retries a 401, so a failed rehash
            // must never fail an otherwise valid key.
            const originalHash = matchingKey.apiKey;
            try {
              const newHash = await this.passwordService.hash(JWTSignature);
              const affected = await this.apiKeyService.updateApiKeyHash(
                matchingKey.id,
                originalHash,
                newHash,
              );
              // §17: the ONLY record that this key's credential converted —
              // field list ends at the iteration count, never the key/hash/
              // salt. Read from the PHC string actually written.
              const phcParts = newHash.split('$');
              const toFormat = phcParts[1] ?? 'unknown';
              const iterationCount = (phcParts[2] ?? '').replace('i=', '');
              if (affected === 0) {
                this.logger.info({ message: `Lazy API-key rehash for ApiKey<ID: ${matchingKey.id}> skipped: another writer updated the credential first (compare-and-swap lost — benign, §7)` });
              } else {
                this.logger.info({ message: `ApiKey<ID: ${matchingKey.id}> credential converted: from bcrypt to ${toFormat} at ${iterationCount} iterations` });
              }
            } catch (error) {
              const reason
                = error instanceof Error ? error.message : String(error);
              const message = `Lazy API-key rehash failed for ApiKey<ID: ${matchingKey.id}>; validation still succeeded: ${reason}`;
              this.logger.info({ message });
            }
          }

          if (matchingKey.type === 'user') {
            return matchingKey.user;
          }
          return matchingKey.type === 'group' ? matchingKey.group : null;
        }
        return null;
      } catch {
        return null;
      }
    }
    throw new ForbiddenException(
      'API Keys have been disabled as the API-Key secret is not set',
    );
  }

  async validateOrCreateUser(
    email: string,
    firstName: string,
    lastName: string,
    creationMethod: string,
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
      const newUserDto: CreateUserDto = {
        creationMethod: creationMethod,
        email: email,
        firstName: firstName,
        lastName: lastName,
        organization: '',
        password: randomPass,
        passwordConfirmation: randomPass,
        role: 'user',
        title: '',
      };
      await this.usersService.create(newUserDto);
      user = await this.usersService.findByEmail(email);
    }

    if (user) {
      // If the users info has changed since they last logged in it will be reflected here.
      // Because we find the user by their email, we can't detect a change in email.
      if (user.firstName !== firstName || user.lastName !== lastName) {
        user.firstName = firstName;
        user.lastName = lastName;
        void user.save();
      }
      // §7-documented deliberate float: awaiting would serialize every
      // login behind this write.
      void this.usersService.updateLoginMetadata(user);
    }

    return user;
  }

  async validateUser(email: string, password: string): Promise<null | User> {
    let user: User;
    try {
      user = await this.usersService.findByEmail(email);
    } catch {
      // Absent-user timing mitigation (ADR-006 Risks). Pay the same constant-
      // work KDF cost a present user's verify would — an empty hash routes
      // verifyPassword to its reject-with-constant-work path — so user-exists
      // and user-absent are indistinguishable by timing. Then fail generically
      // (LocalStrategy maps a null return to the same 401 as any failure).
      await this.verifyOrGenericFailure({ hash: '', password });
      return null;
    }

    const result = await this.verifyOrGenericFailure(
      { hash: user.encryptedPassword, password },
      `User<ID: ${user.id}>`,
    );
    if (result === null) {
      // KDF queue saturated — already logged; fail generically (§11).
      return null;
    }
    const { needsRehash, requiresReset, valid } = result;

    if (requiresReset === true) {
      // §3 refuse path: a bcrypt credential encountered under FIPS mode.
      // verifyPassword already paid the constant-work cost. Surface NOTHING
      // distinct to the caller (Risks: enumeration oracle) — LocalStrategy maps
      // this null to the same generic 401 as any other failure — but record it
      // server-side so an operator can see who still needs to migrate. Warn,
      // not info: §17 treats operator-actionable states as warnings.
      this.logger.warn({ message: `User<ID: ${user.id}> presented a non-FIPS (bcrypt) credential; login refused under FIPS mode. A password reset is required.` });
      return null;
    }

    if (!valid) {
      return null;
    }

    if (needsRehash && !(await this.passwordService.writesEnabled())) {
      // §17: the gate-skipped rehash is still an event — the operator's only
      // sign that migration debt is accruing behind the closed §12 gate.
      this.logger.info({ message: `Lazy password rehash for User<ID: ${user.id}> skipped: PBKDF2 writes are disabled (§12 gate); the debt is re-reported on the next login after the gate opens` });
    } else if (needsRehash) {
      // §7 lazy rehash via compare-and-swap, behind the §12 write gate: while
      // PBKDF2 writes are disabled (rolling-deploy window), the rehash is
      // SKIPPED — a converted row would be unreadable by a pre-N pod, and the
      // debt is re-reported on the next login after the gate opens. The
      // narrow writer takes the user id and the ORIGINAL stored hash as the
      // CAS predicate and NEVER mutates this instance — so the un-awaited
      // updateLoginMetadata save below cannot carry the new hash outside the
      // predicate and silently revert a concurrent password change. A failed
      // or lost (0-row) rehash must never fail an otherwise successful login.
      const originalHash = user.encryptedPassword;
      try {
        const newHash = await this.passwordService.hash(password);
        const affected = await this.usersService.updateEncryptedPassword(
          user.id,
          originalHash,
          newHash,
        );
        // §17: since §7 forbids touching passwordChangedAt, these lines are
        // the ONLY record that a credential converted. The field list ends at
        // the iteration COUNT — never the password, hash, or salt. Format and
        // iterations are read from the PHC string actually written, not from
        // config, so the log states what is stored.
        const phcParts = newHash.split('$');
        const toFormat = phcParts[1] ?? 'unknown';
        const iterationCount = (phcParts[2] ?? '').replace('i=', '');
        if (affected === 0) {
          this.logger.info({ message: `Lazy password rehash for User<ID: ${user.id}> skipped: another writer updated the credential first (compare-and-swap lost — benign, §7)` });
        } else {
          this.logger.info({ message: `User<ID: ${user.id}> credential converted: from bcrypt to ${toFormat} at ${iterationCount} iterations` });
        }
      } catch (error) {
        if (error instanceof PasswordHashError) {
          // §9: an input the hash policy rejects — post-login the only
          // reachable case is the length cap — can NEVER convert lazily, so
          // warn is the operator-actionable severity (§17); transient
          // failures below stay info because the next login retries them.
          this.logger.warn({ message: `Lazy password rehash for User<ID: ${user.id}> skipped (§9): the password cannot be hashed under current policy (${error.message}); login still succeeded but this credential cannot migrate lazily` });
        } else {
          this.logger.info({
            message: `Lazy password rehash failed for User<ID: ${user.id}>; login still succeeded: ${
              error instanceof Error ? error.message : String(error)
            }`,
          });
        }
      }
    }

    // §7-documented deliberate float ("authn.service.ts already calls
    // updateLoginMetadata without await [V]") — the CAS rehash design above
    // exists BECAUSE this save races; void marks the intent.
    void this.usersService.updateLoginMetadata(user);
    return user;
  }
}
