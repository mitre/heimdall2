import type { IEvaluationTag } from '..';
import type { IGroup } from '../group/group.interface';

export type IEvalPaginationParams = {
  limit: number;
  offset: number;
  operator?: string;
  order: string[];
  searchFields?: string[];
  useClause?: boolean;
};

export type IEvaluation = {
  readonly createdAt: Date;
  readonly data?: Record<string, any>;
  readonly editable: boolean;
  evaluationTags: IEvaluationTag[];
  filename: string;
  readonly groupId?: string;
  groups: IGroup[];
  id: string;
  readonly public: boolean;
  readonly updatedAt: Date;
  readonly userId?: string;
};

export type IEvaluationResponse = {
  evaluations: IEvaluation[];
  totalCount: number;
};
