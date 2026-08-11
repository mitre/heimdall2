import type { JwtService } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { hashSync } from 'bcryptjs';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { GROUPS_SERVICE_MOCK } from '../../test/constants/groups-test.constant';
import { UPDATE_USER_DTO_TEST_OBJ } from '../../test/constants/users-test.constant';
import type { ApiKeyService } from '../apikeys/apikey.service';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import type { ConfigService } from '../config/config.service';
import { ConfigService as RealConfigService } from '../config/config.service';
import { CryptoModule } from '../crypto/crypto.module';
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

/**
 * ADR-006 §7 lifecycle regression suite (heimdall2-e25.17): a lazy rehash is
 * INVISIBLE to every lifecycle mechanism — it changes only the stored
 * representation of the credential. §7's corrected test scope governs:
 * lastLogin/loginCount/updatedAt change on login BY DESIGN
 * (updateLoginMetadata), so this suite asserts exactly what must NOT change:
 * passwordChangedAt (the password-expiry clock) and forcePasswordChange.
 * §6: bcrypt's silent 72-byte truncation must be GONE after conversion.
 */

// Legacy fixture cost: verification accepts any cost factor, and cost 10
// keeps fixture minting fast — production cost (14) would add ~1s per hash
// for no additional coverage.
const LEGACY_BCRYPT_COST = 10;
const KNOWN_PASSWORD = 'correct horse battery staple 42!';
const NEW_PASSWORD = 'aB1!cD2@eF3#gH4$x9';
// 100 ASCII chars (1 byte each): bcrypt silently truncates at byte 72, so
// the tail beyond it is invisible to legacy verification (§6).
const LONG_PASSWORD = 'L0ng!'.repeat(20);
const LONG_PASSWORD_WRONG_TAIL
  = LONG_PASSWORD.slice(0, 72) + 'X'.repeat(28);
// Seeded well in the past so an accidental rewrite is unambiguous.
const SEEDED_CHANGED_AT = new Date('2026-01-15T12:00:00.000Z');
const PBKDF2_PREFIX = /^\$pbkdf2-sha512\$/v;

function createBcryptUser(
  email: string,
  password: string,
  hasPendingForcedChange = false,
): Promise<User> {
  return User.create({
    creationMethod: 'local',
    email,
    encryptedPassword: hashSync(password, LEGACY_BCRYPT_COST),
    forcePasswordChange: hasPendingForcedChange,
    passwordChangedAt: SEEDED_CHANGED_AT,
  });
}

/**
 * §7 known wrinkle: migration-built DBs store passwordChangedAt as
 * VARCHAR(255) while synchronize-built DBs use DATE — so the column round-
 * trips as string OR Date depending on how the test DB was built. Compare
 * type-agnostically: Dates by ISO value, everything else byte-identical.
 */
function normalizeTimestamp(value: unknown): null | string {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  // §7 names exactly two storage types; anything else is a new defect and
  // must fail loudly, never stringify into a comparison.
  throw new TypeError(
    `passwordChangedAt round-tripped as unexpected type: ${typeof value}`,
  );
}

