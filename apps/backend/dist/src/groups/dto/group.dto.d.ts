import { IGroup } from '@heimdall/interfaces';
import { GroupUser } from '../../group-users/group-user.model';
import { SlimUserDto } from '../../users/dto/slim-user.dto';
import { Group } from '../group.model';
export declare class GroupDto implements IGroup {
    readonly id: string;
    readonly name: string;
    readonly public: boolean;
    readonly role?: string;
    readonly users: SlimUserDto[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
    constructor(group: Group & {
        GroupUser?: GroupUser;
    }, role?: string);
}
