"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
class AppConfig {
    constructor() {
        console.log('Attempting to read configuration file `.env`!');
        try {
            this.envConfig = dotenv.parse(fs.readFileSync('.env'));
            console.log('Read config!');
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                this.envConfig = {};
                console.log('Unable to read configuration file `.env`!');
                console.log('Falling back to environment or undefined values!');
            }
            else {
                throw error;
            }
        }
        if (this.parseDatabaseUrl()) {
            console.log('DATABASE_URL parsed into smaller components (i.e. DATABASE_USER)');
        }
    }
    set(key, value) {
        this.envConfig[key] = value;
    }
    get(key) {
        return process.env[key] || this.envConfig[key];
    }
    getDatabaseName() {
        const databaseName = this.get('DATABASE_NAME');
        const nodeEnvironment = this.get('NODE_ENV');
        if (databaseName !== undefined) {
            return databaseName;
        }
        else if (nodeEnvironment !== undefined) {
            return `heimdall-server-${nodeEnvironment.toLowerCase()}`;
        }
        else {
            throw new TypeError('NODE_ENV and DATABASE_NAME are undefined. Unable to set database or use the default based on environment.');
        }
    }
    getSSLConfig() {
        return Boolean(this.get('DATABASE_SSL'))
            ? {
                rejectUnauthorized: false
            }
            : false;
    }
    getDbConfig() {
        return {
            username: this.get('DATABASE_USERNAME') || 'postgres',
            user: this.get('DATABASE_USERNAME') || 'postgres',
            role: this.get('DATABASE_USERNAME') || 'postgres',
            password: this.get('DATABASE_PASSWORD') || '',
            database: this.getDatabaseName(),
            host: this.get('DATABASE_HOST') || '127.0.0.1',
            port: Number(this.get('DATABASE_PORT')) || 5432,
            dialect: 'postgres',
            dialectOptions: {
                ssl: this.getSSLConfig()
            },
            ssl: Boolean(this.get('DATABASE_SSL')) || false
        };
    }
    parseDatabaseUrl() {
        const url = this.get('DATABASE_URL');
        if (url === undefined) {
            return false;
        }
        else {
            const pattern = /^(?:([^:\/?#\s]+):\/{2})?(?:([^@\/?#\s]+)@)?([^\/?#\s]+)?(?:\/([^?#\s]*))?(?:[?]([^#\s]+))?\S*$/;
            const matches = url.match(pattern);
            if (matches === null) {
                return false;
            }
            this.set('DATABASE_USERNAME', matches[2] !== undefined ? matches[2].split(':')[0] : undefined);
            this.set('DATABASE_PASSWORD', matches[2] !== undefined ? matches[2].split(':')[1] : undefined);
            this.set('DATABASE_HOST', matches[3] !== undefined ? matches[3].split(/:(?=\d+$)/)[0] : undefined);
            this.set('DATABASE_NAME', matches[4] !== undefined ? matches[4].split('/')[0] : undefined);
            this.set('DATABASE_PORT', matches[3] !== undefined ? matches[3].split(/:(?=\d+$)/)[1] : undefined);
            return true;
        }
    }
}
exports.default = AppConfig;
//# sourceMappingURL=app_config.js.map