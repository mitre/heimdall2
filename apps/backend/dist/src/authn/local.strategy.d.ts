import { Strategy } from 'passport-local';
import { User } from '../users/user.model';
import { AuthnService } from './authn.service';
declare const LocalStrategy_base: new (...args: any[]) => Strategy;
export declare class LocalStrategy extends LocalStrategy_base {
    private authnService;
    constructor(authnService: AuthnService);
    validate(email: string, password: string): Promise<User>;
}
export {};
