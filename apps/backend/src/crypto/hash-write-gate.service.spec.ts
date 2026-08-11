import * as nodeCrypto from 'node:crypto';
import { KNOWN_GOOD_VECTORS } from '@heimdall/password-hash-vectors';
import { getModelToken, SequelizeModule } from '@nestjs/sequelize';
import { Test } from '@nestjs/testing';
import { compare as bcryptCompare } from 'bcryptjs';
import { Sequelize } from 'sequelize-typescript';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { ConfigService } from '../config/config.service';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { EvaluationTag } from '../evaluation-tags/evaluation-tag.model';
import { Evaluation } from '../evaluations/evaluation.model';
import { GroupEvaluation } from '../group-evaluations/group-evaluation.model';
import { GroupUser } from '../group-users/group-user.model';
import { Group } from '../groups/group.model';
import { User } from '../users/user.model';
import { HashMigrationMarker } from './hash-migration-marker.model';
import { HashWriteGateService } from './hash-write-gate.service';
import { verifyPassword } from './password';
import { PasswordService } from './password.service';

const PASSWORD = 'CorrectHorse15!x';

// Module-scope assertion patterns (prefer-static-regex).
const BCRYPT_COST_14_PREFIX = /^\$2b\$14\$/v;
const ENV_VALIDATION_MESSAGE = /PASSWORD_HASH_WRITE_ENABLED must be 'true' or 'false'/v;
const FIPS_COHERENCE_MESSAGE = /PASSWORD_HASH_WRITE_ENABLED=false is incompatible with FIPS mode/v;
const REFUSAL_MESSAGE = /REFUSING TO START.*epoch 2.*epoch 1.*[Rr]emedy/sv;

// Pass-through wrap so the §3 coherence test can steer ONE getFips result —
// real host FIPS state cannot be entered in CI (§10: it is host-level).
// Every other node:crypto function (pbkdf2, randomBytes, timingSafeEqual)
// goes to the real implementation via the spread.
vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof nodeCrypto>();
  return { ...actual, getFips: vi.fn(actual.getFips) };
});

