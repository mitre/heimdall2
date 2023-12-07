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
  totalCount: number;
  evaluations: IEvaluation[];
}

export interface IEvalPaginationParams {
  offset: number;
  limit: number;
  order: Array<string>;
  useClause?: boolean;
  operator?: string;
  fields?: Array<string>;
}

