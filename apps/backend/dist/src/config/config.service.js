"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportedOauth = exports.ConfigService = void 0;
const app_config_1 = __importDefault(require("../../config/app_config"));
const startup_settings_dto_1 = require("./dto/startup-settings.dto");
class ConfigService {
    constructor() {
        this.defaultGithubBaseURL = 'https://github.com/';
        this.defaultGithubAPIURL = 'https://api.github.com/';
        this.appConfig = new app_config_1.default();
    }
    isRegistrationAllowed() {
        var _a;
        return ((_a = this.get('REGISTRATION_DISABLED')) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== 'true';
    }
    frontendStartupSettings() {
        var _a;
        const enabledOauth = [];
        exports.supportedOauth.forEach((oauthStrategy) => {
            if (this.get(`${oauthStrategy.toUpperCase()}_CLIENTID`)) {
                enabledOauth.push(oauthStrategy);
            }
        });
        return new startup_settings_dto_1.StartupSettingsDto({
            banner: this.get('WARNING_BANNER') || '',
            enabledOAuth: enabledOauth,
            oidcName: this.get('OIDC_NAME') || '',
            ldap: ((_a = this.get('LDAP_ENABLED')) === null || _a === void 0 ? void 0 : _a.toLocaleLowerCase()) === 'true' || false,
            registrationEnabled: this.isRegistrationAllowed()
        });
    }
    getDbConfig() {
        return this.appConfig.getDbConfig();
    }
    getSSLConfig() {
        return this.appConfig.getSSLConfig();
    }
    set(key, value) {
        this.appConfig.set(key, value);
    }
    get(key) {
        return this.appConfig.get(key);
    }
}
exports.ConfigService = ConfigService;
exports.supportedOauth = [
    'github',
    'gitlab',
    'google',
    'okta',
    'oidc'
];
//# sourceMappingURL=config.service.js.map