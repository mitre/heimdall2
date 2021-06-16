"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitlabStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_gitlab2_1 = require("passport-gitlab2");
const config_service_1 = require("../config/config.service");
const authn_service_1 = require("./authn.service");
let GitlabStrategy = class GitlabStrategy extends passport_1.PassportStrategy(passport_gitlab2_1.Strategy, 'gitlab') {
    constructor(authnService, configService) {
        super({
            clientID: configService.get('GITLAB_CLIENTID') || 'disabled',
            clientSecret: configService.get('GITLAB_SECRET') || 'disabled',
            callbackURL: `${configService.get('EXTERNAL_URL')}/authn/gitlab/callback` ||
                'disabled'
        });
        this.authnService = authnService;
        this.configService = configService;
    }
    async validate(accessToken, refreshToken, profile) {
        const email = profile.emails[0].value;
        const { firstName, lastName } = this.authnService.splitName(profile.displayName);
        return this.authnService.validateOrCreateUser(email, firstName, lastName, 'gitlab');
    }
};
GitlabStrategy = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [authn_service_1.AuthnService,
        config_service_1.ConfigService])
], GitlabStrategy);
exports.GitlabStrategy = GitlabStrategy;
//# sourceMappingURL=gitlab.strategy.js.map