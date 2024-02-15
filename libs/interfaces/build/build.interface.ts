import {IEvaluation} from '../evaluation/evaluation.interface';
import {IGroup} from '../group/group.interface';

export interface IBuild {
  readonly id: string;
  groups: IGroup[];
  readonly userId?: string;
  readonly groupId?: string;
  readonly buildId: string;
  readonly buildType: number;
  readonly branchName: string;
  readonly evaluations: IEvaluation[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
