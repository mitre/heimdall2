import {
  IUpdateEvaluationTag,
  ICreateEvaluationTag,
  IDeleteEvaluationTag
} from '..';

export interface IUpdateEvaluation {
  readonly filename: string | undefined;
  readonly data: Record<string, any> | undefined;
  readonly evaluationTags: (
    | IUpdateEvaluationTag
    | ICreateEvaluationTag
    | IDeleteEvaluationTag
  )[] | undefined;
}