describe('Rehash lifecycle regression suite (ADR-006 §7 corrected scope)', () => {
  let authnService: AuthnService;
  let databaseService: DatabaseService;
  let usersService: UsersService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
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
        CryptoModule,
      ],
      providers: [
        RealConfigService,
        DatabaseService,
        UsersService,
        { provide: GroupsService, useValue: GROUPS_SERVICE_MOCK },
      ],
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    usersService = module.get<UsersService>(UsersService);

    // AuthnService ⇄ UsersService is a circular import (users.service.ts
    // calls AuthnService.prototype.testPassword unbound), so Nest cannot
    // DI-resolve AuthnService here — the authn.service.spec.ts pattern:
    // construct it directly with the REAL collaborators this suite exercises
    // (usersService, passwordService) and inert stand-ins for the ones the
    // validateUser path never touches (apiKeyService, configService,
    // jwtService).
    authnService = new AuthnService(
      {} as ApiKeyService,
      {} as ConfigService,
      usersService,
      {} as JwtService,
      module.get<PasswordService>(PasswordService),
    );
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });

  it('a login-triggered rehash leaves passwordChangedAt byte-identical and forcePasswordChange false, asserted after user.reload()', async () => {
    const user = await createBcryptUser(
      'rehash-lifecycle@example.com',
      KNOWN_PASSWORD,
    );
    await user.reload();
    const changedAtBefore = normalizeTimestamp(
      user.getDataValue('passwordChangedAt'),
    );
    expect(changedAtBefore).not.toBeNull();

    const validated = await authnService.validateUser(
      user.email,
      KNOWN_PASSWORD,
    );
    expect(validated).not.toBeNull();

    await user.reload();
    // The conversion must have HAPPENED for the unchanged-assertions to mean
    // anything (reviewer round 1: vacuous in isolation without this).
    expect(user.encryptedPassword).toMatch(PBKDF2_PREFIX);
    expect(
      normalizeTimestamp(user.getDataValue('passwordChangedAt')),
    ).toBe(changedAtBefore);
    expect(user.forcePasswordChange).toBe(false);
  });

  it('rehash preserves a PENDING mandated change: forcePasswordChange true stays true across conversion', async () => {
    const user = await createBcryptUser(
      'pending-forced-change@example.com',
      KNOWN_PASSWORD,
      true,
    );

    expect(
      await authnService.validateUser(user.email, KNOWN_PASSWORD),
    ).not.toBeNull();

    await user.reload();
    expect(user.encryptedPassword).toMatch(PBKDF2_PREFIX);
    // A rehash that cleared this flag would silently skip a mandated
    // password change — the compliance fix cancelling a security response.
    expect(user.forcePasswordChange).toBe(true);
  });

  it('rehash converts the stored credential: encryptedPassword changed and $pbkdf2-prefixed, read from reload not memory', async () => {
    const user = await createBcryptUser(
      'rehash-converts@example.com',
      KNOWN_PASSWORD,
    );
    const bcryptHashBefore = user.encryptedPassword;

    expect(
      await authnService.validateUser(user.email, KNOWN_PASSWORD),
    ).not.toBeNull();

    await user.reload();
    expect(user.encryptedPassword).not.toBe(bcryptHashBefore);
    expect(user.encryptedPassword).toMatch(PBKDF2_PREFIX);
  });

  it('BEFORE rehash a >72-char password verifies with a wrong tail — documents legacy bcrypt truncation (§6)', async () => {
    const user = await createBcryptUser(
      'legacy-truncation@example.com',
      LONG_PASSWORD,
    );

    // Characters 73-100 differ; bcrypt never sees them.
    expect(
      await authnService.validateUser(user.email, LONG_PASSWORD_WRONG_TAIL),
    ).not.toBeNull();
  });

  it('AFTER rehash character 73+ is validated: the wrong tail fails and the full password succeeds (§6 truncation gone)', async () => {
    const user = await createBcryptUser(
      'truncation-gone@example.com',
      LONG_PASSWORD,
    );

    // Convert with the CORRECT full-length password.
    expect(
      await authnService.validateUser(user.email, LONG_PASSWORD),
    ).not.toBeNull();
    await user.reload();
    expect(user.encryptedPassword).toMatch(PBKDF2_PREFIX);

    // The same wrong tail that verified under bcrypt now fails...
    expect(
      await authnService.validateUser(user.email, LONG_PASSWORD_WRONG_TAIL),
    ).toBeNull();
    // ...and the genuine full-length password still succeeds.
    expect(
      await authnService.validateUser(user.email, LONG_PASSWORD),
    ).not.toBeNull();
  });

  it('a GENUINE password change via usersService.update still sets the lifecycle fields (the narrow writer did not leak into the real path)', async () => {
    // Seeded TRUE so the expected clear is a real transition, not the
    // default value (reviewer round 1: false -> false was vacuous).
    const user = await createBcryptUser(
      'genuine-change@example.com',
      KNOWN_PASSWORD,
      true,
    );
    const admin = await User.create({
      creationMethod: 'local',
      email: 'genuine-change-admin@example.com',
      encryptedPassword: hashSync(KNOWN_PASSWORD, LEGACY_BCRYPT_COST),
      role: 'admin',
    });
    const abac = new CaslAbilityFactory().createForUser(admin);
    await user.reload();
    const changedAtBefore = normalizeTimestamp(
      user.getDataValue('passwordChangedAt'),
    );

    await usersService.update(
      user,
      {
        ...UPDATE_USER_DTO_TEST_OBJ,
        currentPassword: KNOWN_PASSWORD,
        forcePasswordChange: false,
        password: NEW_PASSWORD,
        passwordConfirmation: NEW_PASSWORD,
      },
      abac,
    );

    await user.reload();
    // The expiry clock DOES move on a genuine change — the exact opposite of
    // the rehash contract above. Compared against the reloaded stored value,
    // not the seed constant, so a format difference can never mask a no-op.
    expect(
      normalizeTimestamp(user.getDataValue('passwordChangedAt')),
    ).not.toBe(changedAtBefore);
    expect(user.forcePasswordChange).toBe(false);
    expect(user.encryptedPassword).toMatch(PBKDF2_PREFIX);
    expect(
      await authnService.validateUser(user.email, NEW_PASSWORD),
    ).not.toBeNull();
  });
});
