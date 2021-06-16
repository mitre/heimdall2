import { Request } from 'express';
import { AuthnService } from './authn.service';
export declare class AuthnController {
    private authnService;
    constructor(authnService: AuthnService);
    login(req: Request): Promise<{
        userID: string;
        accessToken: string;
    }>;
    loginToLDAP(req: Request): Promise<{
        userID: string;
        accessToken: string;
    }>;
    loginToGithub(req: Request): Promise<{
        userID: string;
        accessToken: string;
    }>;
    getUserFromGithubLogin(req: Request): Promise<void>;
    loginToGitlab(req: Request): Promise<{
        userID: string;
        accessToken: string;
    }>;
    getUserFromGitlabLogin(req: Request): Promise<void>;
    loginToGoogle(req: Request): Promise<{
        userID: string;
        accessToken: string;
    }>;
    getUserFromGoogle(req: Request): Promise<void>;
    loginToOkta(req: Request): Promise<{
        userID: string;
        accessToken: string;
    }>;
    getUserFromOkta(req: Request): Promise<void>;
    loginToOIDC(req: Request): Promise<{
        userID: string;
        accessToken: string;
    }>;
    getUserFromOIDC(req: Request): Promise<void>;
    setSessionCookies(req: Request, session: {
        userID: string;
        accessToken: string;
    }): Promise<void>;
}
