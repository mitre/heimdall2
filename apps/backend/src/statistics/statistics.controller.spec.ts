import {ForbiddenError} from '@casl/ability';
import {describe, expect, vi} from 'vitest';
import {
  apiKeyFactory,
  evaluationFactory,
  groupFactory,
  legacyUserFactory,
} from '../db/factories';
import {StatisticsDTO} from './dto/statistics.dto';
import type {TestDb} from '../db/test-fixture';

vi.stubEnv('API_KEY_SECRET', 'test-api-key-secret-for-jwt-signing-32chars!');

const {ApiKeyService} = await import('../apikeys/apikey.service');
const {AuthzService} = await import('../authz/authz.service');
const {Action} = await import('../casl/casl-ability.factory');
const {EvaluationTagsService} = await import('../evaluation-tags/evaluation-tags.service');
const {EvaluationsService} = await import('../evaluations/evaluations.service');
const {GroupsService} = await import('../groups/groups.service');
const {UsersService} = await import('../users/users.service');
const {test} = await import('../db/test-fixture');
const {StatisticsController} = await import('./statistics.controller');
const {StatisticsService} = await import('./statistics.service');

function buildController(db: TestDb) {
  const apiKeyService = new ApiKeyService(db);
  const evaluationsService = new EvaluationsService(db);
  const evaluationTagsService = new EvaluationTagsService(db);
  const groupsService = new GroupsService(db);
  const usersService = new UsersService(db, groupsService);
  const statisticsService = new StatisticsService(
    apiKeyService,
    evaluationsService,
    evaluationTagsService,
    groupsService,
    usersService,
  );
  const controller = new StatisticsController(
    statisticsService,
    new AuthzService(),
  );

  return {controller, statisticsService};
}

async function createAdminRequest(db: TestDb) {
  const admin = await legacyUserFactory.create(db, {
    email: `statistics-admin-${Date.now()}@controller.test`,
    role: 'admin',
  });
  return {user: {id: admin.id, role: admin.role}};
}

describe('StatisticsController', () => {
  test('admin statistics access has an explicit ViewStatistics grant', () => {
    const ability = new AuthzService().abac.createForUser({
      id: 'admin-id',
      role: 'admin',
    });
    const ruleSummaries = ability.rules.map((rule) => ({
      action: rule.action,
      subject: rule.subject,
    }));

    expect(ruleSummaries).toContainEqual({
      action: Action.ViewStatistics,
      subject: 'all',
    });
  });

  test('admin can retrieve statistics as a StatisticsDTO with all count fields', async ({db}) => {
    const {controller} = buildController(db);
    const result = await controller.getHeimdallStatistics(
      await createAdminRequest(db),
    );

    expect(result).toBeInstanceOf(StatisticsDTO);
    expect(Object.keys(result).sort()).toEqual([
      'apiKeyCount',
      'evaluationCount',
      'evaluationTagCount',
      'groupCount',
      'userCount',
    ]);
    expect(result.apiKeyCount).toBeTypeOf('number');
    expect(result.evaluationCount).toBeTypeOf('number');
    expect(result.evaluationTagCount).toBeTypeOf('number');
    expect(result.groupCount).toBeTypeOf('number');
    expect(result.userCount).toBeTypeOf('number');
  });

  test('admin gets correct count deltas for one inserted row in each counted table', async ({db}) => {
    const {controller, statisticsService} = buildController(db);
    const adminRequest = await createAdminRequest(db);
    const before = await statisticsService.getHeimdallStatistics();
    const owner = await legacyUserFactory.create(db, {
      email: `statistics-owner-${Date.now()}@controller.test`,
    });
    await groupFactory.create(db);
    await evaluationFactory.create(db, {userId: owner.id, tags: ['stig']});
    await apiKeyFactory.create(db, {userId: owner.id});

    const result = await controller.getHeimdallStatistics(adminRequest);

    expect(result).toEqual(new StatisticsDTO({
      apiKeyCount: before.apiKeyCount + 1,
      userCount: before.userCount + 1,
      evaluationCount: before.evaluationCount + 1,
      evaluationTagCount: before.evaluationTagCount + 1,
      groupCount: before.groupCount + 1,
    }));
  });

  test('non-admin user is denied statistics access', async ({db}) => {
    const user = await legacyUserFactory.create(db, {
      email: `statistics-user-${Date.now()}@controller.test`,
      role: 'user',
    });
    const {controller} = buildController(db);

    await expect(
      controller.getHeimdallStatistics({user: {id: user.id, role: user.role}}),
    ).rejects.toThrow(ForbiddenError);
  });

  test('anonymous request with no role is denied statistics access', async ({db}) => {
    const {controller} = buildController(db);

    await expect(
      controller.getHeimdallStatistics({
        user: {id: 'anonymous', role: undefined as unknown as string},
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  test('counts are accurate after inserting multiple users, groups, evaluations, api keys, and tags', async ({db}) => {
    const {controller, statisticsService} = buildController(db);
    const adminRequest = await createAdminRequest(db);
    const before = await statisticsService.getHeimdallStatistics();
    const firstUser = await legacyUserFactory.create(db, {
      email: `statistics-first-${Date.now()}@controller.test`,
    });
    const secondUser = await legacyUserFactory.create(db, {
      email: `statistics-second-${Date.now()}@controller.test`,
    });
    await groupFactory.create(db);
    await groupFactory.create(db);
    await evaluationFactory.create(db, {
      userId: firstUser.id,
      tags: ['alpha', 'beta'],
    });
    await evaluationFactory.create(db, {
      userId: secondUser.id,
      tags: ['gamma'],
    });
    await apiKeyFactory.create(db, {userId: firstUser.id});
    await apiKeyFactory.create(db, {userId: secondUser.id});

    const result = await controller.getHeimdallStatistics(adminRequest);

    expect(result).toEqual(new StatisticsDTO({
      apiKeyCount: before.apiKeyCount + 2,
      userCount: before.userCount + 2,
      evaluationCount: before.evaluationCount + 2,
      evaluationTagCount: before.evaluationTagCount + 3,
      groupCount: before.groupCount + 2,
    }));
  });
});
