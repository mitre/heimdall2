import { Model } from 'sequelize-typescript';
import { EvaluationTag } from '../evaluation-tags/evaluation-tag.model';
import { GroupEvaluation } from '../group-evaluations/group-evaluation.model';
import { Group } from '../groups/group.model';
import { User } from '../users/user.model';
export declare class Evaluation extends Model {
    id: string;
    filename: string;
    data: Record<string, unknown>;
    public: boolean;
    userId: string;
    user: User;
    createdAt: Date;
    updatedAt: Date;
    evaluationTags: EvaluationTag[];
    groups: Array<Group & {
        GroupEvaluation: GroupEvaluation;
    }>;
}
