import { IAddUserToGroup } from '@heimdall/interfaces';
export declare class AddUserToGroupDto implements IAddUserToGroup {
    readonly userId: string;
    readonly groupRole: string;
}
