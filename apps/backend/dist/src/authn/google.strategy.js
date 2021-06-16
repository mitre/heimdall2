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
exports.GoogleStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_google_oauth_1 = require("passport-google-oauth");
const config_service_1 = require("../config/config.service");
const authn_service_1 = require("./authn.service");
let GoogleStrategy = class GoogleStrategy extends passport_1.PassportStrategy(passport_google_oauth_1.OAuth2Strategy, 'google') {
    constructor(authnService, configService) {
        super({
            clientID: configService.get('GOOGLE_CLIENTID') || 'disabled',
            clientSecret: configService.get('GOOGLE_CLIENTSECRET') || 'disabled',
            callbackURL: `${configService.get('EXTERNAL_URL')}/authn/google/callback` ||
                'disabled',
            scope: ['email', 'profile']
        });
        this.authnService = authnService;
        this.configService = configService;
    }
    async validate(accessToken, refreshToken, profile) {
        const { name, emails } = profile;
        const user = {
            email: emails[0],
            firstName: name.givenName,
            lastName: name.familyName
        };
        if (user.email.verified) {
            return this.authnService.validateOrCreateUser(user.email.value, user.firstName, user.lastName, 'google');
        }
        else {
            throw new common_1.UnauthorizedException('Please verify your email with Google before logging into Heimdall.');
        }
    }
};
GoogleStrategy = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [authn_service_1.AuthnService,
        config_service_1.ConfigService])
], GoogleStrategy);
exports.GoogleStrategy = GoogleStrategy;
//# sourceMappingURL=google.strategy.js.map