import { Model } from 'sequelize-typescript';
import { GroupUser } from '../group-users/group-user.model';
import { Group } from '../groups/group.model';
export declare class User extends Model {
    id: string;
    email: string;
    firstName: string | undefined;
    lastName: string | undefined;
    organization: string | undefined;
    title: string | undefined;
    encryptedPassword: string;
    forcePasswordChange: boolean | undefined;
    lastLogin: Date | undefined;
    loginCount: number;
    passwordChangedAt: Date | undefined;
    role: string;
    creationMethod: string;
    createdAt: Date;
    updatedAt: Date;
    groups: Array<Group & {
        GroupUser: GroupUser;
    }>;
}
