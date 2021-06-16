"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const app_controller_1 = require("./app.controller");
const authn_module_1 = require("./authn/authn.module");
const authz_module_1 = require("./authz/authz.module");
const casl_exception_filter_1 = require("./casl/casl-exception.filter");
const config_module_1 = require("./config/config.module");
const database_module_1 = require("./database/database.module");
const evaluation_tags_module_1 = require("./evaluation-tags/evaluation-tags.module");
const evaluations_module_1 = require("./evaluations/evaluations.module");
const group_evaluations_module_1 = require("./group-evaluations/group-evaluations.module");
const group_users_module_1 = require("./group-users/group-users.module");
const groups_module_1 = require("./groups/groups.module");
const statistics_module_1 = require("./statistics/statistics.module");
const users_module_1 = require("./users/users.module");
let AppModule = class AppModule {
};
AppModule = __decorate([
    common_1.Module({
        controllers: [app_controller_1.AppController],
        imports: [
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: path_1.join(__dirname, '..', '..', '..', '..', 'dist', 'frontend')
            }),
            users_module_1.UsersModule,
            database_module_1.DatabaseModule,
            config_module_1.ConfigModule,
            authz_module_1.AuthzModule,
            authn_module_1.AuthnModule,
            evaluation_tags_module_1.EvaluationTagsModule,
            evaluations_module_1.EvaluationsModule,
            group_evaluations_module_1.GroupEvaluationsModule,
            groups_module_1.GroupsModule,
            group_users_module_1.GroupUsersModule,
            statistics_module_1.StatisticsModule
        ],
        providers: [
            {
                provide: core_1.APP_FILTER,
                useClass: casl_exception_filter_1.CaslExceptionFilter
            }
        ]
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map