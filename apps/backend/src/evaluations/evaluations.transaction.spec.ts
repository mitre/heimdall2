import { setImmediate } from 'node:timers/promises';
import { expect, it, vi } from 'vitest';
import type { DatabaseService } from '../database/database.service';
import type { Evaluation } from './evaluation.model';
import { EvaluationsService } from './evaluations.service';

it('waits for tag deletion before deleting the evaluation and committing', async () => {
  let release!: () => void;
  // eslint-disable-next-line unicorn/prefer-promise-with-resolvers
  const pendingTag = new Promise<void>((resolve) => {
    release = resolve;
  });
  const events: string[] = [];
  const transaction = {};
  const tag = {
    destroy: vi.fn(async () => {
      await pendingTag;
      events.push('tag');
    }),
  };
  const evaluation = {
    destroy: vi.fn(() => {
      events.push('evaluation');
    }),
    evaluationTags: [tag],
  };
  const database = {
    sequelize: {
      transaction: async (callback: (value: object) => Promise<unknown>) => {
        await callback(transaction);
        events.push('commit');
      },
    },
  };
  const model = { findByPk: () => evaluation };
  const service = new EvaluationsService(
    model as unknown as typeof Evaluation,
    database as unknown as DatabaseService,
  );
  const removal = service.remove('1');
  let pendingEvents: string[];
  try {
    await setImmediate();
    pendingEvents = [...events];
  } finally {
    release();
    await removal;
  }
  expect(pendingEvents).toEqual([]);
  expect(events).toEqual(['tag', 'evaluation', 'commit']);
  expect(tag.destroy).toHaveBeenCalledWith({ transaction });
  expect(evaluation.destroy).toHaveBeenCalledWith({ transaction });
});

it('does not delete the evaluation or commit when tag deletion rejects', async () => {
  const failure = new Error('tag deletion failed');
  const evaluation = {
    destroy: vi.fn(),
    evaluationTags: [{ destroy: () => Promise.reject(failure) }],
  };
  const commit = vi.fn();
  const database = {
    sequelize: {
      transaction: async (callback: (value: object) => Promise<unknown>) => {
        const result = await callback({});
        commit();
        return result;
      },
    },
  };
  const model = { findByPk: () => evaluation };
  const service = new EvaluationsService(
    model as unknown as typeof Evaluation,
    database as unknown as DatabaseService,
  );
  await expect(service.remove('1')).rejects.toBe(failure);
  expect(evaluation.destroy).not.toHaveBeenCalled();
  expect(commit).not.toHaveBeenCalled();
});
