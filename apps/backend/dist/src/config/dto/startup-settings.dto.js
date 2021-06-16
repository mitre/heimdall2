"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartupSettingsDto = void 0;
class StartupSettingsDto {
    constructor(settings) {
        this.banner = settings.banner;
        this.enabledOAuth = settings.enabledOAuth;
        this.oidcName = settings.oidcName;
        this.ldap = settings.ldap;
        this.registrationEnabled = settings.registrationEnabled;
    }
}
exports.StartupSettingsDto = StartupSettingsDto;
//# sourceMappingURL=startup-settings.dto.js.map