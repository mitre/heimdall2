import { Strategy } from 'passport-github';
import { ConfigService } from '../config/config.service';
import { User } from '../users/user.model';
import { AuthnService } from './authn.service';
declare const GithubStrategy_base: new (...args: any[]) => Strategy;
export declare class GithubStrategy extends GithubStrategy_base {
    private readonly authnService;
    private readonly configService;
    constructor(authnService: AuthnService, configService: ConfigService);
    validate(req: Record<string, unknown>, accessToken: string): Promise<User>;
}
export {};
