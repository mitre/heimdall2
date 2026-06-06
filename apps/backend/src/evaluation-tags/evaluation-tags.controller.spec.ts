import {ForbiddenError, subject} from '@casl/ability';
import {Test} from '@nestjs/testing';
import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
import {drizzle} from 'drizzle-orm/node-postgres';
import {sql, eq} from 'drizzle-orm';
import {DRIZZLE} from '../db/drizzle.module';
import {createTestPool} from '../db/test-utils';
import {legacyUserFactory} from '../db/factories/legacy-user.factory';
import {evaluationFactory} from '../db/factories/evaluation.factory';
import {groupFactory} from '../db/factories/group.factory';
import {groupMemberFactory} from '../db/factories/group-member.factory';
import {groupEvaluations} from '../db/schema';
import * as schema from '../db/schema';
import * as relations from '../db/relations';
import {AuthzService} from '../authz/authz.service';
import {type AuthUser} from '../casl/casl-ability.factory';
import {ConfigService} from '../config/config.service';
import {EvaluationsService} from '../evaluations/evaluations.service';
import {EvaluationTagsController} from './evaluation-tags.controller';
import {EvaluationTagsService} from './evaluation-tags.service';

type TestDb = ReturnType<typeof drizzle<typeof schema & typeof relations>>;

let pool: ReturnType<typeof createTestPool>;
let db: TestDb;
let controller: EvaluationTagsController;
let tagService: EvaluationTagsService;
let evaluationsServiceMock: {findById: ReturnType<typeof vi.fn>};

function authUser(user: {id: number; role: string}): AuthUser {
  return {id: String(user.id), role: user.role};
}

beforeAll(async () => {
  pool = createTestPool();
  db = drizzle(pool, {schema: {...schema, ...relations}});

  evaluationsServiceMock = {
    findById: vi.fn(),
  };

  const module = await Test.createTestingModule({
    controllers: [EvaluationTagsController],
    providers: [
      EvaluationTagsService,
      AuthzService,
      {provide: EvaluationsService, useValue: evaluationsServiceMock},
      {provide: ConfigService, useValue: {get: () => 'test'}},
      {provide: DRIZZLE, useValue: db},
    ],
  }).compile();

  controller = module.get(EvaluationTagsController);
  tagService = module.get(EvaluationTagsService);
});

afterAll(async () => {
  await db.execute(
    sql`DELETE FROM "EvaluationTags" WHERE "evaluationId" IN (SELECT id FROM "Evaluations" WHERE filename LIKE 'test-eval-%')`
  );
  await db.execute(
    sql`DELETE FROM "GroupEvaluations" WHERE "groupId" IN (SELECT id FROM "Groups" WHERE name LIKE 'Test Group %')`
  );
  await db.execute(
    sql`DELETE FROM "GroupUsers" WHERE "groupId" IN (SELECT id FROM "Groups" WHERE name LIKE 'Test Group %')`
  );
  await db.execute(
    sql`DELETE FROM "Evaluations" WHERE filename LIKE 'test-eval-%'`
  );
  await db.execute(
    sql`DELETE FROM "Groups" WHERE name LIKE 'Test Group %'`
  );
  await db.execute(
    sql`DELETE FROM "Users" WHERE email LIKE '%@evaltag-ctrl.test'`
  );
  await pool.end();
});

let user: {id: number; role: string; email: string};

beforeEach(async () => {
  await db.execute(
    sql`DELETE FROM "EvaluationTags" WHERE "evaluationId" IN (SELECT id FROM "Evaluations" WHERE filename LIKE 'test-eval-%')`
  );
  await db.execute(
    sql`DELETE FROM "GroupEvaluations" WHERE "groupId" IN (SELECT id FROM "Groups" WHERE name LIKE 'Test Group %')`
  );
  await db.execute(
    sql`DELETE FROM "GroupUsers" WHERE "groupId" IN (SELECT id FROM "Groups" WHERE name LIKE 'Test Group %')`
  );
  await db.execute(
    sql`DELETE FROM "Evaluations" WHERE filename LIKE 'test-eval-%'`
  );
  await db.execute(
    sql`DELETE FROM "Groups" WHERE name LIKE 'Test Group %'`
  );
  await db.execute(
    sql`DELETE FROM "Users" WHERE email LIKE '%@evaltag-ctrl.test'`
  );

  const created = await legacyUserFactory.create(db, {
    email: `user-${Date.now()}@evaltag-ctrl.test`,
  });
  user = {id: created.id, role: created.role, email: created.email};
  evaluationsServiceMock.findById.mockReset();
});

