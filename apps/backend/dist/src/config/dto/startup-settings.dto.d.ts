import { IStartupSettings } from '@heimdall/interfaces';
export declare class StartupSettingsDto implements IStartupSettings {
    readonly banner: string;
    readonly enabledOAuth: string[];
    readonly oidcName: string;
    readonly ldap: boolean;
    readonly registrationEnabled: boolean;
    constructor(settings: IStartupSettings);
}
