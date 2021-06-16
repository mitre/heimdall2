import { ConfigService } from '../config/config.service';
import { User } from '../users/user.model';
import { AuthnService } from './authn.service';
interface UserEmail {
    value: string;
}
interface GitlabProfile {
    username: string;
    emails: UserEmail[];
    displayName: string;
}
declare const GitlabStrategy_base: new (...args: any[]) => any;
export declare class GitlabStrategy extends GitlabStrategy_base {
    private readonly authnService;
    private readonly configService;
    constructor(authnService: AuthnService, configService: ConfigService);
    validate(accessToken: string, refreshToken: string, profile: GitlabProfile): Promise<User>;
}
export {};
