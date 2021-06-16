"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthnModule = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const config_module_1 = require("../config/config.module");
const token_module_1 = require("../token/token.module");
const users_module_1 = require("../users/users.module");
const authn_controller_1 = require("./authn.controller");
const authn_service_1 = require("./authn.service");
const github_strategy_1 = require("./github.strategy");
const gitlab_strategy_1 = require("./gitlab.strategy");
const google_strategy_1 = require("./google.strategy");
const jwt_strategy_1 = require("./jwt.strategy");
const ldap_strategy_1 = require("./ldap.strategy");
const local_strategy_1 = require("./local.strategy");
const oidc_strategy_1 = require("./oidc.strategy");
const okta_strategy_1 = require("./okta.strategy");
let AuthnModule = class AuthnModule {
};
AuthnModule = __decorate([
    common_1.Module({
        imports: [users_module_1.UsersModule, passport_1.PassportModule, token_module_1.TokenModule, config_module_1.ConfigModule],
        providers: [
            authn_service_1.AuthnService,
            local_strategy_1.LocalStrategy,
            jwt_strategy_1.JwtStrategy,
            github_strategy_1.GithubStrategy,
            gitlab_strategy_1.GitlabStrategy,
            google_strategy_1.GoogleStrategy,
            okta_strategy_1.OktaStrategy,
            oidc_strategy_1.OidcStrategy,
            ldap_strategy_1.LDAPStrategy
        ],
        controllers: [authn_controller_1.AuthnController]
    })
], AuthnModule);
exports.AuthnModule = AuthnModule;
//# sourceMappingURL=authn.module.js.map