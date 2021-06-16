"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupsModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const authz_module_1 = require("../authz/authz.module");
const evaluation_tags_module_1 = require("../evaluation-tags/evaluation-tags.module");
const evaluations_module_1 = require("../evaluations/evaluations.module");
const users_module_1 = require("../users/users.module");
const group_model_1 = require("./group.model");
const groups_controller_1 = require("./groups.controller");
const groups_service_1 = require("./groups.service");
let GroupsModule = class GroupsModule {
};
GroupsModule = __decorate([
    common_1.Module({
        imports: [
            sequelize_1.SequelizeModule.forFeature([group_model_1.Group]),
            authz_module_1.AuthzModule,
            users_module_1.UsersModule,
            evaluations_module_1.EvaluationsModule,
            evaluation_tags_module_1.EvaluationTagsModule
        ],
        providers: [groups_service_1.GroupsService],
        controllers: [groups_controller_1.GroupsController],
        exports: [groups_service_1.GroupsService]
    })
], GroupsModule);
exports.GroupsModule = GroupsModule;
//# sourceMappingURL=groups.module.js.map