import { IUser } from '@heimdall/interfaces';
import { User } from '../user.model';
export declare class UserDto implements IUser {
    id: string;
    readonly email: string;
    readonly firstName: string | undefined;
    readonly lastName: string | undefined;
    readonly title: string | undefined;
    readonly role: string;
    readonly organization: string | undefined;
    readonly loginCount: number;
    readonly lastLogin: Date | undefined;
    readonly creationMethod: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    constructor(user: User);
}
