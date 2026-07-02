import type { ICreateEvaluationTag } from '..';

export type ICreateEvaluation = {
  readonly evaluationTags: ICreateEvaluationTag[] | undefined;
  readonly filename: string;
  readonly groups: string[] | undefined;
  readonly public: boolean;
};
