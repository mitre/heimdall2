import { ICreateUser } from '@heimdall/interfaces';
export declare class CreateUserDto implements ICreateUser {
    readonly email: string;
    readonly password: string;
    readonly passwordConfirmation: string;
    readonly firstName: string | undefined;
    readonly lastName: string | undefined;
    readonly organization: string | undefined;
    readonly title: string | undefined;
    readonly role: string;
    readonly creationMethod: string;
}
