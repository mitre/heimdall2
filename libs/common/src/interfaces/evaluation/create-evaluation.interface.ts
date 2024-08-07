import {ICreateEvaluationTag} from '..';

export interface ICreateEvaluation {
  readonly filename: string;
  readonly public: boolean;
  readonly evaluationTags: ICreateEvaluationTag[] | undefined;
  readonly groups: string[] | undefined;
}
