import {IEvaluationTag} from '..';

export class IEvaluation {
  id: number;
  readonly version: string;
  readonly data: Record<string, any>;
  readonly evaluationTags: IEvaluationTag[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
