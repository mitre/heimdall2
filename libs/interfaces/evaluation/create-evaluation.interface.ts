import {ICreateEvaluationTag} from '..';

export interface ICreateEvaluation {
  readonly version: string;
  readonly data: Record<string, any>;
  readonly evaluationTags: ICreateEvaluationTag[];
}
