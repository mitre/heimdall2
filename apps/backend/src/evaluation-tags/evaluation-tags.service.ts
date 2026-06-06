import {Inject, Injectable, NotFoundException} from '@nestjs/common';
import {count, eq} from 'drizzle-orm';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';
import {DRIZZLE} from '../db/drizzle.module';
import {evaluationTags} from '../db/schema';
import type {DbSchema} from '../db/types';
import type {SelectEvaluationTag} from '../db/zod-schemas';
import {CreateEvaluationTagDto} from './dto/create-evaluation-tag.dto';

@Injectable()
export class EvaluationTagsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<DbSchema>,
  ) {}

  async findAll() {
    return this.db.query.evaluationTags.findMany({
      with: {
        evaluation: {
          with: {
            groupEvaluations: {
              with: {
                group: {
                  with: {
                    groupUsers: {
                      with: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async count(): Promise<number> {
    const [{total}] = await this.db
      .select({total: count()})
      .from(evaluationTags);
    return total;
  }

  async findById(id: number) {
    const tag = await this.db.query.evaluationTags.findFirst({
      where: eq(evaluationTags.id, id),
      with: {
        evaluation: {
          with: {
            groupEvaluations: {
              with: {
                group: {
                  with: {
                    groupUsers: {
                      with: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!tag) {
      throw new NotFoundException('EvaluationTag with given id not found');
    }
    return tag;
  }

  async create(
    evaluationId: number,
    createEvaluationTagDto: CreateEvaluationTagDto,
  ): Promise<SelectEvaluationTag> {
    const now = new Date().toISOString();
    const [tag] = await this.db
      .insert(evaluationTags)
      .values({
        value: createEvaluationTagDto.value,
        evaluationId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return tag;
  }

  async remove(id: number) {
    const tag = await this.findById(id);
    await this.db.delete(evaluationTags).where(eq(evaluationTags.id, id));
    return tag;
  }
}
