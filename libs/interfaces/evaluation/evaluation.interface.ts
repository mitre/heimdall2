import {IEvaluationTag} from '..';

export interface IEvaluation {
  id: string;
  filename: string;
  readonly data?: Record<string, any>;
  evaluationTags: IEvaluationTag[];
  readonly userId: string;
  readonly public: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly editable: boolean;
}
