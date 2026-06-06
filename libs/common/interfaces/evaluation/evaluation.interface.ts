import {IEvaluationTag} from '..';
import {IGroup} from '../group/group.interface';

export interface IEvaluation {
  id: string;
  filename: string;
  readonly data?: Record<string, any>;
  evaluationTags: IEvaluationTag[];
  groups: IGroup[];
  readonly userId?: string;
  readonly groupId?: string;
  readonly public: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly editable: boolean;
}

export interface IEvaluationResponse {
  evaluations: IEvaluation[];
  totalCount: number;
  meta?: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface IEvalPaginationParams {
  page?: number;
  per_page?: number;
  sort?: string;
  order?: string | Array<string>;
  q?: string;
  offset?: number;
  limit?: number;
  useClause?: boolean;
  operator?: string;
  searchFields?: Array<string>;
}
