import * as nodeCrypto from 'node:crypto';
import { SequelizeModule } from '@nestjs/sequelize';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { ApiKey } from '../apikeys/apikey.model';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { CryptoModule } from '../crypto/crypto.module';
import { HashMigrationMarker } from '../crypto/hash-migration-marker.model';
import { HashWriteGateService } from '../crypto/hash-write-gate.service';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { EvaluationTag } from '../evaluation-tags/evaluation-tag.model';
import { Evaluation } from '../evaluations/evaluation.model';
import { GroupEvaluation } from '../group-evaluations/group-evaluation.model';
import { GroupUser } from '../group-users/group-user.model';
import { Group } from '../groups/group.model';
import { User } from '../users/user.model';
import { HealthService } from './health.service';

// Pass-through mock: every crypto member stays real; getFips gains a
// mockable seam (vi.spyOn on ESM builtin namespaces is not configurable —
// the fips.spec.ts pattern).
vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof nodeCrypto>();
  return { ...actual, getFips: vi.fn(actual.getFips) };
});

// Prefix-shaped literals for the §17 count queries — never verified as
// credentials, only matched against LIKE '$2%' / '$pbkdf2-%'.
const BCRYPT_SHAPED_HASH
  = '$2b$14$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const PBKDF2_SHAPED_HASH = '$pbkdf2-sha512$i=600000$c2FsdHNhbHQ$aGFzaGhhc2g';
const DAY_MS = 24 * 60 * 60 * 1000;
const THREE_DAYS_INTERVAL_PREFIX = /^3 days/v;

describe('HealthService Unit Tests', () => {
  let healthService: HealthService;
  let configService: ConfigService;
  let databaseService: DatabaseService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule,
        CryptoModule,
        DatabaseModule,
        SequelizeModule.forFeature([
          ApiKey,
          Evaluation,
          EvaluationTag,
          Group,
          GroupEvaluation,
          GroupUser,
          User,
        ]),
      ],
      providers: [DatabaseService, HealthService],
    }).compile();

    healthService = module.get<HealthService>(HealthService);
    configService = module.get<ConfigService>(ConfigService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    configService.set('FIPS_MODE', undefined);
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });

  describe('getDetails', () => {
    it('returns zero counts, null oldestUnmigratedLogin, and the exact §17 shape on empty tables', async () => {
      expect(await healthService.getDetails()).toEqual({
        bcryptRemaining: { apiKeys: 0, users: 0 },
        fips: false,
        fipsModeAsserted: false,
        oldestUnmigratedLogin: null,
        passwordHashWriteEnabled: true,
        pbkdf2Migrated: { apiKeys: 0, users: 0 },
      });
    });

    it('splits counts by hash prefix over BOTH tables and reports the OLDEST unmigrated login (§17 FILTER shape)', async () => {
      const bcryptUserOld = await User.create({
        creationMethod: 'local',
        email: 'bcrypt-old@example.com',
        encryptedPassword: BCRYPT_SHAPED_HASH,
        lastLogin: new Date(Date.now() - 3 * DAY_MS),
      });
      await User.create({
        creationMethod: 'local',
        email: 'bcrypt-recent@example.com',
        encryptedPassword: BCRYPT_SHAPED_HASH,
        lastLogin: new Date(Date.now() - 1 * DAY_MS),
      });
      await User.create({
        creationMethod: 'local',
        email: 'pbkdf2-older-login@example.com',
        encryptedPassword: PBKDF2_SHAPED_HASH,
        // Older than every bcrypt login — must NOT win: the age() aggregate
        // is FILTERed to unmigrated ('$2%') rows only.
        lastLogin: new Date(Date.now() - 5 * DAY_MS),
      });
      await ApiKey.create({
        apiKey: BCRYPT_SHAPED_HASH,
        name: 'legacy key',
        userId: bcryptUserOld.id,
      });
      await ApiKey.create({
        apiKey: PBKDF2_SHAPED_HASH,
        name: 'migrated key',
        userId: bcryptUserOld.id,
      });

      expect(await healthService.getDetails()).toEqual({
        bcryptRemaining: { apiKeys: 1, users: 2 },
        fips: false,
        fipsModeAsserted: false,
        oldestUnmigratedLogin: expect.stringMatching(
          THREE_DAYS_INTERVAL_PREFIX,
        ),
        passwordHashWriteEnabled: true,
        pbkdf2Migrated: { apiKeys: 1, users: 1 },
      });
    });

    it('reports null oldestUnmigratedLogin when no unmigrated user has ever logged in', async () => {
      await User.create({
        creationMethod: 'local',
        email: 'bcrypt-never-logged-in@example.com',
        encryptedPassword: BCRYPT_SHAPED_HASH,
      });
      await User.create({
        creationMethod: 'local',
        email: 'pbkdf2-logged-in@example.com',
        encryptedPassword: PBKDF2_SHAPED_HASH,
        lastLogin: new Date(Date.now() - 2 * DAY_MS),
      });

      const details = await healthService.getDetails();
      expect(details.oldestUnmigratedLogin).toBeNull();
      expect(details.bcryptRemaining).toEqual({ apiKeys: 0, users: 1 });
    });

    it('reports fipsModeAsserted=true for FIPS_MODE=true while fips still reflects the real provider probe', async () => {
      configService.set('FIPS_MODE', 'true');
      const details = await healthService.getDetails();
      expect(details.fipsModeAsserted).toBe(true);
      // Non-FIPS test host: the OpenSSL probe is independent of the setting.
      expect(details.fips).toBe(false);
    });

    it('reports fips=true when the OpenSSL provider probe is active (getFips()===1)', async () => {
      vi.mocked(nodeCrypto.getFips).mockReturnValueOnce(1);
      const details = await healthService.getDetails();
      expect(details.fips).toBe(true);
    });

    it('reports passwordHashWriteEnabled=false when the write gate derives OFF (explicit env)', async () => {
      const priorSetting = process.env.PASSWORD_HASH_WRITE_ENABLED;
      process.env.PASSWORD_HASH_WRITE_ENABLED = 'false';
      try {
        // Fresh instances: the module singletons cached the suite-wide
        // gate-ON derivation. The explicit-env path never touches the
        // injected models (hash-write-gate contract).
        const gatedOffService = new HealthService(
          configService,
          new HashWriteGateService(HashMigrationMarker, User, configService),
          databaseService.sequelize,
        );
        const details = await gatedOffService.getDetails();
        expect(details.passwordHashWriteEnabled).toBe(false);
      } finally {
        process.env.PASSWORD_HASH_WRITE_ENABLED = priorSetting;
      }
    });
  });
});
