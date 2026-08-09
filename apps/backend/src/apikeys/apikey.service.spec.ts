import {SequelizeModule} from '@nestjs/sequelize';
import {Test} from '@nestjs/testing';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {ConfigService} from '../config/config.service';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {Evaluation} from '../evaluations/evaluation.model';
import {GroupEvaluation} from '../group-evaluations/group-evaluation.model';
import {GroupUser} from '../group-users/group-user.model';
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';
import {ApiKey} from './apikey.model';
import {ApiKeyService} from './apikey.service';

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
          EvaluationTag
        ])
      ],
      providers: [ApiKeyService, ConfigService, DatabaseService]
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
      type: 'user'
    });
    apiKeyId = created.id;
  });

  it('returns 0 and writes nothing when the stored hash no longer matches originalHash', async () => {
    const affected = await apiKeyService.updateApiKeyHash(
      apiKeyId,
      'a-stale-hash-that-does-not-match',
      NEW
    );
    expect(affected).toBe(0);
    const reloaded = await ApiKey.findByPk<ApiKey>(apiKeyId);
    expect(reloaded?.apiKey).toBe(ORIGINAL);
  });

  it('returns 1 and swaps apiKey when originalHash matches', async () => {
    const affected = await apiKeyService.updateApiKeyHash(
      apiKeyId,
      ORIGINAL,
      NEW
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
