import { ISlimUser } from '@heimdall/interfaces';
import { User } from '../user.model';
export declare class SlimUserDto implements ISlimUser {
    readonly id: string;
    readonly email: string;
    readonly title?: string;
    readonly groupRole?: string;
    readonly firstName?: string;
    readonly lastName?: string;
    constructor(user: User, groupRole?: string | undefined);
}
