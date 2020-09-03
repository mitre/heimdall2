import {IUpdateEvaluationTag} from '..';

export interface IUpdateEvaluation {
  readonly version: string;
  readonly data: Record<string, any>;
  readonly evaluationTags: IUpdateEvaluationTag[];
}
