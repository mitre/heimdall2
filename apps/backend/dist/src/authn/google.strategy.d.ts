import { ConfigService } from '../config/config.service';
import { User } from '../users/user.model';
import { AuthnService } from './authn.service';
interface UserEmail {
    value: string;
    verified: boolean;
}
interface GoogleProfile {
    name: {
        familyName: string;
        givenName: string;
    };
    emails: UserEmail[];
}
declare const GoogleStrategy_base: new (...args: any[]) => any;
export declare class GoogleStrategy extends GoogleStrategy_base {
    private readonly authnService;
    private readonly configService;
    constructor(authnService: AuthnService, configService: ConfigService);
    validate(accessToken: string, refreshToken: string, profile: GoogleProfile): Promise<User>;
}
export {};
