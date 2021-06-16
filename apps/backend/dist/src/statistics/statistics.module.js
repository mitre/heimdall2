"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const database_service_1 = require("../database/database.service");
const evaluation_tag_model_1 = require("../evaluation-tags/evaluation-tag.model");
const evaluation_tags_service_1 = require("../evaluation-tags/evaluation-tags.service");
const evaluation_model_1 = require("../evaluations/evaluation.model");
const evaluations_service_1 = require("../evaluations/evaluations.service");
const group_model_1 = require("../groups/group.model");
const groups_service_1 = require("../groups/groups.service");
const user_model_1 = require("../users/user.model");
const users_service_1 = require("../users/users.service");
const statistics_controller_1 = require("./statistics.controller");
const statistics_service_1 = require("./statistics.service");
let StatisticsModule = class StatisticsModule {
};
StatisticsModule = __decorate([
    common_1.Module({
        imports: [
            sequelize_1.SequelizeModule.forFeature([evaluation_model_1.Evaluation, evaluation_tag_model_1.EvaluationTag, user_model_1.User, group_model_1.Group])
        ],
        providers: [
            statistics_service_1.StatisticsService,
            database_service_1.DatabaseService,
            evaluations_service_1.EvaluationsService,
            evaluation_tags_service_1.EvaluationTagsService,
            users_service_1.UsersService,
            groups_service_1.GroupsService
        ],
        controllers: [statistics_controller_1.StatisticsController]
    })
], StatisticsModule);
exports.StatisticsModule = StatisticsModule;
//# sourceMappingURL=statistics.module.js.map