import { Model } from 'sequelize-typescript';
export declare class GroupUser extends Model {
    id: string;
    role: string;
    groupId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
