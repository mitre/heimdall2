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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const axios_1 = __importDefault(require("axios"));
const passport_github_1 = require("passport-github");
const config_service_1 = require("../config/config.service");
const authn_service_1 = require("./authn.service");
let GithubStrategy = class GithubStrategy extends passport_1.PassportStrategy(passport_github_1.Strategy, 'github') {
    constructor(authnService, configService) {
        super({
            clientID: configService.get('GITHUB_CLIENTID') || 'disabled',
            clientSecret: configService.get('GITHUB_CLIENTSECRET') || 'disabled',
            authorizationURL: `
        ${configService.get('GITHUB_ENTERPRISE_INSTANCE_BASE_URL') ||
                configService.defaultGithubBaseURL}login/oauth/authorize`,
            tokenURL: `${configService.get('GITHUB_ENTERPRISE_INSTANCE_BASE_URL') ||
                configService.defaultGithubBaseURL}login/oauth/access_token`,
            userProfileURL: `${configService.get('GITHUB_ENTERPRISE_INSTANCE_API_URL') ||
                configService.defaultGithubAPIURL}user`,
            scope: 'user:email',
            passReqToCallback: true
        });
        this.authnService = authnService;
        this.configService = configService;
    }
    async validate(req, accessToken) {
        const githubEmails = await axios_1.default
            .get(`${this.configService.get('GITHUB_ENTERPRISE_INSTANCE_API_URL') ||
            this.configService.defaultGithubAPIURL}user/emails`, {
            headers: { Authorization: `token ${accessToken}` }
        })
            .then((response) => {
            return response.data;
        });
        const userInfoResponse = await axios_1.default
            .get(`${this.configService.get('GITHUB_ENTERPRISE_INSTANCE_API_URL') ||
            this.configService.defaultGithubAPIURL}user`, {
            headers: { Authorization: `token ${accessToken}` }
        })
            .then((response) => {
            return response.data;
        });
        const { firstName, lastName } = this.authnService.splitName(userInfoResponse.name);
        const primaryEmail = githubEmails[0];
        if (primaryEmail.verified) {
            return this.authnService.validateOrCreateUser(primaryEmail.email, firstName, lastName, 'github');
        }
        else {
            throw new common_1.UnauthorizedException('Please verify your email with Github before logging into Heimdall.');
        }
    }
};
GithubStrategy = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [authn_service_1.AuthnService,
        config_service_1.ConfigService])
], GithubStrategy);
exports.GithubStrategy = GithubStrategy;
//# sourceMappingURL=github.strategy.js.map