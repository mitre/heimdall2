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
exports.OktaStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_openidconnect_1 = require("passport-openidconnect");
const config_service_1 = require("../config/config.service");
const authn_service_1 = require("./authn.service");
let OktaStrategy = class OktaStrategy extends passport_1.PassportStrategy(passport_openidconnect_1.Strategy, 'okta') {
    constructor(authnService, configService) {
        super({
            issuer: `https://${configService.get('OKTA_DOMAIN') || 'disabled'}/oauth2/default`,
            authorizationURL: `https://${configService.get('OKTA_DOMAIN') || 'disabled'}/oauth2/default/v1/authorize`,
            tokenURL: `https://${configService.get('OKTA_DOMAIN') || 'disabled'}/oauth2/default/v1/token`,
            userInfoURL: `https://${configService.get('OKTA_DOMAIN') || 'disabled'}/oauth2/default/v1/userinfo`,
            clientID: configService.get('OKTA_CLIENTID') || 'disabled',
            clientSecret: configService.get('OKTA_CLIENTSECRET') || 'disabled',
            callbackURL: `${configService.get('EXTERNAL_URL')}/authn/okta/callback` ||
                'disabled',
            scope: 'openid email profile',
            passReqToCallback: true
        }, (_req, _token, _tokenSecret, profile, done) => {
            const userData = profile._json;
            const { given_name, family_name, email, email_verified } = userData;
            if (email_verified) {
                const user = this.authnService.validateOrCreateUser(email, given_name, family_name, 'okta');
                return done(null, user);
            }
            else {
                throw new common_1.UnauthorizedException('Incorrect Username or Password');
            }
        });
        this.authnService = authnService;
        this.configService = configService;
    }
};
OktaStrategy = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [authn_service_1.AuthnService,
        config_service_1.ConfigService])
], OktaStrategy);
exports.OktaStrategy = OktaStrategy;
//# sourceMappingURL=okta.strategy.js.map