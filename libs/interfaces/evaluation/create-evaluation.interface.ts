import {ICreateEvaluationTag} from '..';

export interface ICreateEvaluation {
  readonly filename: string;
  readonly data: Record<string, any>;
  public: boolean | string;
  readonly evaluationTags: ICreateEvaluationTag[] | undefined;
}
