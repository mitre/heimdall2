import Strategy from 'passport-ldapauth';
import { ConfigService } from '../config/config.service';
import { AuthnService } from './authn.service';
declare const LDAPStrategy_base: new (...args: any[]) => Strategy;
export declare class LDAPStrategy extends LDAPStrategy_base {
    private readonly authnService;
    private readonly configService;
    constructor(authnService: AuthnService, configService: ConfigService);
}
export {};
