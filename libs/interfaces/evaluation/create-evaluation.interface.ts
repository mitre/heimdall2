import {ICreateEvaluationTag} from '..';

export interface ICreateEvaluation {
  readonly filename: string;
  readonly data: Record<string, any>;
  readonly evaluationTags: ICreateEvaluationTag[];
}
