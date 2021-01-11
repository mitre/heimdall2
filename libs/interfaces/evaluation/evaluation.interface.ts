import {IEvaluationTag} from '..';

export interface IEvaluation {
  id: string;
  filename: string;
  readonly data: Record<string, any> | undefined;
  evaluationTags: IEvaluationTag[] | null;
  readonly userId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