describe('EvaluationTagsController', () => {
  describe('index', () => {
    it('should return EvaluationTags a User has ownership of', async () => {
      const evaluation = await evaluationFactory.create(db, {
        userId: user.id,
      });
      await tagService.create(evaluation.id, {value: 'owned-tag'});

      const result = await controller.index({user: authUser(user)});
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('owned-tag');
    });

    it('should return EvaluationTags a User has group ownership of', async () => {
      const otherUser = await legacyUserFactory.create(db, {
        email: `other-${Date.now()}@evaltag-ctrl.test`,
      });
      const evaluation = await evaluationFactory.create(db, {
        userId: otherUser.id,
      });
      const group = await groupFactory.create(db);
      await groupMemberFactory.create(db, {
        userId: user.id,
        groupId: group.id,
        role: 'owner',
      });
      const now = new Date().toISOString();
      await db.insert(groupEvaluations).values({
        groupId: group.id,
        evaluationId: evaluation.id,
        createdAt: now,
        updatedAt: now,
      });
      await tagService.create(evaluation.id, {value: 'group-tag'});

      const result = await controller.index({user: authUser(user)});
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('group-tag');
    });

    it('should return EvaluationTags on public Evaluations', async () => {
      const otherUser = await legacyUserFactory.create(db, {
        email: `other-${Date.now()}@evaltag-ctrl.test`,
      });
      const evaluation = await evaluationFactory.create(db, {
        userId: otherUser.id,
        public: true,
      });
      await tagService.create(evaluation.id, {value: 'public-tag'});

      const result = await controller.index({user: authUser(user)});
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('public-tag');
    });

    it('should return all EvaluationTags for admin users', async () => {
      const otherUser = await legacyUserFactory.create(db, {
        email: `other-${Date.now()}@evaltag-ctrl.test`,
      });
      const evaluation = await evaluationFactory.create(db, {
        userId: otherUser.id,
      });
      await tagService.create(evaluation.id, {value: 'admin-visible'});

      const admin = {id: user.id, role: 'admin'};
      const result = await controller.index({user: authUser(admin)});
      expect(result.length).toBeGreaterThanOrEqual(1);
      const found = result.find((t) => t.value === 'admin-visible');
      expect(found).toBeDefined();
    });

    it('should not return EvaluationTags associated with an Evaluation a User is not authorized to view', async () => {
      const otherUser = await legacyUserFactory.create(db, {
        email: `other-${Date.now()}@evaltag-ctrl.test`,
      });
      const evaluation = await evaluationFactory.create(db, {
        userId: otherUser.id,
      });
      await tagService.create(evaluation.id, {value: 'private-tag'});

      const result = await controller.index({user: authUser(user)});
      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return an EvaluationTag a User has ownership of', async () => {
      const evaluation = await evaluationFactory.create(db, {
        userId: user.id,
      });
      const tag = await tagService.create(evaluation.id, {value: 'find-owned'});

      const result = await controller.findById(String(tag.id), {
        user: authUser(user),
      });
      expect(result.value).toBe('find-owned');
    });

    it('should return an EvaluationTag a User has group ownership of', async () => {
      const otherUser = await legacyUserFactory.create(db, {
        email: `other-${Date.now()}@evaltag-ctrl.test`,
      });
      const evaluation = await evaluationFactory.create(db, {
        userId: otherUser.id,
      });
      const group = await groupFactory.create(db);
      await groupMemberFactory.create(db, {
        userId: user.id,
        groupId: group.id,
        role: 'owner',
      });
      const now = new Date().toISOString();
      await db.insert(groupEvaluations).values({
        groupId: group.id,
        evaluationId: evaluation.id,
        createdAt: now,
        updatedAt: now,
      });
      const tag = await tagService.create(evaluation.id, {value: 'find-group'});

      const result = await controller.findById(String(tag.id), {
        user: authUser(user),
      });
      expect(result.value).toBe('find-group');
    });

    it('should not return an EvaluationTag associated with an Evaluation a User is not authorized to view', async () => {
      expect.assertions(1);
      const otherUser = await legacyUserFactory.create(db, {
        email: `other-${Date.now()}@evaltag-ctrl.test`,
      });
      const evaluation = await evaluationFactory.create(db, {
        userId: otherUser.id,
      });
      const tag = await tagService.create(evaluation.id, {
        value: 'forbidden-find',
      });

      await expect(
        controller.findById(String(tag.id), {user: authUser(user)})
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('create', () => {
    it('should create EvaluationTags on an Evaluation a User has ownership of', async () => {
      const evaluation = await evaluationFactory.create(db, {
        userId: user.id,
      });
      evaluationsServiceMock.findById.mockResolvedValue(
        subject('Evaluation', {
          id: String(evaluation.id),
          userId: String(user.id),
          public: false,
          groupEvaluations: [],
        })
      );

      const result = await controller.create(
        String(evaluation.id),
        {value: 'new-tag'},
        {user: authUser(user)}
      );
      expect(result).toBeDefined();
      expect(result.value).toBe('new-tag');
    });

    it('should create EvaluationTags on an Evaluation a User has Group ownership of', async () => {
      const otherUser = await legacyUserFactory.create(db, {
        email: `other-${Date.now()}@evaltag-ctrl.test`,
      });
      const evaluation = await evaluationFactory.create(db, {
        userId: otherUser.id,
      });
      evaluationsServiceMock.findById.mockResolvedValue(
        subject('Evaluation', {
          id: String(evaluation.id),
          userId: String(otherUser.id),
          public: false,
          groupEvaluations: [
            {
              group: {
                id: '1',
                groupUsers: [
                  {user: {id: String(user.id)}, role: 'owner'},
                ],
              },
            },
          ],
        })
      );

      const result = await controller.create(
        String(evaluation.id),
        {value: 'group-create'},
        {user: authUser(user)}
      );
      expect(result).toBeDefined();
      expect(result.value).toBe('group-create');
    });

    it('should throw ForbiddenError when adding EvaluationTags to an Evaluation a User is not authorized to manage', async () => {
      expect.assertions(1);
      const otherUser = await legacyUserFactory.create(db, {
        email: `other-${Date.now()}@evaltag-ctrl.test`,
      });
      const evaluation = await evaluationFactory.create(db, {
        userId: otherUser.id,
      });
      evaluationsServiceMock.findById.mockResolvedValue(
        subject('Evaluation', {
          id: String(evaluation.id),
          userId: String(otherUser.id),
          public: false,
          groupEvaluations: [],
        })
      );

      await expect(
        controller.create(
          String(evaluation.id),
          {value: 'forbidden-create'},
          {user: authUser(user)}
        )
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('remove', () => {
    it('should remove EvaluationTags from Evaluations a User has ownership of', async () => {
      const evaluation = await evaluationFactory.create(db, {
        userId: user.id,
      });
      const tag = await tagService.create(evaluation.id, {value: 'remove-owned'});

      const result = await controller.remove(String(tag.id), {
        user: authUser(user),
      });
      expect(result.value).toBe('remove-owned');
    });

    it('should remove EvaluationTags on an Evaluation a User has Group ownership of', async () => {
      const otherUser = await legacyUserFactory.create(db, {
        email: `other-${Date.now()}@evaltag-ctrl.test`,
      });
      const evaluation = await evaluationFactory.create(db, {
        userId: otherUser.id,
      });
      const group = await groupFactory.create(db);
      await groupMemberFactory.create(db, {
        userId: user.id,
        groupId: group.id,
        role: 'owner',
      });
      const now = new Date().toISOString();
      await db.insert(groupEvaluations).values({
        groupId: group.id,
        evaluationId: evaluation.id,
        createdAt: now,
        updatedAt: now,
      });
      const tag = await tagService.create(evaluation.id, {
        value: 'remove-group',
      });

      const result = await controller.remove(String(tag.id), {
        user: authUser(user),
      });
      expect(result.value).toBe('remove-group');
    });

    it('should throw ForbiddenError when removing EvaluationTags from an Evaluation a User is not authorized to manage', async () => {
      expect.assertions(1);
      const otherUser = await legacyUserFactory.create(db, {
        email: `other-${Date.now()}@evaltag-ctrl.test`,
      });
      const evaluation = await evaluationFactory.create(db, {
        userId: otherUser.id,
      });
      const tag = await tagService.create(evaluation.id, {
        value: 'forbidden-remove',
      });

      await expect(
        controller.remove(String(tag.id), {user: authUser(user)})
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });
});
