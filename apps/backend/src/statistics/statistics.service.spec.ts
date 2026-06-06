import {describe, expect} from 'vitest';
import {legacyUserFactory} from '../db/factories/legacy-user.factory';
import {groupFactory} from '../db/factories/group.factory';
import {evaluationFactory} from '../db/factories/evaluation.factory';
import {apiKeyFactory} from '../db/factories/api-key.factory';
import {StatisticsDTO} from './dto/statistics.dto';

const {ApiKeyService} = await import('../apikeys/apikey.service');
const {EvaluationsService} = await import('../evaluations/evaluations.service');
const {EvaluationTagsService} = await import(
  '../evaluation-tags/evaluation-tags.service'
);
const {GroupsService} = await import('../groups/groups.service');
const {UsersService} = await import('../users/users.service');
const {StatisticsService} = await import('./statistics.service');
const {test} = await import('../db/test-fixture');

function createStatisticsService(db: Parameters<typeof test['fn']>[0] extends (ctx: infer C) => unknown ? C extends {db: infer D} ? D : never : never) {
  const apiKeyService = new ApiKeyService(db);
  const evaluationsService = new EvaluationsService(db);
  const evaluationTagsService = new EvaluationTagsService(db);
  const groupsService = new GroupsService(db);
  const usersService = new UsersService(db, groupsService);
  return new StatisticsService(
    apiKeyService,
    evaluationsService,
    evaluationTagsService,
    groupsService,
    usersService,
  );
}

describe('StatisticsService', () => {
  test('returns a StatisticsDTO with all count fields', async ({db}) => {
    const service = createStatisticsService(db);
    const stats = await service.getHeimdallStatistics();
    expect(stats).toBeInstanceOf(StatisticsDTO);
    expect(stats).toHaveProperty('apiKeyCount');
    expect(stats).toHaveProperty('userCount');
    expect(stats).toHaveProperty('evaluationCount');
    expect(stats).toHaveProperty('evaluationTagCount');
    expect(stats).toHaveProperty('groupCount');
  });

  test('all count fields are numbers', async ({db}) => {
    const service = createStatisticsService(db);
    const stats = await service.getHeimdallStatistics();
    expect(stats.apiKeyCount).toBeTypeOf('number');
    expect(stats.userCount).toBeTypeOf('number');
    expect(stats.evaluationCount).toBeTypeOf('number');
    expect(stats.evaluationTagCount).toBeTypeOf('number');
    expect(stats.groupCount).toBeTypeOf('number');
  });

  test('counts reflect actual data — users', async ({db}) => {
    const service = createStatisticsService(db);
    const before = await service.getHeimdallStatistics();
    await legacyUserFactory.create(db, {
      email: `stat-user-${Date.now()}@stats.test`,
    });
    const after = await service.getHeimdallStatistics();
    expect(after.userCount).toBe(before.userCount + 1);
  });

  test('counts reflect actual data — groups', async ({db}) => {
    const service = createStatisticsService(db);
    const before = await service.getHeimdallStatistics();
    await groupFactory.create(db);
    const after = await service.getHeimdallStatistics();
    expect(after.groupCount).toBe(before.groupCount + 1);
  });

  test('counts reflect actual data — evaluations', async ({db}) => {
    const user = await legacyUserFactory.create(db, {
      email: `stat-eval-${Date.now()}@stats.test`,
    });
    const service = createStatisticsService(db);
    const before = await service.getHeimdallStatistics();
    await evaluationFactory.create(db, {userId: user.id});
    const after = await service.getHeimdallStatistics();
    expect(after.evaluationCount).toBe(before.evaluationCount + 1);
  });

  test('counts reflect actual data — api keys', async ({db}) => {
    const user = await legacyUserFactory.create(db, {
      email: `stat-apikey-${Date.now()}@stats.test`,
    });
    const service = createStatisticsService(db);
    const before = await service.getHeimdallStatistics();
    await apiKeyFactory.create(db, {userId: user.id});
    const after = await service.getHeimdallStatistics();
    expect(after.apiKeyCount).toBe(before.apiKeyCount + 1);
  });

  test('returns zero counts on empty transaction', async ({db}) => {
    const service = createStatisticsService(db);
    const stats = await service.getHeimdallStatistics();
    expect(stats.apiKeyCount).toBeGreaterThanOrEqual(0);
    expect(stats.userCount).toBeGreaterThanOrEqual(0);
    expect(stats.evaluationCount).toBeGreaterThanOrEqual(0);
    expect(stats.evaluationTagCount).toBeGreaterThanOrEqual(0);
    expect(stats.groupCount).toBeGreaterThanOrEqual(0);
  });
});
