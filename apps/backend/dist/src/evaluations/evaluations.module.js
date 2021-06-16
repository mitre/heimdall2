"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationsModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const config_module_1 = require("../config/config.module");
const database_module_1 = require("../database/database.module");
const evaluation_tag_model_1 = require("../evaluation-tags/evaluation-tag.model");
const group_evaluation_model_1 = require("../group-evaluations/group-evaluation.model");
const group_user_model_1 = require("../group-users/group-user.model");
const group_model_1 = require("../groups/group.model");
const groups_service_1 = require("../groups/groups.service");
const user_model_1 = require("../users/user.model");
const users_service_1 = require("../users/users.service");
const evaluation_model_1 = require("./evaluation.model");
const evaluations_controller_1 = require("./evaluations.controller");
const evaluations_service_1 = require("./evaluations.service");
let EvaluationsModule = class EvaluationsModule {
};
EvaluationsModule = __decorate([
    common_1.Module({
        imports: [
            sequelize_1.SequelizeModule.forFeature([
                evaluation_model_1.Evaluation,
                evaluation_tag_model_1.EvaluationTag,
                user_model_1.User,
                group_model_1.Group,
                group_user_model_1.GroupUser,
                group_evaluation_model_1.GroupEvaluation
            ]),
            config_module_1.ConfigModule,
            database_module_1.DatabaseModule
        ],
        providers: [evaluations_service_1.EvaluationsService, users_service_1.UsersService, groups_service_1.GroupsService],
        controllers: [evaluations_controller_1.EvaluationsController],
        exports: [evaluations_service_1.EvaluationsService]
    })
], EvaluationsModule);
exports.EvaluationsModule = EvaluationsModule;
//# sourceMappingURL=evaluations.module.js.map