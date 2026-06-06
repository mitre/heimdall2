import {randomUUID} from 'node:crypto';
import {evaluations, evaluationTags} from '../schema';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';

type EvaluationInsert = typeof evaluations.$inferInsert;
type EvaluationSelect = typeof evaluations.$inferSelect;

export interface CreateEvaluationOptions extends Partial<EvaluationInsert> {
  tags?: string[];
}

let counter = 0;

export const evaluationFactory = {
  build(overrides?: Partial<EvaluationInsert>): EvaluationInsert {
    counter++;
    const now = new Date().toISOString();
    return {
      filename: `test-eval-${counter}-${randomUUID().slice(0, 8)}.json`,
      data: {},
      public: false,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  },

  async create(
    db: NodePgDatabase<Record<string, unknown>>,
    options?: CreateEvaluationOptions
  ): Promise<EvaluationSelect> {
    const {tags, ...evalOverrides} = options ?? {};
    const data = evaluationFactory.build(evalOverrides);

    return db.transaction(async (tx) => {
      const [evaluation] = await tx
        .insert(evaluations)
        .values(data)
        .returning();

      if (tags && tags.length > 0) {
        const now = new Date().toISOString();
        await tx.insert(evaluationTags).values(
          tags.map((value) => ({
            value,
            evaluationId: evaluation.id,
            createdAt: now,
            updatedAt: now,
          }))
        );
      }

      return evaluation;
    });
  },
};
