import {describe, expect} from 'vitest';
import {NotFoundException} from '@nestjs/common';
import {eq} from 'drizzle-orm';
import {test} from '../db/test-fixture';
import {legacyUserFactory} from '../db/factories/legacy-user.factory';
import {evaluationFactory} from '../db/factories/evaluation.factory';
import {groupFactory} from '../db/factories/group.factory';
import {groupMemberFactory} from '../db/factories/group-member.factory';
import {evaluations, evaluationTags, groupEvaluations} from '../db/schema';
import {EvaluationsService} from './evaluations.service';

describe('EvaluationsService (Drizzle)', () => {
  describe('create', () => {
    test('creates an evaluation via Drizzle and returns typed result', async ({db}) => {
      const service = new EvaluationsService(db);
      const user = await legacyUserFactory.create(db, {
        email: `creator-${Date.now()}@eval-svc.test`,
      });
      const evaluation = await service.create({
        filename: 'test-scan.json',
        public: false,
        data: {version: '1.0'},
        userId: user.id,
        evaluationTags: [{value: 'rhel9'}],
      });
      expect(evaluation.id).toBeTypeOf('number');
      expect(evaluation.filename).toBe('test-scan.json');
      expect(evaluation.public).toBe(false);
      expect(evaluation.userId).toBe(user.id);
    });

    test('creates evaluation tags inline', async ({db}) => {
      const service = new EvaluationsService(db);
      const evaluation = await service.create({
        filename: 'tagged.json',
        public: true,
        data: {},
        evaluationTags: [{value: 'stig'}, {value: 'cis'}],
      });

      const tags = await db
        .select()
        .from(evaluationTags)
        .where(eq(evaluationTags.evaluationId, evaluation.id));
      expect(tags).toHaveLength(2);
      expect(tags.map((t) => t.value).sort()).toEqual(['cis', 'stig']);
    });
  });

  describe('count', () => {
    test('includes newly created evaluation in count', async ({db}) => {
      const service = new EvaluationsService(db);
      const created = await service.create({filename: 'count-verify.json', public: false, data: {}});
      const total = await service.count();
      expect(total).toBeGreaterThanOrEqual(1);
      const found = await service.findById(String(created.id));
      expect(found.filename).toBe('count-verify.json');
    });
  });

  describe('findById', () => {
    test('returns evaluation with tags and user', async ({db}) => {
      const service = new EvaluationsService(db);
      const user = await legacyUserFactory.create(db, {
        email: `findby-${Date.now()}@eval-svc.test`,
      });
      const created = await service.create({
        filename: 'find-me.json',
        public: false,
        data: {test: true},
        userId: user.id,
        evaluationTags: [{value: 'findtag'}],
      });

      const found = await service.findById(String(created.id));
      expect(found.id).toBe(created.id);
      expect(found.filename).toBe('find-me.json');
      expect(found.evaluationTags).toBeDefined();
      expect(found.evaluationTags.length).toBeGreaterThanOrEqual(1);
      expect(found.user).toBeDefined();
      expect(found.user?.email).toBe(user.email);
    });

    test('throws NotFoundException for non-existent id', async ({db}) => {
      const service = new EvaluationsService(db);
      await expect(service.findById('999999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    test('returns evaluations without data field', async ({db}) => {
      const service = new EvaluationsService(db);
      await service.create({
        filename: 'findall.json',
        public: true,
        data: {large: 'payload'},
        evaluationTags: [{value: 'all-tag'}],
      });

      const all = await service.findAll();
      const found = all.find((e) => e.filename === 'findall.json');
      expect(found).toBeDefined();
      expect(found!.data).toBeUndefined();
      expect(found!.evaluationTags).toBeDefined();
    });
  });

  describe('update', () => {
    test('updates filename and public flag', async ({db}) => {
      const service = new EvaluationsService(db);
      const created = await service.create({
        filename: 'old-name.json',
        public: false,
        data: {},
      });

      const updated = await service.update(String(created.id), {
        filename: 'new-name.json',
        public: true,
      });
      expect(updated.filename).toBe('new-name.json');
      expect(updated.public).toBe(true);
    });

    test('throws NotFoundException for non-existent id', async ({db}) => {
      const service = new EvaluationsService(db);
      await expect(
        service.update('999999', {filename: 'x.json'}),
      ).rejects.toThrow(NotFoundException);
    });

    test('returns full relational shape with tags after update', async ({db}) => {
      const service = new EvaluationsService(db);
      const created = await service.create({
        filename: 'relational.json',
        public: false,
        data: {},
        evaluationTags: [{value: 'pre-update'}],
      });

      const updated = await service.update(String(created.id), {
        filename: 'relational-updated.json',
      });
      expect(updated.filename).toBe('relational-updated.json');
      expect(updated.evaluationTags).toBeDefined();
      expect(updated.evaluationTags.length).toBe(1);
      expect(updated.evaluationTags[0].value).toBe('pre-update');
    });
  });

  describe('remove', () => {
    test('deletes evaluation and its tags', async ({db}) => {
      const service = new EvaluationsService(db);
      const created = await service.create({
        filename: 'delete-me.json',
        public: false,
        data: {},
        evaluationTags: [{value: 'doomed'}],
      });

      const removed = await service.remove(String(created.id));
      expect(removed.filename).toBe('delete-me.json');

      const remaining = await db
        .select()
        .from(evaluations)
        .where(eq(evaluations.id, created.id));
      expect(remaining).toHaveLength(0);

      const remainingTags = await db
        .select()
        .from(evaluationTags)
        .where(eq(evaluationTags.evaluationId, created.id));
      expect(remainingTags).toHaveLength(0);
    });

    test('throws NotFoundException for non-existent id', async ({db}) => {
      const service = new EvaluationsService(db);
      await expect(service.remove('999999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('groups', () => {
    test('returns groups associated with an evaluation', async ({db}) => {
      const service = new EvaluationsService(db);
      const created = await service.create({
        filename: 'grouped.json',
        public: false,
        data: {},
      });

      const result = await service.groups(String(created.id));
      expect(result).toEqual([]);
    });
  });

  describe('escapeForLike', () => {
    test('escapes backslashes, percent signs, and underscores', async () => {
      expect(EvaluationsService.escapeForLike('100%_done\\path')).toBe(
        '100\\%\\_done\\\\path',
      );
    });
  });

  describe('evaluationCount', () => {
    test('admin gets total count', async ({db}) => {
      const service = new EvaluationsService(db);
      await service.create({filename: 'admin-count.json', public: false, data: {}});
      const c = await service.evaluationCount('1', 'admin');
      expect(c).toBeGreaterThanOrEqual(1);
    });

    test('user gets count of public + own evaluations', async ({db}) => {
      const service = new EvaluationsService(db);
      const user = await legacyUserFactory.create(db, {
        email: `counter-${Date.now()}@eval-svc.test`,
      });
      await service.create({filename: 'private.json', public: false, data: {}, userId: user.id});
      await service.create({filename: 'public.json', public: true, data: {}});

      const c = await service.evaluationCount(String(user.id), 'user');
      expect(c).toBeGreaterThanOrEqual(2);
    });
  });

  describe('findPaginated', () => {
    async function seedEvaluations(db: Parameters<typeof test>[1] extends (ctx: infer C) => unknown ? C extends {db: infer D} ? D : never : never, count: number, userId?: number) {
      const evals = [];
      for (let i = 0; i < count; i++) {
        evals.push(
          await db.insert(evaluations).values({
            filename: `eval-${String(i).padStart(3, '0')}.json`,
            public: true,
            data: {},
            userId: userId ?? null,
            createdAt: new Date(Date.now() - (count - i) * 60000).toISOString(),
            updatedAt: new Date(Date.now() - (count - i) * 60000).toISOString(),
          }).returning().then(([r]) => r),
        );
      }
      return evals;
    }

    test('returns correct page with SQL LIMIT/OFFSET', async ({db}) => {
      const service = new EvaluationsService(db);
      const seeded = await seedEvaluations(db, 5);

      const result = await service.findPaginated({
        page: 1, perPage: 2, sort: 'createdAt', order: 'desc',
        userId: '1', role: 'admin',
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(5);
      expect(result.meta.page).toBe(1);
      expect(result.meta.perPage).toBe(2);
      expect(result.meta.totalPages).toBe(3);
    });

    test('returns second page correctly', async ({db}) => {
      const service = new EvaluationsService(db);
      await seedEvaluations(db, 5);

      const page1 = await service.findPaginated({
        page: 1, perPage: 2, sort: 'createdAt', order: 'desc',
        userId: '1', role: 'admin',
      });
      const page2 = await service.findPaginated({
        page: 2, perPage: 2, sort: 'createdAt', order: 'desc',
        userId: '1', role: 'admin',
      });

      expect(page2.data).toHaveLength(2);
      const page1Ids = page1.data.map((e) => e.id);
      const page2Ids = page2.data.map((e) => e.id);
      expect(page1Ids.filter((id) => page2Ids.includes(id))).toHaveLength(0);
    });

    test('sorts by filename ascending', async ({db}) => {
      const service = new EvaluationsService(db);
      await seedEvaluations(db, 5);

      const result = await service.findPaginated({
        page: 1, perPage: 10, sort: 'filename', order: 'asc',
        userId: '1', role: 'admin',
      });

      const filenames = result.data.map((e) => e.filename);
      expect(filenames).toEqual([...filenames].sort());
    });

    test('sorts by createdAt descending by default', async ({db}) => {
      const service = new EvaluationsService(db);
      await seedEvaluations(db, 3);

      const result = await service.findPaginated({
        page: 1, perPage: 10, sort: 'createdAt', order: 'desc',
        userId: '1', role: 'admin',
      });

      const dates = result.data.map((e) => e.createdAt);
      expect(dates).toEqual([...dates].sort().reverse());
    });

    test('filters by filename search via SQL ILIKE', async ({db}) => {
      const service = new EvaluationsService(db);
      await service.create({filename: 'rhel9-stig.json', public: true, data: {}});
      await service.create({filename: 'windows-cis.json', public: true, data: {}});
      await service.create({filename: 'rhel8-stig.json', public: true, data: {}});

      const result = await service.findPaginated({
        page: 1, perPage: 10, sort: 'filename', order: 'asc',
        q: 'rhel', userId: '1', role: 'admin',
      });

      expect(result.data).toHaveLength(2);
      expect(result.data.map((e) => e.filename).sort()).toEqual(['rhel8-stig.json', 'rhel9-stig.json']);
      expect(result.meta.total).toBe(2);
    });

    test('search matches tag values via SQL ILIKE', async ({db}) => {
      const service = new EvaluationsService(db);
      const evalWithTag = await service.create({
        filename: 'tagged.json', public: true, data: {},
        evaluationTags: [{value: 'compliance-check'}],
      });
      await service.create({filename: 'untagged.json', public: true, data: {}});

      const result = await service.findPaginated({
        page: 1, perPage: 10, sort: 'filename', order: 'asc',
        q: 'compliance', userId: '1', role: 'admin',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].filename).toBe('tagged.json');
    });

    test('search matches group name via SQL ILIKE', async ({db}) => {
      const service = new EvaluationsService(db);
      const group = await groupFactory.create(db, {name: 'Production Servers'});
      const eval1 = await service.create({filename: 'in-group.json', public: true, data: {}});
      await service.create({filename: 'not-in-group.json', public: true, data: {}});
      const now = new Date().toISOString();
      await db.insert(groupEvaluations).values({
        groupId: group.id, evaluationId: eval1.id, createdAt: now, updatedAt: now,
      });

      const result = await service.findPaginated({
        page: 1, perPage: 10, sort: 'filename', order: 'asc',
        q: 'production', userId: '1', role: 'admin',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].filename).toBe('in-group.json');
    });

    test('non-admin sees only public + owned + group-member evaluations', async ({db}) => {
      const service = new EvaluationsService(db);
      const user = await legacyUserFactory.create(db, {email: 'vis@test.com'});
      const otherUser = await legacyUserFactory.create(db, {email: 'other@test.com'});

      await service.create({filename: 'my-private.json', public: false, data: {}, userId: user.id});
      await service.create({filename: 'public.json', public: true, data: {}});
      await service.create({filename: 'other-private.json', public: false, data: {}, userId: otherUser.id});

      const group = await groupFactory.create(db, {name: 'My Group'});
      await groupMemberFactory.create(db, {userId: user.id, groupId: group.id});
      const groupEval = await service.create({filename: 'group-shared.json', public: false, data: {}});
      const now = new Date().toISOString();
      await db.insert(groupEvaluations).values({
        groupId: group.id, evaluationId: groupEval.id, createdAt: now, updatedAt: now,
      });

      const result = await service.findPaginated({
        page: 1, perPage: 100, sort: 'filename', order: 'asc',
        userId: String(user.id), role: 'user',
      });

      const filenames = result.data.map((e) => e.filename).sort();
      expect(filenames).toEqual(['group-shared.json', 'my-private.json', 'public.json']);
      expect(filenames).not.toContain('other-private.json');
    });

    test('admin sees all evaluations regardless of ownership', async ({db}) => {
      const service = new EvaluationsService(db);
      const user = await legacyUserFactory.create(db, {email: 'admin@test.com'});
      await service.create({filename: 'private-a.json', public: false, data: {}, userId: user.id});
      await service.create({filename: 'private-b.json', public: false, data: {}});
      await service.create({filename: 'public-c.json', public: true, data: {}});

      const result = await service.findPaginated({
        page: 1, perPage: 100, sort: 'filename', order: 'asc',
        userId: String(user.id), role: 'admin',
      });

      expect(result.data.map((e) => e.filename)).toEqual(
        expect.arrayContaining(['private-a.json', 'private-b.json', 'public-c.json']),
      );
    });

    test('returns empty result for page beyond total', async ({db}) => {
      const service = new EvaluationsService(db);
      await seedEvaluations(db, 3);

      const result = await service.findPaginated({
        page: 99, perPage: 10, sort: 'createdAt', order: 'desc',
        userId: '1', role: 'admin',
      });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(3);
      expect(result.meta.totalPages).toBe(1);
    });

    test('includes evaluation tags and user in results', async ({db}) => {
      const service = new EvaluationsService(db);
      const user = await legacyUserFactory.create(db, {email: 'relational@test.com'});
      await service.create({
        filename: 'with-relations.json', public: true, data: {},
        userId: user.id, evaluationTags: [{value: 'stig'}],
      });

      const result = await service.findPaginated({
        page: 1, perPage: 10, sort: 'filename', order: 'asc',
        userId: '1', role: 'admin',
      });

      const found = result.data.find((e) => e.filename === 'with-relations.json');
      expect(found).toBeDefined();
      expect(found!.evaluationTags).toBeDefined();
      expect(found!.evaluationTags.length).toBeGreaterThanOrEqual(1);
      expect(found!.evaluationTags[0].value).toBe('stig');
      expect(found!.user).toBeDefined();
      expect(found!.user!.email).toBe('relational@test.com');
    });
  });
});
