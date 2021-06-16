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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthnController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const authentication_exception_filter_1 = require("../filters/authentication-exception.filter");
const local_auth_guard_1 = require("../guards/local-auth.guard");
const authn_service_1 = require("./authn.service");
let AuthnController = class AuthnController {
    constructor(authnService) {
        this.authnService = authnService;
    }
    async login(req) {
        return this.authnService.login(req.user);
    }
    async loginToLDAP(req) {
        return this.authnService.login(req.user);
    }
    async loginToGithub(req) {
        return this.authnService.login(req.user);
    }
    async getUserFromGithubLogin(req) {
        const session = await this.authnService.login(req.user);
        await this.setSessionCookies(req, session);
    }
    async loginToGitlab(req) {
        return this.authnService.login(req.user);
    }
    async getUserFromGitlabLogin(req) {
        const session = await this.authnService.login(req.user);
        await this.setSessionCookies(req, session);
    }
    async loginToGoogle(req) {
        return this.authnService.login(req.user);
    }
    async getUserFromGoogle(req) {
        const session = await this.authnService.login(req.user);
        await this.setSessionCookies(req, session);
    }
    async loginToOkta(req) {
        return this.authnService.login(req.user);
    }
    async getUserFromOkta(req) {
        const session = await this.authnService.login(req.user);
        await this.setSessionCookies(req, session);
    }
    async loginToOIDC(req) {
        return this.authnService.login(req.user);
    }
    async getUserFromOIDC(req) {
        const session = await this.authnService.login(req.user);
        await this.setSessionCookies(req, session);
    }
    async setSessionCookies(req, session) {
        var _a, _b, _c;
        (_a = req.res) === null || _a === void 0 ? void 0 : _a.cookie('userID', session.userID);
        (_b = req.res) === null || _b === void 0 ? void 0 : _b.cookie('accessToken', session.accessToken);
        (_c = req.res) === null || _c === void 0 ? void 0 : _c.redirect('/');
    }
};
__decorate([
    common_1.UseGuards(local_auth_guard_1.LocalAuthGuard),
    common_1.Post('login'),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthnController.prototype, "login", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('ldap')),
    common_1.Post('login/ldap'),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthnController.prototype, "loginToLDAP", null);
__decorate([
    common_1.Get('github'),
    common_1.UseGuards(passport_1.AuthGuard('github')),
    common_1.UseFilters(new authentication_exception_filter_1.AuthenticationExceptionFilter()),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthnController.prototype, "loginToGithub", null);
__decorate([
    common_1.Get('github/callback'),
    common_1.UseGuards(passport_1.AuthGuard('github')),
    common_1.UseFilters(new authentication_exception_filter_1.AuthenticationExceptionFilter()),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthnController.prototype, "getUserFromGithubLogin", null);
__decorate([
    common_1.Get('gitlab'),
    common_1.UseGuards(passport_1.AuthGuard('gitlab')),
    common_1.UseFilters(new authentication_exception_filter_1.AuthenticationExceptionFilter()),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthnController.prototype, "loginToGitlab", null);
__decorate([
    common_1.Get('gitlab/callback'),
    common_1.UseGuards(passport_1.AuthGuard('gitlab')),
    common_1.UseFilters(new authentication_exception_filter_1.AuthenticationExceptionFilter()),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthnController.prototype, "getUserFromGitlabLogin", null);
__decorate([
    common_1.Get('google'),
    common_1.UseGuards(passport_1.AuthGuard('google')),
    common_1.UseFilters(new authentication_exception_filter_1.AuthenticationExceptionFilter()),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthnController.prototype, "loginToGoogle", null);
__decorate([
    common_1.Get('google/callback'),
    common_1.UseGuards(passport_1.AuthGuard('google')),
    common_1.UseFilters(new authentication_exception_filter_1.AuthenticationExceptionFilter()),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthnController.prototype, "getUserFromGoogle", null);
__decorate([
    common_1.Get('okta'),
    common_1.UseGuards(passport_1.AuthGuard('okta')),
    common_1.UseFilters(new authentication_exception_filter_1.AuthenticationExceptionFilter()),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthnController.prototype, "loginToOkta", null);
__decorate([
    common_1.Get('okta/callback'),
    common_1.UseGuards(passport_1.AuthGuard('okta')),
    common_1.UseFilters(new authentication_exception_filter_1.AuthenticationExceptionFilter()),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthnController.prototype, "getUserFromOkta", null);
__decorate([
    common_1.Get('oidc'),
    common_1.UseGuards(passport_1.AuthGuard('oidc')),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthnController.prototype, "loginToOIDC", null);
__decorate([
    common_1.Get('oidc/callback'),
    common_1.UseGuards(passport_1.AuthGuard('oidc')),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthnController.prototype, "getUserFromOIDC", null);
AuthnController = __decorate([
    common_1.Controller('authn'),
    __metadata("design:paramtypes", [authn_service_1.AuthnService])
], AuthnController);
exports.AuthnController = AuthnController;
//# sourceMappingURL=authn.controller.js.map