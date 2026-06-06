import {Inject, Injectable, NotFoundException} from '@nestjs/common';
import {and, asc, count, desc, eq, ilike, inArray, or, type AnyColumn, type SQL} from 'drizzle-orm';
import {DRIZZLE} from '../db/drizzle.module';
import {evaluations, evaluationTags, groupEvaluations, groupUsers, groups} from '../db/schema';
import type {DbSchema} from '../db/types';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';

interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

interface PaginatedResult {
  data: Array<Awaited<ReturnType<EvaluationsService['findAll']>>[number]>;
  meta: PaginationMeta;
}

interface FindPaginatedParams {
  page: number;
  perPage: number;
  sort: string;
  order: 'asc' | 'desc';
  q?: string;
  userId: string;
  role: string;
}

const SORT_COLUMNS: Record<string, AnyColumn> = {
  filename: evaluations.filename,
  createdAt: evaluations.createdAt,
  updatedAt: evaluations.updatedAt,
};

@Injectable()
export class EvaluationsService {
  static escapeForLike(input: string): string {
    return input.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
  }

  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<DbSchema>,
  ) {}

  async findAll() {
    return this.db.query.evaluations.findMany({
      columns: {data: false},
      with: {
        evaluationTags: true,
        user: true,
        groupEvaluations: {with: {group: {with: {groupUsers: {with: {user: true}}}}}},
      },
    });
  }

  async count(): Promise<number> {
    const [{value}] = await this.db.select({value: count()}).from(evaluations);
    return value;
  }

  async findById(id: string) {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId < 1) {
      throw new NotFoundException('Evaluation with given id not found');
    }
    const evaluation = await this.db.query.evaluations.findFirst({
      where: eq(evaluations.id, numId),
      with: {
        evaluationTags: true,
        user: true,
        groupEvaluations: {with: {group: {with: {groupUsers: {with: {user: true}}}}}},
      },
    });
    if (!evaluation) {
      throw new NotFoundException('Evaluation with given id not found');
    }
    return evaluation;
  }

  async findByPkBang(id: string) {
    return this.findById(id);
  }

  async groups(id: string) {
    const evaluation = await this.findById(id);
    return (evaluation.groupEvaluations ?? [])
      .filter((ge) => ge.group != null)
      .map((ge) => ge.group!);
  }

  async create(input: {
    filename: string;
    public: boolean;
    data: unknown;
    userId?: number;
    groupId?: number;
    evaluationTags?: Array<{value: string}>;
  }) {
    const now = new Date().toISOString();
    const [evaluation] = await this.db
      .insert(evaluations)
      .values({
        filename: input.filename,
        public: input.public,
        data: input.data,
        userId: input.userId ?? null,
        groupId: input.groupId ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (input.evaluationTags && input.evaluationTags.length > 0) {
      await this.db.insert(evaluationTags).values(
        input.evaluationTags.map((tag) => ({
          value: tag.value,
          evaluationId: evaluation.id,
          createdAt: now,
          updatedAt: now,
        })),
      );
    }

    return evaluation;
  }

  async update(
    id: string,
    updateDto: {filename?: string; data?: unknown; public?: boolean},
  ) {
    const existing = await this.findById(id);
    const updates: Partial<typeof evaluations.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };
    if (updateDto.filename !== undefined) updates.filename = updateDto.filename;
    if (updateDto.data !== undefined) updates.data = updateDto.data;
    if (updateDto.public !== undefined) updates.public = updateDto.public;

    await this.db
      .update(evaluations)
      .set(updates)
      .where(eq(evaluations.id, existing.id));
    return this.findById(id);
  }

  async remove(id: string) {
    const evaluation = await this.findById(id);

    await this.db.transaction(async (tx) => {
      await tx
        .delete(evaluationTags)
        .where(eq(evaluationTags.evaluationId, evaluation.id));
      await tx
        .delete(evaluations)
        .where(eq(evaluations.id, evaluation.id));
    });

    return evaluation;
  }

  async evaluationCount(userId: string, role: string): Promise<number> {
    const [{value}] = await this.db
      .select({value: count()})
      .from(evaluations)
      .where(this.visibilityCondition(userId, role));
    return value;
  }

  private visibilityCondition(userId: string, role: string): SQL | undefined {
    if (role === 'admin') return undefined;

    const numUserId = Number(userId);
    const groupEvalSubquery = this.db
      .selectDistinct({id: groupEvaluations.evaluationId})
      .from(groupEvaluations)
      .innerJoin(groupUsers, eq(groupEvaluations.groupId, groupUsers.groupId))
      .where(eq(groupUsers.userId, numUserId));

    return or(
      eq(evaluations.public, true),
      eq(evaluations.userId, numUserId),
      inArray(evaluations.id, groupEvalSubquery),
    );
  }

  private searchCondition(q: string): SQL | undefined {
    if (!q || q.trim().length === 0) return undefined;

    const escaped = `%${EvaluationsService.escapeForLike(q.trim())}%`;

    const tagSubquery = this.db
      .selectDistinct({id: evaluationTags.evaluationId})
      .from(evaluationTags)
      .where(ilike(evaluationTags.value, escaped));

    const groupSubquery = this.db
      .selectDistinct({id: groupEvaluations.evaluationId})
      .from(groupEvaluations)
      .innerJoin(groups, eq(groupEvaluations.groupId, groups.id))
      .where(ilike(groups.name, escaped));

    return or(
      ilike(evaluations.filename, escaped),
      inArray(evaluations.id, tagSubquery),
      inArray(evaluations.id, groupSubquery),
    );
  }

  async findPaginated(params: FindPaginatedParams): Promise<PaginatedResult> {
    const where = and(
      this.visibilityCondition(params.userId, params.role),
      params.q ? this.searchCondition(params.q) : undefined,
    );

    const [{value: total}] = await this.db
      .select({value: count()})
      .from(evaluations)
      .where(where);

    const totalPages = Math.ceil(total / params.perPage) || 1;
    const offset = (params.page - 1) * params.perPage;

    const sortCol = SORT_COLUMNS[params.sort] ?? evaluations.createdAt;
    const orderFn = params.order === 'asc' ? asc : desc;

    const pageIds = await this.db
      .select({id: evaluations.id})
      .from(evaluations)
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(params.perPage)
      .offset(offset);

    if (pageIds.length === 0) {
      return {data: [], meta: {total, page: params.page, perPage: params.perPage, totalPages}};
    }

    const data = await this.db.query.evaluations.findMany({
      where: inArray(evaluations.id, pageIds.map((r) => r.id)),
      columns: {data: false},
      with: {
        evaluationTags: true,
        user: true,
        groupEvaluations: {with: {group: {with: {groupUsers: {with: {user: true}}}}}},
      },
    });

    const idOrder = pageIds.map((r) => r.id);
    const sorted = data.sort((a, b) => idOrder.indexOf(a.id) - idOrder.indexOf(b.id));

    return {
      data: sorted,
      meta: {total, page: params.page, perPage: params.perPage, totalPages},
    };
  }
}
