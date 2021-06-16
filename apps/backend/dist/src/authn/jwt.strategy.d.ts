import { IUser } from '@heimdall/interfaces';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '../config/config.service';
import { UsersService } from '../users/users.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly usersService;
    constructor(configService: ConfigService, usersService: UsersService);
    validate(payload: {
        sub: string;
        email: string;
        role: string;
    }): Promise<IUser>;
}
export {};
