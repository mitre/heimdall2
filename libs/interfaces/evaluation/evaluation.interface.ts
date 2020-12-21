import {IEvaluationTag} from '..';

export interface IEvaluation {
  id: string;
  readonly filename: string;
  readonly data: Record<string, any> | undefined;
  readonly evaluationTags: IEvaluationTag[] | null;
  readonly userId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
