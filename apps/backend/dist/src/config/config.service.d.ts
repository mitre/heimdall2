import { SequelizeOptions } from 'sequelize-typescript';
import { StartupSettingsDto } from './dto/startup-settings.dto';
export declare class ConfigService {
    private readonly appConfig;
    defaultGithubBaseURL: string;
    defaultGithubAPIURL: string;
    constructor();
    isRegistrationAllowed(): boolean;
    frontendStartupSettings(): StartupSettingsDto;
    getDbConfig(): SequelizeOptions;
    getSSLConfig(): false | {
        rejectUnauthorized: boolean;
    };
    set(key: string, value: string | undefined): void;
    get(key: string): string | undefined;
}
export declare const supportedOauth: string[];
