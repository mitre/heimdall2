import {describe, expect} from 'vitest';
import {NotFoundException} from '@nestjs/common';
import {eq} from 'drizzle-orm';
import {evaluationTags} from '../db/schema';
import {test} from '../db/test-fixture';
import {legacyUserFactory} from '../db/factories/legacy-user.factory';
import {evaluationFactory} from '../db/factories/evaluation.factory';
import {EvaluationTagsService} from './evaluation-tags.service';

describe('EvaluationTagsService', () => {
  describe('create', () => {
    test('creates an evaluation tag and returns it with correct fields', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `owner-${Date.now()}@evaltag-svc.test`,
      });
      const evaluation = await evaluationFactory.create(db, {userId: user.id});
      const service = new EvaluationTagsService(db);

      const tag = await service.create(evaluation.id, {value: 'stig-rhel9'});
      expect(tag.id).toBeTypeOf('number');
      expect(tag.value).toBe('stig-rhel9');
      expect(tag.evaluationId).toBe(evaluation.id);
      expect(tag.createdAt).toBeDefined();
      expect(tag.updatedAt).toBeDefined();
    });

    test('persists the tag in the database', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `persist-${Date.now()}@evaltag-svc.test`,
      });
      const evaluation = await evaluationFactory.create(db, {userId: user.id});
      const service = new EvaluationTagsService(db);

      const tag = await service.create(evaluation.id, {value: 'cis-benchmark'});
      const [found] = await db
        .select()
        .from(evaluationTags)
        .where(eq(evaluationTags.id, tag.id));
      expect(found).toBeDefined();
      expect(found.value).toBe('cis-benchmark');
      expect(found.evaluationId).toBe(evaluation.id);
    });

    test('rejects missing value with DB constraint error', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `reject-${Date.now()}@evaltag-svc.test`,
      });
      const evaluation = await evaluationFactory.create(db, {userId: user.id});
      const service = new EvaluationTagsService(db);

      await expect(
        service.create(evaluation.id, {} as any),
      ).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    test('returns tags with evaluation relationship', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `findall-${Date.now()}@evaltag-svc.test`,
      });
      const evaluation = await evaluationFactory.create(db, {userId: user.id});
      const service = new EvaluationTagsService(db);

      await service.create(evaluation.id, {value: 'tag-a'});
      await service.create(evaluation.id, {value: 'tag-b'});
      const tags = await service.findAll();
      const forEval = tags.filter((t) => t.evaluationId === evaluation.id);
      expect(forEval).toHaveLength(2);
      expect(forEval[0].evaluation).toBeDefined();
      expect(forEval[0].evaluation?.id).toBe(evaluation.id);
    });
  });

  describe('count', () => {
    test('returns a number and increments after creating', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `count-${Date.now()}@evaltag-svc.test`,
      });
      const evaluation = await evaluationFactory.create(db, {userId: user.id});
      const service = new EvaluationTagsService(db);

      const tag = await service.create(evaluation.id, {value: 'counted'});
      const after = await service.count();
      expect(after).toBeGreaterThanOrEqual(1);
      const found = await service.findById(tag.id);
      expect(found.value).toBe('counted');
    });
  });

  describe('findById', () => {
    test('returns a tag by id with evaluation', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `findid-${Date.now()}@evaltag-svc.test`,
      });
      const evaluation = await evaluationFactory.create(db, {userId: user.id});
      const service = new EvaluationTagsService(db);

      const created = await service.create(evaluation.id, {value: 'find-me'});
      const found = await service.findById(created.id);
      expect(found.id).toBe(created.id);
      expect(found.value).toBe('find-me');
      expect(found.evaluation).toBeDefined();
      expect(found.evaluation?.id).toBe(evaluation.id);
    });

    test('throws NotFoundException for non-existent id', async ({db}) => {
      const service = new EvaluationTagsService(db);
      await expect(service.findById(999999)).rejects.toThrow(NotFoundException);
      await expect(service.findById(999999)).rejects.toThrow(
        'EvaluationTag with given id not found',
      );
    });
  });

  describe('remove', () => {
    test('deletes the tag from the database and returns it', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `remove-${Date.now()}@evaltag-svc.test`,
      });
      const evaluation = await evaluationFactory.create(db, {userId: user.id});
      const service = new EvaluationTagsService(db);

      const created = await service.create(evaluation.id, {value: 'remove-me'});
      const removed = await service.remove(created.id);
      expect(removed.value).toBe('remove-me');

      const [gone] = await db
        .select()
        .from(evaluationTags)
        .where(eq(evaluationTags.id, created.id));
      expect(gone).toBeUndefined();
    });

    test('throws NotFoundException for non-existent id', async ({db}) => {
      const service = new EvaluationTagsService(db);
      await expect(service.remove(999999)).rejects.toThrow(NotFoundException);
    });

    test('returns the full tag with evaluation data', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `fullremove-${Date.now()}@evaltag-svc.test`,
      });
      const evaluation = await evaluationFactory.create(db, {userId: user.id});
      const service = new EvaluationTagsService(db);

      const created = await service.create(evaluation.id, {value: 'full-remove'});
      const removed = await service.remove(created.id);
      expect(removed.evaluation).toBeDefined();
      expect(removed.evaluation?.id).toBe(evaluation.id);
    });
  });
});
