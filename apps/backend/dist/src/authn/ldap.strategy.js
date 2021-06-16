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
exports.LDAPStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const lodash_1 = __importDefault(require("lodash"));
const passport_ldapauth_1 = __importDefault(require("passport-ldapauth"));
const config_service_1 = require("../config/config.service");
const authn_service_1 = require("./authn.service");
let LDAPStrategy = class LDAPStrategy extends passport_1.PassportStrategy(passport_ldapauth_1.default, 'ldap') {
    constructor(authnService, configService) {
        super({
            passReqToCallback: true,
            server: {
                url: `ldap://${configService.get('LDAP_HOST')}:${configService.get('LDAP_PORT') || 389}`,
                bindDN: configService.get('LDAP_BINDDN'),
                bindCredentials: configService.get('LDAP_PASSWORD'),
                searchBase: configService.get('LDAP_SEARCHBASE') || 'disabled',
                searchFilter: configService.get('LDAP_SEARCHFILTER') ||
                    '(sAMAccountName={{username}})',
                passReqToCallback: true
            }
        }, async (req, user, done) => {
            const { firstName, lastName } = this.authnService.splitName(lodash_1.default.get(user, configService.get('LDAP_NAMEFIELD') || 'name'));
            const email = lodash_1.default.get(user, configService.get('LDAP_MAILFIELD') || 'mail');
            req.user = this.authnService.validateOrCreateUser(email, firstName, lastName, 'ldap');
            return done(null, req.user);
        });
        this.authnService = authnService;
        this.configService = configService;
    }
};
LDAPStrategy = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [authn_service_1.AuthnService,
        config_service_1.ConfigService])
], LDAPStrategy);
exports.LDAPStrategy = LDAPStrategy;
//# sourceMappingURL=ldap.strategy.js.map