import { Model } from 'sequelize-typescript';
import { Evaluation } from '../evaluations/evaluation.model';
import { GroupEvaluation } from '../group-evaluations/group-evaluation.model';
import { GroupUser } from '../group-users/group-user.model';
import { User } from '../users/user.model';
export declare class Group extends Model {
    id: string;
    name: string;
    public: boolean;
    createdAt: Date;
    updatedAt: Date;
    users: Array<User & {
        GroupUser: GroupUser;
    }>;
    evaluations: Array<Evaluation & {
        GroupEvaluation: GroupEvaluation;
    }>;
}
