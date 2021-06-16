import { Dialect } from 'sequelize/types';
export default class AppConfig {
    private envConfig;
    constructor();
    set(key: string, value: string | undefined): void;
    get(key: string): string | undefined;
    getDatabaseName(): string;
    getSSLConfig(): false | {
        rejectUnauthorized: boolean;
    };
    getDbConfig(): {
        username: string;
        user: string;
        role: string;
        password: string;
        database: string;
        host: string;
        port: number;
        dialect: Dialect;
        dialectOptions: {
            ssl: boolean | {
                rejectUnauthorized: boolean;
            };
        };
        ssl: boolean;
    };
    parseDatabaseUrl(): boolean;
}
