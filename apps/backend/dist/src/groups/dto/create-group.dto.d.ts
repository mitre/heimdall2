import { ICreateGroup } from '@heimdall/interfaces';
export declare class CreateGroupDto implements ICreateGroup {
    readonly name: string;
    readonly public: boolean;
}
