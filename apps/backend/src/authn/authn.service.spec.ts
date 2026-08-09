import { ForbiddenException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { GROUPS_SERVICE_MOCK } from '../../test/constants/groups-test.constant';
import { CREATE_USER_DTO_TEST_OBJ } from '../../test/constants/users-test.constant';
import type { ApiKeyService } from '../apikeys/apikey.service';
import { AuthzModule } from '../authz/authz.module';
import { AuthzService } from '../authz/authz.service';
import { ConfigService } from '../config/config.service';
import { hashPassword, KdfOverloadedError } from '../crypto/password';
import { PasswordService } from '../crypto/password.service';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { EvaluationTag } from '../evaluation-tags/evaluation-tag.model';
import { Evaluation } from '../evaluations/evaluation.model';
import { GroupEvaluation } from '../group-evaluations/group-evaluation.model';
import { GroupUser } from '../group-users/group-user.model';
import { Group } from '../groups/group.model';
import { GroupsService } from '../groups/groups.service';
import { User } from '../users/user.model';
import { UsersService } from '../users/users.service';
import { AuthnService } from './authn.service';

// Site 6 ONLY (ADR-006 §4). users.service.ts:79 invokes testPassword UNBOUND
// via AuthnService.prototype.testPassword(...) — it works only because the
// method never touches `this`. These tests call it with `this === undefined`
// (stricter than the production prototype-receiver call): ANY `this` access
// throws immediately. The full authn spec build-out (validateUser,
// validateApiKey) belongs to the sites-4/5 cards.
function userWith(encryptedPassword: string): User {
  // testPassword reads exactly one field; a model instance needs the DB.
  return { encryptedPassword } as User;
}

describe('AuthnService.testPassword — site 6, pure and this-free', () => {
  const PASSWORD = 'CorrectHorse15!x';
  const unboundTestPassword = AuthnService.prototype.testPassword;

  it('invoked unbound (no this) verifies a PBKDF2 hash without throwing (§4 structural constraint)', async () => {
    const user = userWith(await hashPassword(PASSWORD));
    await expect(
      unboundTestPassword.call(undefined, { currentPassword: PASSWORD }, user),
    ).resolves.toBeUndefined();
  });

  it('invoked unbound verifies a legacy bcrypt hash (FIPS off)', async () => {
    const user = userWith(await hash(PASSWORD, 4));
    await expect(
      unboundTestPassword.call(undefined, { currentPassword: PASSWORD }, user),
    ).resolves.toBeUndefined();
  });

  it('rejects a wrong password with ForbiddenException for BOTH hash formats', async () => {
    const pbkdf2User = userWith(await hashPassword(PASSWORD));
    await expect(
      unboundTestPassword.call(
        undefined,
        { currentPassword: 'WrongHorse15!x' },
        pbkdf2User,
      ),
    ).rejects.toThrow(ForbiddenException);

    const bcryptUser = userWith(await hash(PASSWORD, 4));
    await expect(
      unboundTestPassword.call(
        undefined,
        { currentPassword: 'WrongHorse15!x' },
        bcryptUser,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects a missing currentPassword with ForbiddenException', async () => {
    const user = userWith(await hashPassword(PASSWORD));
    await expect(
      unboundTestPassword.call(undefined, {}, user),
    ).rejects.toThrow(ForbiddenException);
  });
});

// 32 random bytes → 64 lowercase-hex chars (ADR-006 §6). Module scope so it is
// compiled once, not recompiled on every assertion.
const PLACEHOLDER_HEX_64 = /^[0-9a-f]{64}$/v;

describe('AuthnService.validateOrCreateUser — external-auth placeholder (ADR-006 §6)', () => {
  // Real-DB harness (127.0.0.1:5433). Every external-auth provider (github,
  // gitlab, google, ldap, oidc, okta) provisions new users through this single
  // method, which generates ONE placeholder password (authn.service.ts) fed to
  // usersService.create(). validateApiKey + login are unused here, so the
  // ApiKeyService and JwtService collaborators are inert stubs.
  let authnService: AuthnService;
  let usersService: UsersService;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        SequelizeModule.forFeature([
          User,
          GroupUser,
          Group,
          GroupEvaluation,
          Evaluation,
          EvaluationTag,
        ]),
        AuthzModule,
      ],
      providers: [
        AuthzService,
        ConfigService,
        DatabaseService,
        UsersService,
        { provide: GroupsService, useValue: GROUPS_SERVICE_MOCK },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    databaseService = module.get<DatabaseService>(DatabaseService);

    // AuthnService ⇄ UsersService is a circular import (users.service.ts calls
    // AuthnService.prototype.testPassword unbound), so Nest cannot DI-resolve
    // AuthnService here. validateOrCreateUser only uses this.usersService, so
    // build it directly with the real UsersService and inert collaborators —
    // apiKeyService/configService/jwtService are never touched on this path.
    authnService = new AuthnService(
      {} as ApiKeyService,
      {} as ConfigService,
      usersService,
      {} as JwtService,
      {} as PasswordService,
    );
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
  });

  it('provisions an external-auth user with a 64-char (256-bit) placeholder and persists the record', async () => {
    expect.assertions(7);
    const email = 'ext-oauth-user@example.com';
    // Spy CALLS THROUGH — the real create() hashes + writes to the DB, so this
    // is a genuine end-to-end provisioning. The plaintext placeholder is
    // unrecoverable from the stored hash by design, so its length is asserted
    // at the generation boundary: the DTO create() actually received.
    const createSpy = vi.spyOn(usersService, 'create');

    const user = await authnService.validateOrCreateUser(
      email,
      'Ext',
      'User',
      'github',
    );

    expect(createSpy).toHaveBeenCalledTimes(1);
    const dto = createSpy.mock.calls[0][0];
    // Exact 64 — NOT `< 128`, which would silently pass a future weakening.
    expect(dto.password).toHaveLength(64);
    expect(dto.passwordConfirmation).toHaveLength(64);
    expect(dto.password).toBe(dto.passwordConfirmation);
    expect(dto.password).toMatch(PLACEHOLDER_HEX_64);

    // Persisted in the real DB via the external-auth provisioning path.
    expect(user.email).toBe(email);
    const stored = await usersService.findByEmail(email);
    expect(stored.creationMethod).toBe('github');
  });
});

describe('AuthnService.validateUser — verify + CAS lazy rehash (ADR-006 §4 site 4, §7)', () => {
  // Real-DB harness. validateUser is the primary migration path: a local login
  // verifies through PasswordService and, on a still-bcrypt credential (FIPS
  // off), lazily rehashes to PBKDF2 through the §7 compare-and-swap writer —
  // never mutating the instance, never failing the login on a rehash error.
  const { email, password } = CREATE_USER_DTO_TEST_OBJ;
  let authnService: AuthnService;
  let usersService: UsersService;
  let databaseService: DatabaseService;
  let passwordService: PasswordService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        SequelizeModule.forFeature([
          User,
          GroupUser,
          Group,
          GroupEvaluation,
          Evaluation,
          EvaluationTag,
        ]),
        AuthzModule,
      ],
      providers: [
        AuthzService,
        ConfigService,
        DatabaseService,
        UsersService,
        { provide: GroupsService, useValue: GROUPS_SERVICE_MOCK },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    passwordService = new PasswordService(
      module.get<ConfigService>(ConfigService),
    );

    // Same circular-import reason as the validateOrCreateUser block: construct
    // AuthnService directly. Only usersService, passwordService and the logger
    // are exercised on this path.
    authnService = new AuthnService(
      {} as ApiKeyService,
      {} as ConfigService,
      usersService,
      {} as JwtService,
      passwordService,
    );
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    vi.restoreAllMocks();
  });

  // Seed a user, then overwrite the stored hash with a controlled value. create()
  // still bcrypts (site 1 is a different card), so we set the exact hash we want
  // to test the dispatch against.
  async function seedUserWithStoredHash(storedHash: string): Promise<User> {
    const dto = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
    const created = await User.findByPk<User>(dto.id);
    if (created === null) {
      throw new TypeError('seed failed: user not found after create');
    }
    await created.update({ encryptedPassword: storedHash }, { silent: true });
    return created;
  }

  it('rehashes a valid bcrypt login (FIPS off) to $pbkdf2- via the CAS writer', async () => {
    expect.assertions(3);
    const seeded = await seedUserWithStoredHash(await hash(password, 4));

    const result = await authnService.validateUser(email, password);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(seeded.id);
    const reloaded = await User.findByPk<User>(seeded.id);
    expect(reloaded?.encryptedPassword.startsWith('$pbkdf2-')).toBe(true);
  });

  it('does not revert a concurrent password change — the in-flight rehash CAS loses (0 affected)', async () => {
    expect.assertions(2);
    const seeded = await seedUserWithStoredHash(await hash(password, 4));
    // The concurrent password change (H2) lands in the DB after this login's
    // findByEmail read but before its CAS write. Move the DB to a real PBKDF2
    // H2 on a separate instance; hand validateUser the stale (bcrypt) view.
    const concurrentHash = await hashPassword('Rotated#Pass88x');
    const databaseRow = await User.findByPk<User>(seeded.id);
    await databaseRow?.update(
      { encryptedPassword: concurrentHash },
      { silent: true },
    );
    vi.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(seeded);

    const result = await authnService.validateUser(email, password);

    expect(result?.id).toBe(seeded.id); // stale-but-valid login still succeeds
    const reloaded = await User.findByPk<User>(seeded.id);
    expect(reloaded?.encryptedPassword).toBe(concurrentHash); // H2 survived
  });

  it('logs and still succeeds the login when the rehash write fails (§7)', async () => {
    expect.assertions(3);
    const seeded = await seedUserWithStoredHash(await hash(password, 4));
    vi.spyOn(usersService, 'updateEncryptedPassword').mockRejectedValueOnce(
      new Error('database unavailable'),
    );
    const logSpy = vi
      .spyOn(authnService.logger, 'info')
      .mockReturnValue(authnService.logger);

    const result = await authnService.validateUser(email, password);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(seeded.id);
    expect(logSpy).toHaveBeenCalled();
  });

  it('never mutates the Sequelize instance with the new hash (the racing login save cannot carry it)', async () => {
    expect.assertions(2);
    const bcryptHash = await hash(password, 4);
    const seeded = await seedUserWithStoredHash(bcryptHash);

    const result = await authnService.validateUser(email, password);

    // Returned instance still holds the ORIGINAL hash — we never assigned the
    // new one, so updateLoginMetadata's un-awaited save cannot persist it.
    expect(result?.encryptedPassword).toBe(bcryptHash);
    const reloaded = await User.findByPk<User>(seeded.id);
    expect(reloaded?.encryptedPassword.startsWith('$pbkdf2-')).toBe(true);
  });

  it('returns null (the generic 401) and logs the user id when the result is requiresReset (FIPS-refused bcrypt)', async () => {
    expect.assertions(3);
    const seeded = await seedUserWithStoredHash(await hash(password, 4));
    vi.spyOn(passwordService, 'verify').mockResolvedValueOnce({
      needsRehash: false,
      requiresReset: true,
      valid: false,
    });
    const logSpy = vi
      .spyOn(authnService.logger, 'info')
      .mockReturnValue(authnService.logger);

    const result = await authnService.validateUser(email, password);

    expect(result).toBeNull();
    expect(logSpy).toHaveBeenCalledTimes(1);
    const idInMessage = expect.stringContaining(seeded.id);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: idInMessage }),
    );
  });

  it('runs the constant-work dummy and returns null for an absent user (timing mitigation)', async () => {
    expect.assertions(2);
    const verifySpy = vi.spyOn(passwordService, 'verify');

    const result = await authnService.validateUser('ghost@nowhere.test', password);

    expect(result).toBeNull();
    // Same KDF cost a present user pays — an empty hash routes verifyPassword to
    // its reject-with-constant-work path — so user-absent is timing-invisible.
    expect(verifySpy).toHaveBeenCalledWith({ hash: '', password });
  });

  // §11: the bounded KDF queue rejects with KdfOverloadedError when saturated.
  // The ADR assigns the mapping to "the auth layer" — validateUser IS that layer
  // for site 4. Unmapped, the error escapes as a 500 next to everyone else's 401,
  // which is itself an enumeration oracle: under saturation the absent-user dummy
  // consumes a KDF slot while a legacy bcrypt compare consumes none, separating
  // "no such account" from "account still on bcrypt".
  it('maps a saturated KDF queue to the generic failure, not a 500 (§11)', async () => {
    expect.assertions(3);
    const seeded = await seedUserWithStoredHash(await hash(password, 4));
    vi.spyOn(passwordService, 'verify').mockRejectedValueOnce(
      new KdfOverloadedError('KDF queue is full'),
    );
    const logSpy = vi
      .spyOn(authnService.logger, 'info')
      .mockReturnValue(authnService.logger);

    // Resolves null (-> LocalStrategy's generic 401). Must NOT reject.
    await expect(authnService.validateUser(email, password)).resolves.toBeNull();
    expect(logSpy).toHaveBeenCalledTimes(1);
    const idInMessage = expect.stringContaining(seeded.id);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: idInMessage }),
    );
  });

  it('maps a saturated KDF queue on the ABSENT-user path to the generic failure too (§11)', async () => {
    expect.assertions(1);
    vi.spyOn(passwordService, 'verify').mockRejectedValueOnce(
      new KdfOverloadedError('KDF queue is full'),
    );

    await expect(
      authnService.validateUser('ghost@nowhere.test', password),
    ).resolves.toBeNull();
  });

  it('rethrows a non-overload error — a real bug must not be silently swallowed', async () => {
    expect.assertions(1);
    await seedUserWithStoredHash(await hash(password, 4));
    vi.spyOn(passwordService, 'verify').mockRejectedValueOnce(
      new Error('unexpected failure'),
    );

    await expect(authnService.validateUser(email, password)).rejects.toThrow(
      'unexpected failure',
    );
  });

  it('leaves passwordChangedAt and forcePasswordChange unchanged after a rehash (§7 lifecycle)', async () => {
    expect.assertions(3);
    const seeded = await seedUserWithStoredHash(await hash(password, 4));
    const before = await User.findByPk<User>(seeded.id);
    const beforePwChanged = String(before?.passwordChangedAt);
    const beforeForce = before?.forcePasswordChange;

    await authnService.validateUser(email, password);

    const after = await User.findByPk<User>(seeded.id);
    expect(after?.encryptedPassword.startsWith('$pbkdf2-')).toBe(true);
    expect(String(after?.passwordChangedAt)).toBe(beforePwChanged);
    expect(after?.forcePasswordChange).toBe(beforeForce);
  });
});
