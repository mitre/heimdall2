import { ForbiddenException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
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
import { ApiKey } from '../apikeys/apikey.model';
import { ApiKeyService } from '../apikeys/apikey.service';
import { AuthzModule } from '../authz/authz.module';
import { AuthzService } from '../authz/authz.service';
import { ConfigService } from '../config/config.service';
import { CryptoModule } from '../crypto/crypto.module';
import { HashMigrationMarker } from '../crypto/hash-migration-marker.model';
import { HashWriteGateService } from '../crypto/hash-write-gate.service';
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
        CryptoModule,
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
        CryptoModule,
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
    passwordService = module.get<PasswordService>(PasswordService);

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
    const seeded = await seedUserWithStoredHash(await hash(password, 4));

    const result = await authnService.validateUser(email, password);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(seeded.id);
    const reloaded = await User.findByPk<User>(seeded.id);
    expect(reloaded?.encryptedPassword.startsWith('$pbkdf2-')).toBe(true);
  });

  it('a successful login rehash emits one info log with userId, from bcrypt, to pbkdf2-sha512, and iterations (§17)', async () => {
    const seeded = await seedUserWithStoredHash(await hash(password, 4));
    const logSpy = vi
      .spyOn(authnService.logger, 'info')
      .mockReturnValue(authnService.logger);

    const result = await authnService.validateUser(email, password);

    expect(result).not.toBeNull();
    expect(logSpy).toHaveBeenCalledTimes(1);
    const [logged] = logSpy.mock.calls[0] as [{ message: string }];
    expect(logged.message).toContain(`User<ID: ${seeded.id}>`);
    expect(logged.message).toContain('bcrypt');
    expect(logged.message).toContain('pbkdf2-sha512');
    // §17's field list ends at the iteration COUNT — never the password,
    // hash, or salt. 600000 is the suite's configured iteration default.
    expect(logged.message).toContain('600000');
  });

  it('the rehash log NEVER carries the password or any hash/salt material (§17 anti-pattern)', async () => {
    const seeded = await seedUserWithStoredHash(await hash(password, 4));
    const logSpy = vi
      .spyOn(authnService.logger, 'info')
      .mockReturnValue(authnService.logger);

    await authnService.validateUser(email, password);

    const [logged] = logSpy.mock.calls[0] as [{ message: string }];
    expect(logged.message).not.toContain(password);
    const reloaded = await User.findByPk<User>(seeded.id);
    // The stored PHC string (salt + key material) must be absent; its salt
    // segment alone is enough to prove leakage, so check the whole string.
    expect(logged.message).not.toContain(reloaded?.encryptedPassword ?? '');
  });

  it('skips the §7 rehash while the §12 write gate is off — login succeeds, the stored bcrypt hash is untouched, and the skip is logged', async () => {
    const bcryptHash = await hash(password, 4);
    const seeded = await seedUserWithStoredHash(bcryptHash);
    const priorGateEnvironment = process.env.PASSWORD_HASH_WRITE_ENABLED;
    process.env.PASSWORD_HASH_WRITE_ENABLED = 'false';
    try {
      // Fresh gate + service chain: the §12 derivation is boot-scoped and the
      // suite's DI singletons already cached writes-enabled. With an explicit
      // env value the gate never queries its models, so the classes are
      // passed unregistered (password.service.spec's pattern).
      const gateConfig = new ConfigService();
      const gateOff = new HashWriteGateService(
        HashMigrationMarker,
        User,
        gateConfig,
      );
      const authnOff = new AuthnService(
        {} as ApiKeyService,
        {} as ConfigService,
        usersService,
        {} as JwtService,
        new PasswordService(gateConfig, gateOff),
      );
      const logSpy = vi
        .spyOn(authnOff.logger, 'info')
        .mockReturnValue(authnOff.logger);

      const result = await authnOff.validateUser(email, password);

      expect(result?.id).toBe(seeded.id);
      const reloaded = await User.findByPk<User>(seeded.id);
      // needsRehash was true, but persistence must wait for the gate: the
      // stored credential stays byte-identical bcrypt, readable by a pre-N
      // pod during the §12 rolling window.
      expect(reloaded?.encryptedPassword).toBe(bcryptHash);
      expect(reloaded?.encryptedPassword.startsWith('$2b$')).toBe(true);
      // §17: the gate-skipped rehash is still an event — the operator's only
      // sign that migration debt is accruing behind a closed gate.
      const gateSkipMessage = expect.stringContaining('writes are disabled');
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: gateSkipMessage }),
      );
    } finally {
      if (priorGateEnvironment === undefined) {
        delete process.env.PASSWORD_HASH_WRITE_ENABLED;
      } else {
        process.env.PASSWORD_HASH_WRITE_ENABLED = priorGateEnvironment;
      }
    }
  });

  it('does not revert a concurrent password change — the in-flight rehash CAS loses (0 affected)', async () => {
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
    expect(logSpy).toHaveBeenCalledTimes(1);
    const failureMessage = expect.stringContaining('rehash failed');
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: failureMessage }),
    );
  });

  it('never mutates the Sequelize instance with the new hash (the racing login save cannot carry it)', async () => {
    const bcryptHash = await hash(password, 4);
    const seeded = await seedUserWithStoredHash(bcryptHash);

    const result = await authnService.validateUser(email, password);

    // Returned instance still holds the ORIGINAL hash — we never assigned the
    // new one, so updateLoginMetadata's un-awaited save cannot persist it.
    expect(result?.encryptedPassword).toBe(bcryptHash);
    const reloaded = await User.findByPk<User>(seeded.id);
    expect(reloaded?.encryptedPassword.startsWith('$pbkdf2-')).toBe(true);
  });

  it('returns null (the generic 401) and WARNS with the user id when the result is requiresReset (FIPS-refused bcrypt, §17 operator-actionable)', async () => {
    const seeded = await seedUserWithStoredHash(await hash(password, 4));
    vi.spyOn(passwordService, 'verify').mockResolvedValueOnce({
      needsRehash: false,
      requiresReset: true,
      valid: false,
    });
    const warnSpy = vi
      .spyOn(authnService.logger, 'warn')
      .mockReturnValue(authnService.logger);

    const result = await authnService.validateUser(email, password);

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const idInMessage = expect.stringContaining(seeded.id);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: idInMessage }),
    );
  });

  it('logs the CAS-lost rehash at info as a skip — §7 benign case is still an event', async () => {
    const seeded = await seedUserWithStoredHash(await hash(password, 4));
    vi.spyOn(usersService, 'updateEncryptedPassword').mockResolvedValueOnce(0);
    const logSpy = vi
      .spyOn(authnService.logger, 'info')
      .mockReturnValue(authnService.logger);

    const result = await authnService.validateUser(email, password);

    expect(result).not.toBeNull();
    expect(logSpy).toHaveBeenCalledTimes(1);
    const [logged] = logSpy.mock.calls[0] as [{ message: string }];
    expect(logged.message).toContain(`User<ID: ${seeded.id}>`);
    expect(logged.message).toContain('compare-and-swap lost');
  });

  it('WARNS and leaves the login unaffected when an oversized password reaches the rehash path (§9 skip)', async () => {
    // Legacy bcrypt predates the §6 cap, so a stored credential for a
    // 150-char password is realistic; bcrypt verifies it (truncating at
    // byte 72) but the PBKDF2 hash path rejects it — §9: skip and log.
    const oversized = 'Ov3r!'.repeat(30);
    await seedUserWithStoredHash(await hash(oversized, 4));
    const warnSpy = vi
      .spyOn(authnService.logger, 'warn')
      .mockReturnValue(authnService.logger);

    const result = await authnService.validateUser(email, oversized);

    expect(result).not.toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const [logged] = warnSpy.mock.calls[0] as [{ message: string }];
    expect(logged.message).toContain('cannot be hashed under current policy');
    expect(logged.message).not.toContain(oversized);
  });

  it('runs the constant-work dummy and returns null for an absent user (timing mitigation)', async () => {
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
    vi.spyOn(passwordService, 'verify').mockRejectedValueOnce(
      new KdfOverloadedError('KDF queue is full'),
    );

    await expect(
      authnService.validateUser('ghost@nowhere.test', password),
    ).resolves.toBeNull();
  });

  it('rethrows a non-overload error — a real bug must not be silently swallowed', async () => {
    await seedUserWithStoredHash(await hash(password, 4));
    vi.spyOn(passwordService, 'verify').mockRejectedValueOnce(
      new Error('unexpected failure'),
    );

    await expect(authnService.validateUser(email, password)).rejects.toThrow(
      'unexpected failure',
    );
  });

  it('leaves passwordChangedAt and forcePasswordChange unchanged after a rehash (§7 lifecycle)', async () => {
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

const API_KEY_SECRET = 'e2515-test-api-key-secret';

// Mirrors apikey.service.create(): sign {keyId, createdAt} with the secret,
// then store a hash of the JWT's signature segment (bcrypt has a 72-byte
// limit, which is why only the signature is hashed).
async function seedApiKey(
  storedHashOfSignature: (signature: string) => Promise<string>,
): Promise<{ apiKeyRow: ApiKey; ownerId: string; token: string }> {
  const owner = await User.create({
    creationMethod: 'local',
    email: `apikey-owner-${String(Date.now())}@example.com`,
    encryptedPassword: await hash('irrelevant-for-this-path', 4),
    role: 'user',
  });
  const apiKeyRow = await ApiKey.create({
    name: 'e2515-test-key',
    type: 'user',
    userId: owner.id,
  });
  const token = sign(
    { createdAt: new Date(), keyId: apiKeyRow.id },
    API_KEY_SECRET,
  );
  const signature = token.split('.', 3)[2];
  await apiKeyRow.update(
    { apiKey: await storedHashOfSignature(signature) },
    { silent: true },
  );
  return { apiKeyRow, ownerId: owner.id, token };
}

describe('AuthnService.validateApiKey — verify + CAS rehash (ADR-006 §4 site 5, §7)', () => {
  // Real-DB harness. API keys store a bcrypt hash of the JWT's SIGNATURE
  // segment (apikey.service.create), so this path migrates exactly like
  // validateUser but against ApiKeys.apiKey. §12: this path serves CI and the
  // saf CLI — no human retries a 401 and a key cannot be recovered, only
  // regenerated — so a failed rehash must never fail a valid key.
  let authnService: AuthnService;
  let apiKeyService: ApiKeyService;
  let databaseService: DatabaseService;
  let passwordService: PasswordService;

  beforeAll(async () => {
    vi.stubEnv('API_KEY_SECRET', API_KEY_SECRET);
    const module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        SequelizeModule.forFeature([
          ApiKey,
          User,
          GroupUser,
          Group,
          GroupEvaluation,
          Evaluation,
          EvaluationTag,
        ]),
        CryptoModule,
      ],
      providers: [ApiKeyService, ConfigService, DatabaseService],
    }).compile();

    apiKeyService = module.get<ApiKeyService>(ApiKeyService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    const configService = module.get<ConfigService>(ConfigService);
    passwordService = module.get<PasswordService>(PasswordService);

    // validateApiKey uses apiKeyService, configService and passwordService
    // only — usersService and jwtService are never touched on this path.
    authnService = new AuthnService(
      apiKeyService,
      configService,
      {} as UsersService,
      {} as JwtService,
      passwordService,
    );
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
    vi.unstubAllEnvs();
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    vi.restoreAllMocks();
  });

  it('rehashes a valid bcrypt-stored key to $pbkdf2- via the CAS writer, using the same default parameters as passwords', async () => {
    const { apiKeyRow, ownerId, token } = await seedApiKey(signature =>
      hash(signature, 4),
    );

    const result = await authnService.validateApiKey(token);

    expect((result as null | User)?.id).toBe(ownerId);
    const reloaded = await ApiKey.findByPk<ApiKey>(apiKeyRow.id);
    // Same defaults as the password path (§11 records the iteration
    // inefficiency for API keys but this card must NOT diverge from it).
    expect(reloaded?.apiKey.startsWith('$pbkdf2-sha512$i=600000$')).toBe(true);
    expect(reloaded?.apiKey).not.toBe(apiKeyRow.apiKey);
  });

  it('skips the §7 rehash while the §12 write gate is off — the key validates, the stored bcrypt hash is untouched, and the skip is logged', async () => {
    const { apiKeyRow, ownerId, token } = await seedApiKey(signature =>
      hash(signature, 4),
    );
    const storedRow = await ApiKey.findByPk<ApiKey>(apiKeyRow.id);
    const storedBefore = storedRow?.apiKey;
    const priorGateEnvironment = process.env.PASSWORD_HASH_WRITE_ENABLED;
    process.env.PASSWORD_HASH_WRITE_ENABLED = 'false';
    try {
      // Same fresh-chain reasoning as the validateUser suite's gate-off test.
      // The real ConfigService reads the suite's stubbed API_KEY_SECRET.
      const gateConfig = new ConfigService();
      const gateOff = new HashWriteGateService(
        HashMigrationMarker,
        User,
        gateConfig,
      );
      const authnOff = new AuthnService(
        apiKeyService,
        gateConfig,
        {} as UsersService,
        {} as JwtService,
        new PasswordService(gateConfig, gateOff),
      );
      const logSpy = vi
        .spyOn(authnOff.logger, 'info')
        .mockReturnValue(authnOff.logger);

      const result = await authnOff.validateApiKey(token);

      expect((result as null | User)?.id).toBe(ownerId);
      const reloaded = await ApiKey.findByPk<ApiKey>(apiKeyRow.id);
      // §12: this path serves CI and the saf CLI on pre-N pods too — the
      // stored hash must stay byte-identical bcrypt while the gate is off.
      expect(reloaded?.apiKey).toBe(storedBefore);
      expect(reloaded?.apiKey.startsWith('$2b$')).toBe(true);
      // §17: gate-skipped rehashes log too (same event as the login path).
      const gateSkipMessage = expect.stringContaining('writes are disabled');
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: gateSkipMessage }),
      );
    } finally {
      if (priorGateEnvironment === undefined) {
        delete process.env.PASSWORD_HASH_WRITE_ENABLED;
      } else {
        process.env.PASSWORD_HASH_WRITE_ENABLED = priorGateEnvironment;
      }
    }
  });

  it('gates on jwt.verify BEFORE any KDF work — a forged token never reaches the KDF (§11 unauthenticated-reachability guard)', async () => {
    await seedApiKey(signature => hash(signature, 4));
    const forged = sign(
      { createdAt: new Date(), keyId: '1' },
      'not-the-real-secret',
    );
    const verifySpy = vi.spyOn(passwordService, 'verify');

    const result = await authnService.validateApiKey(forged);

    expect(result).toBeNull();
    // The expensive path must be unreachable without a valid signature.
    expect(verifySpy).not.toHaveBeenCalled();
  });

  it('still validates the key when the rehash write fails (§12 — no human retries a CI 401)', async () => {
    const { ownerId, token } = await seedApiKey(signature =>
      hash(signature, 4),
    );
    vi.spyOn(apiKeyService, 'updateApiKeyHash').mockRejectedValueOnce(
      new Error('database unavailable'),
    );
    const logSpy = vi
      .spyOn(authnService.logger, 'info')
      .mockReturnValue(authnService.logger);

    const result = await authnService.validateApiKey(token);

    expect((result as null | User)?.id).toBe(ownerId);
    expect(logSpy).toHaveBeenCalledTimes(1);
    const failureMessage = expect.stringContaining('rehash failed');
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: failureMessage }),
    );
  });

  it('never mutates the ApiKey instance with the new hash (apikey.service.ts:44 has the same un-awaited save trap)', async () => {
    const { apiKeyRow, token } = await seedApiKey(signature =>
      hash(signature, 4),
    );
    const storedBefore = apiKeyRow.apiKey;
    // Assert on the instance validateApiKey ACTUALLY works with — it fetches
    // its own via findById, so asserting on the test's copy would prove
    // nothing (it cannot change no matter what the service does). The spy
    // calls through; mock.results holds the served instance.
    const findByIdSpy = vi.spyOn(apiKeyService, 'findById');

    await authnService.validateApiKey(token);

    const served = (await findByIdSpy.mock.results[0].value) as ApiKey;
    // If the service assigned the new hash to this instance, the racing
    // un-awaited save at apikey.service.ts:44 could persist it OUTSIDE the CAS
    // predicate — the §7 revert. Both assertions fail if that ever happens.
    expect(served.apiKey).toBe(storedBefore);
    expect(served.changed()).toBe(false);
    // ...while the DB itself did move to PBKDF2 through the CAS writer.
    const reloaded = await ApiKey.findByPk<ApiKey>(apiKeyRow.id);
    expect(reloaded?.apiKey.startsWith('$pbkdf2-')).toBe(true);
    expect(storedBefore.startsWith('$2')).toBe(true);
  });

  it('refuses a FIPS-refused (requiresReset) key with the path generic failure and WARNS with the key id (§17 operator-actionable)', async () => {
    const { apiKeyRow, token } = await seedApiKey(signature =>
      hash(signature, 4),
    );
    vi.spyOn(passwordService, 'verify').mockResolvedValueOnce({
      needsRehash: false,
      requiresReset: true,
      valid: false,
    });
    const warnSpy = vi
      .spyOn(authnService.logger, 'warn')
      .mockReturnValue(authnService.logger);

    const result = await authnService.validateApiKey(token);

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const idInMessage = expect.stringContaining(apiKeyRow.id);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: idInMessage }),
    );
  });

  it('a successful key rehash emits one info log with apiKeyId, from bcrypt, to pbkdf2-sha512, and iterations (§17)', async () => {
    const { apiKeyRow, token } = await seedApiKey(signature =>
      hash(signature, 4),
    );
    const logSpy = vi
      .spyOn(authnService.logger, 'info')
      .mockReturnValue(authnService.logger);

    const result = await authnService.validateApiKey(token);

    expect(result).not.toBeNull();
    expect(logSpy).toHaveBeenCalledTimes(1);
    const [logged] = logSpy.mock.calls[0] as [{ message: string }];
    expect(logged.message).toContain(`ApiKey<ID: ${apiKeyRow.id}>`);
    expect(logged.message).toContain('bcrypt');
    expect(logged.message).toContain('pbkdf2-sha512');
    expect(logged.message).toContain('600000');
  });

  it('logs the CAS-lost key rehash at info as a skip (§7 benign case is still an event)', async () => {
    const { ownerId, token } = await seedApiKey(signature =>
      hash(signature, 4),
    );
    vi.spyOn(apiKeyService, 'updateApiKeyHash').mockResolvedValueOnce(0);
    const logSpy = vi
      .spyOn(authnService.logger, 'info')
      .mockReturnValue(authnService.logger);

    const result = await authnService.validateApiKey(token);

    expect((result as null | User)?.id).toBe(ownerId);
    expect(logSpy).toHaveBeenCalledTimes(1);
    const [logged] = logSpy.mock.calls[0] as [{ message: string }];
    expect(logged.message).toContain('compare-and-swap lost');
  });

  it('returns null for a valid token whose stored hash does not match the signature', async () => {
    const { apiKeyRow, token } = await seedApiKey(() =>
      hash('a-different-signature-entirely', 4),
    );

    const result = await authnService.validateApiKey(token);

    expect(result).toBeNull();
    // A failed verification must NOT rehash anything.
    const reloaded = await ApiKey.findByPk<ApiKey>(apiKeyRow.id);
    expect(reloaded?.apiKey.startsWith('$2')).toBe(true);
  });

  it('does not rehash a key already stored as PBKDF2 (no churn)', async () => {
    const { apiKeyRow, ownerId, token } = await seedApiKey(signature =>
      hashPassword(signature),
    );
    const rowBefore = await ApiKey.findByPk<ApiKey>(apiKeyRow.id);
    const storedBefore = rowBefore?.apiKey;

    const result = await authnService.validateApiKey(token);

    expect((result as null | User)?.id).toBe(ownerId);
    const rowAfter = await ApiKey.findByPk<ApiKey>(apiKeyRow.id);
    expect(rowAfter?.apiKey).toBe(storedBefore);
  });
});
