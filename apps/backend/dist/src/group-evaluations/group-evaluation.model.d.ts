import { Model } from 'sequelize-typescript';
export declare class GroupEvaluation extends Model {
    id: string;
    groupId: string;
    evaluationId: string;
    createdAt: Date;
    updatedAt: Date;
}
