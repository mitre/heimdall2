import { ConfigService } from '../config/config.service';
import { AuthnService } from './authn.service';
declare const OktaStrategy_base: new (...args: any[]) => any;
export declare class OktaStrategy extends OktaStrategy_base {
    private readonly authnService;
    private readonly configService;
    constructor(authnService: AuthnService, configService: ConfigService);
}
export {};
