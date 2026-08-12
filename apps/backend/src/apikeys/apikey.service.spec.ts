import { SequelizeModule } from '@nestjs/sequelize';
import { Test } from '@nestjs/testing';
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
import { CryptoModule } from '../crypto/crypto.module';
import { verifyPassword } from '../crypto/password';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { EvaluationTag } from '../evaluation-tags/evaluation-tag.model';
import { Evaluation } from '../evaluations/evaluation.model';
import { GroupEvaluation } from '../group-evaluations/group-evaluation.model';
import { GroupUser } from '../group-users/group-user.model';
import { Group } from '../groups/group.model';
import { User } from '../users/user.model';
import { ApiKey } from './apikey.model';
import { ApiKeyService } from './apikey.service';

// ADR-006 §7: narrow compare-and-swap writer for lazy API-key rehash. Same
// shape as UsersService.updateEncryptedPassword, against the ApiKeys.apiKey
// hash column. This spec did not exist before this card.
describe('ApiKeyService.updateApiKeyHash (§7 compare-and-swap)', () => {
  let apiKeyService: ApiKeyService;
  let databaseService: DatabaseService;
  const ORIGINAL = '$pbkdf2-sha512$i=600000$origOrigOrigOrigOrig$origKeyOrig';
  const NEW = '$pbkdf2-sha512$i=600000$newnewnewnewnewnew$newKeyNewKey';
  let apiKeyId: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      // The full model set must be registered so ApiKey's @BelongsTo(User,
      // Group) and their transitive associations (Group↔User through
      // GroupUser, etc.) resolve — constraints:false still needs the models
      // defined. Mirrors users.service.spec's registration set.
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
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    // Insert a key row with a known stored hash (associations are
    // constraints:false and userId is nullable, so no owner is required).
    const created = await ApiKey.create({
      apiKey: ORIGINAL,
      name: 'cas-test',
      type: 'user',
    });
    apiKeyId = created.id;
  });

  it('returns 0 and writes nothing when the stored hash no longer matches originalHash', async () => {
    const affected = await apiKeyService.updateApiKeyHash(
      apiKeyId,
      'a-stale-hash-that-does-not-match',
      NEW,
    );
    expect(affected).toBe(0);
    const reloaded = await ApiKey.findByPk<ApiKey>(apiKeyId);
    expect(reloaded?.apiKey).toBe(ORIGINAL);
  });

  it('returns 1 and swaps apiKey when originalHash matches', async () => {
    const affected = await apiKeyService.updateApiKeyHash(
      apiKeyId,
      ORIGINAL,
      NEW,
    );
    expect(affected).toBe(1);
    const reloaded = await ApiKey.findByPk<ApiKey>(apiKeyId);
    expect(reloaded?.apiKey).toBe(NEW);
  });

  it('does NOT bump updatedAt on a winning write (silent: true)', async () => {
    const before = await ApiKey.findByPk<ApiKey>(apiKeyId);
    const beforeUpdatedAt = before?.updatedAt?.getTime();
    await apiKeyService.updateApiKeyHash(apiKeyId, ORIGINAL, NEW);
    const after = await ApiKey.findByPk<ApiKey>(apiKeyId);
    expect(after?.updatedAt?.getTime()).toBe(beforeUpdatedAt);
  });

  it('does NOT touch name or type', async () => {
    await apiKeyService.updateApiKeyHash(apiKeyId, ORIGINAL, NEW);
    const after = await ApiKey.findByPk<ApiKey>(apiKeyId);
    expect(after?.name).toBe('cas-test');
    expect(after?.type).toBe('user');
  });
});

// ADR-006 §2: exact prefix — algorithm AND iteration count pinned. Module
// scope so the regex is compiled once.
const PHC_SHA512_600K_PREFIX = /^\$pbkdf2-sha512\$i=600000\$/v;

// ADR-006 §4 site 7: create() hashes the JWT signature (and ONLY the
// signature — §11/Scope: changing what is hashed invalidates every existing
// key) through PasswordService into the ApiKeys.apiKey column. Own harness so
// this suite controls API_KEY_SECRET (jwt.sign throws on an empty secret).
describe('ApiKeyService.create (§4 site 7 — PBKDF2 hash of the JWT signature)', () => {
  let apiKeyService: ApiKeyService;
  let databaseService: DatabaseService;
  let owner: User;
  const priorApiKeySecret = process.env.API_KEY_SECRET;

  beforeAll(async () => {
    // AppConfig.get reads process.env first, live at each call.
    process.env.API_KEY_SECRET = 'apikey-spec-secret';
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
  });

  afterAll(async () => {
    if (priorApiKeySecret === undefined) {
      delete process.env.API_KEY_SECRET;
    } else {
      process.env.API_KEY_SECRET = priorApiKeySecret;
    }
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    owner = await User.create({
      creationMethod: 'local',
      email: 'apikey-owner@example.com',
      encryptedPassword: 'placeholder-never-verified-in-this-suite',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores the JWT signature as a PBKDF2 PHC hash that round-trips through verifyPassword', async () => {
    expect.assertions(4);
    const result = await apiKeyService.create(owner, {
      currentPassword: 'unused-by-service-layer',
      name: 'site-7-key',
    });
    // The caller receives the full JWT; the DB holds only a signature hash.
    expect(result.apiKey.split('.', 3)).toHaveLength(3);
    const stored = await ApiKey.findByPk<ApiKey>(result.id);
    expect(stored?.apiKey).toMatch(PHC_SHA512_600K_PREFIX);
    const verification = await verifyPassword({
      hash: stored?.apiKey ?? '',
      password: result.apiKey.split('.', 3)[2],
    });
    expect(verification.valid).toBe(true);
    expect(verification.needsRehash).toBe(false);
  });

  it('persists the signature hash BEFORE create() resolves (the hash write is awaited)', async () => {
    expect.assertions(2);
    // Found defect fixed in this card: the second save() was un-awaited, so
    // create() could resolve before the hash hit the DB — a client using the
    // key immediately could 403, and a failed save became an unhandled
    // rejection. The spy calls through and records settlement: a save still
    // in its Postgres round trip is 'incomplete' when create() resolves, so
    // an un-awaited write can never report 'fulfilled' here.
    const saveSpy = vi.spyOn(ApiKey.prototype, 'save');
    const result = await apiKeyService.create(owner, {
      currentPassword: 'unused-by-service-layer',
      name: 'awaited-key',
    });
    expect(saveSpy.mock.settledResults.map(entry => entry.type)).toEqual([
      'fulfilled',
      'fulfilled',
    ]);
    const stored = await ApiKey.findByPk<ApiKey>(result.id);
    expect(stored?.apiKey).toMatch(PHC_SHA512_600K_PREFIX);
  });
});
