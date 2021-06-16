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
exports.OidcStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_openidconnect_1 = require("passport-openidconnect");
const config_service_1 = require("../config/config.service");
const authn_service_1 = require("./authn.service");
let OidcStrategy = class OidcStrategy extends passport_1.PassportStrategy(passport_openidconnect_1.Strategy, 'oidc') {
    constructor(authnService, configService) {
        super({
            issuer: configService.get('OIDC_ISSUER') || 'disabled',
            authorizationURL: configService.get('OIDC_AUTHORIZATION_URL') || 'disabled',
            tokenURL: configService.get('OIDC_TOKEN_URL') || 'disabled',
            userInfoURL: configService.get('OIDC_USER_INFO_URL') || 'disabled',
            clientID: configService.get('OIDC_CLIENTID') || 'disabled',
            clientSecret: configService.get('OIDC_CLIENT_SECRET') || 'disabled',
            callbackURL: `${configService.get('EXTERNAL_URL')}/authn/oidc/callback`,
            scope: 'openid profile email'
        }, function (_accessToken, _refreshToken, profile, done) {
            const userData = profile._json;
            const { given_name, family_name, email, email_verified } = userData;
            if (email_verified) {
                const user = authnService.validateOrCreateUser(email, given_name, family_name, 'oidc');
                return done(null, user);
            }
            else {
                throw new common_1.UnauthorizedException('Please verify your email with your identity provider before logging into Heimdall.');
            }
        });
        this.authnService = authnService;
        this.configService = configService;
    }
};
OidcStrategy = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [authn_service_1.AuthnService,
        config_service_1.ConfigService])
], OidcStrategy);
exports.OidcStrategy = OidcStrategy;
//# sourceMappingURL=oidc.strategy.js.map