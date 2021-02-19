import {ICreateEvaluationTag} from '..';

export interface ICreateEvaluation {
  readonly filename: string;
  readonly data: Record<string, any>;
  readonly public: boolean;
  readonly evaluationTags: ICreateEvaluationTag[] | undefined;
}
