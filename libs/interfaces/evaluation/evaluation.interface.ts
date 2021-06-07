import {IEvaluationTag} from '..';
import {IGroup} from '../group/group.interface';

export interface IEvaluation {
  id: string;
  filename: string;
  readonly data?: Record<string, any>;
  evaluationTags: IEvaluationTag[];
  groups?: IGroup[];
  readonly userId: string;
  readonly public: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly editable: boolean;
}