// ADR-006 §12: the rollout write gate. Real-DB harness (the derivation probes
// the Users table and the durable marker). Services are constructed MANUALLY
// per test — the derivation is boot-scoped and cached per instance, so a fresh
// instance per case is the only way to exercise both derivation outcomes.
describe('HashWriteGateService — §12 rollout write gate', () => {
  let databaseService: DatabaseService;
  let configService: ConfigService;
  let markerModel: typeof HashMigrationMarker;
  let userModel: typeof User;
  let sequelize: Sequelize;
  const priorEnvironment = process.env.PASSWORD_HASH_WRITE_ENABLED;

  function freshGate(): HashWriteGateService {
    return new HashWriteGateService(markerModel, userModel, configService);
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        SequelizeModule.forFeature([
          HashMigrationMarker,
          User,
          GroupUser,
          Group,
          GroupEvaluation,
          Evaluation,
          EvaluationTag,
        ]),
      ],
      providers: [ConfigService, DatabaseService],
    }).compile();
    databaseService = module.get<DatabaseService>(DatabaseService);
    configService = module.get<ConfigService>(ConfigService);
    markerModel = module.get<typeof HashMigrationMarker>(
      getModelToken(HashMigrationMarker),
    );
    userModel = module.get<typeof User>(getModelToken(User));
    sequelize = module.get<Sequelize>(Sequelize);
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    delete process.env.PASSWORD_HASH_WRITE_ENABLED;
  });

  afterEach(() => {
    if (priorEnvironment === undefined) {
      delete process.env.PASSWORD_HASH_WRITE_ENABLED;
    } else {
      process.env.PASSWORD_HASH_WRITE_ENABLED = priorEnvironment;
    }
  });

  it('when PASSWORD_HASH_WRITE_ENABLED=false: the gate reports writesEnabled=false and PasswordService.hash still produces a legacy-readable bcrypt credential', async () => {
    expect.assertions(4);
    process.env.PASSWORD_HASH_WRITE_ENABLED = 'false';
    const gate = freshGate();
    expect(await gate.writesEnabled()).toBe(false);
    // §12 scope: a NEW credential written while the gate is off must stay
    // readable by a pre-N pod — so hash() falls back to bcrypt, and the
    // credential carries rehash debt for after the gate opens.
    const passwordService = new PasswordService(configService, gate);
    const hash = await passwordService.hash(PASSWORD);
    expect(hash).toMatch(BCRYPT_COST_14_PREFIX);
    const result = await verifyPassword({ hash, password: PASSWORD });
    expect(result.valid).toBe(true);
    expect(result.needsRehash).toBe(true);
  });

  describe('§12 derivation — both ways, per the settled 2026-08-05 decision', () => {
    it('env unset + empty Users table → ENABLED (fresh install, no pre-N peer can exist)', async () => {
      expect(await freshGate().writesEnabled()).toBe(true);
    });

    it('env unset + existing users + no marker → DISABLED (upgrade default, rolling window possible)', async () => {
      await User.create({
        creationMethod: 'local',
        email: 'derivation-upgrade@example.com',
        encryptedPassword: 'placeholder-never-verified-here',
      });
      expect(await freshGate().writesEnabled()).toBe(false);
    });

    it('env unset + existing users + marker present → ENABLED (PBKDF2 writes already began; sticky)', async () => {
      await User.create({
        creationMethod: 'local',
        email: 'derivation-sticky@example.com',
        encryptedPassword: 'placeholder-never-verified-here',
      });
      await HashMigrationMarker.create({
        markerVersion: 1,
        pbkdf2WritesBeganAt: new Date(),
      });
      expect(await freshGate().writesEnabled()).toBe(true);
    });

    it('env true + existing users → ENABLED (explicit env wins over the upgrade default)', async () => {
      await User.create({
        creationMethod: 'local',
        email: 'derivation-env-wins@example.com',
        encryptedPassword: 'placeholder-never-verified-here',
      });
      process.env.PASSWORD_HASH_WRITE_ENABLED = 'true';
      expect(await freshGate().writesEnabled()).toBe(true);
    });

    it('an invalid value throws at construction (§9: out-of-range config never clamps silently)', () => {
      process.env.PASSWORD_HASH_WRITE_ENABLED = 'yes';
      expect(() => freshGate()).toThrow(ENV_VALIDATION_MESSAGE);
    });
  });

  describe('§12 the REAL fresh-install sequence — migrate, seed, then boot (AC-review round-1 finding)', () => {
    it('after the admin seeder runs (its PBKDF2 write plants the marker), the first app boot derives ENABLED', async () => {
      expect.assertions(3);
      // cmd.sh runs db:migrate -> db:seed:all -> start, so the app's FIRST
      // derivation happens with the seeded admin already in Users. Without
      // the seeder planting the marker on its own (first) PBKDF2 write, the
      // derivation would see users=1/markers=0 and return the upgrade
      // default — leaving every fresh containerized install writing bcrypt
      // forever. This drives the seeder through a REAL queryInterface. The
      // path lives in a const so tsc does not demand declarations for the
      // out-of-project CJS file (test/seeders.spec.ts's loading pattern).
      const seederPath = '../../seeders/20200514154327-create-administrator.js';
      const seederModule = (await import(
        seederPath,
      )) as { up: (queryInterface: unknown) => Promise<unknown> };
      await seederModule.up(sequelize.getQueryInterface());
      expect(await userModel.count()).toBe(1);
      expect(await HashMigrationMarker.count()).toBe(1);
      expect(await freshGate().writesEnabled()).toBe(true);
    });
  });

  describe('§12 durable marker — planted on the first PBKDF2 write only', () => {
    it('the first PBKDF2 hash plants exactly one row {markerVersion: 1, pbkdf2WritesBeganAt}; a second hash does not duplicate it', async () => {
      expect.assertions(4);
      process.env.PASSWORD_HASH_WRITE_ENABLED = 'true';
      const passwordService = new PasswordService(configService, freshGate());
      expect(await HashMigrationMarker.count()).toBe(0);
      await passwordService.hash(PASSWORD);
      const rows = await HashMigrationMarker.findAll();
      expect(rows).toHaveLength(1);
      expect(rows[0].markerVersion).toBe(1);
      await passwordService.hash(PASSWORD);
      expect(await HashMigrationMarker.count()).toBe(1);
    });

    it('a bcrypt fallback write (gate off) plants NOTHING — the marker must never record something untrue', async () => {
      expect.assertions(2);
      process.env.PASSWORD_HASH_WRITE_ENABLED = 'false';
      const passwordService = new PasswordService(configService, freshGate());
      const hash = await passwordService.hash(PASSWORD);
      expect(hash).toMatch(BCRYPT_COST_14_PREFIX);
      expect(await HashMigrationMarker.count()).toBe(0);
    });
  });

  describe('§12 mechanism 3 — startup refusal on a newer marker', () => {
    it('refuses to start when the marker records a newer write epoch, naming the remedy', async () => {
      expect.assertions(1);
      await HashMigrationMarker.create({
        markerVersion: 2,
        pbkdf2WritesBeganAt: new Date(),
      });
      await expect(freshGate().assertMarkerCompatible()).rejects.toThrow(
        REFUSAL_MESSAGE,
      );
    });

    it('starts normally when the marker matches the supported epoch', async () => {
      await HashMigrationMarker.create({
        markerVersion: 1,
        pbkdf2WritesBeganAt: new Date(),
      });
      await expect(
        freshGate().assertMarkerCompatible(),
      ).resolves.toBeUndefined();
    });

    it('starts normally when no marker exists (PBKDF2 writes never began)', async () => {
      await expect(
        freshGate().assertMarkerCompatible(),
      ).resolves.toBeUndefined();
    });
  });

  describe('§3 coherence — the bcrypt fallback is FIPS-gated', () => {
    it('gate off + FIPS mode on → hash() refuses rather than generate bcrypt inside the validated boundary (V-222571)', async () => {
      expect.assertions(1);
      process.env.PASSWORD_HASH_WRITE_ENABLED = 'false';
      const passwordService = new PasswordService(configService, freshGate());
      vi.mocked(nodeCrypto.getFips).mockReturnValueOnce(1);
      await expect(passwordService.hash(PASSWORD)).rejects.toThrow(
        FIPS_COHERENCE_MESSAGE,
      );
    });
  });

  describe('§12(4) graceful degradation — the old verify path against a PBKDF2 hash', () => {
    it('bcryptjs.compare returns a clean false (no throw) for every known-good PBKDF2 vector', async () => {
      // The rolling-deploy hazard §12(a) describes: a pre-N pod running
      // bcryptjs.compare against a row a new pod rehashed. The contract lib's
      // vectors stand in for those rows.
      expect(KNOWN_GOOD_VECTORS.length).toBeGreaterThan(0);
      for (const vector of KNOWN_GOOD_VECTORS) {
        await expect(
          bcryptCompare(vector.password, vector.hash),
        ).resolves.toBe(false);
      }
    });
  });
});
