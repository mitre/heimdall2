import { ConfigService } from '../config/config.service';
import { AuthnService } from './authn.service';
declare const OidcStrategy_base: new (...args: any[]) => any;
export declare class OidcStrategy extends OidcStrategy_base {
    private readonly authnService;
    private readonly configService;
    constructor(authnService: AuthnService, configService: ConfigService);
}
export {};
