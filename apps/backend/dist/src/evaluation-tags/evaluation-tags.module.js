"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationTagsModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const database_module_1 = require("../database/database.module");
const evaluation_model_1 = require("../evaluations/evaluation.model");
const evaluations_service_1 = require("../evaluations/evaluations.service");
const group_model_1 = require("../groups/group.model");
const user_model_1 = require("../users/user.model");
const evaluation_tag_model_1 = require("./evaluation-tag.model");
const evaluation_tags_controller_1 = require("./evaluation-tags.controller");
const evaluation_tags_service_1 = require("./evaluation-tags.service");
let EvaluationTagsModule = class EvaluationTagsModule {
};
EvaluationTagsModule = __decorate([
    common_1.Module({
        imports: [
            sequelize_1.SequelizeModule.forFeature([evaluation_model_1.Evaluation, group_model_1.Group, user_model_1.User, evaluation_tag_model_1.EvaluationTag]),
            database_module_1.DatabaseModule
        ],
        providers: [evaluations_service_1.EvaluationsService, evaluation_tags_service_1.EvaluationTagsService],
        controllers: [evaluation_tags_controller_1.EvaluationTagsController],
        exports: [evaluation_tags_service_1.EvaluationTagsService]
    })
], EvaluationTagsModule);
exports.EvaluationTagsModule = EvaluationTagsModule;
//# sourceMappingURL=evaluation-tags.module.js.map