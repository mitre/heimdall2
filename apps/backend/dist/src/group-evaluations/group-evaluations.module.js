"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupEvaluationsModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const group_evaluation_model_1 = require("./group-evaluation.model");
let GroupEvaluationsModule = class GroupEvaluationsModule {
};
GroupEvaluationsModule = __decorate([
    common_1.Module({
        imports: [sequelize_1.SequelizeModule.forFeature([group_evaluation_model_1.GroupEvaluation])]
    })
], GroupEvaluationsModule);
exports.GroupEvaluationsModule = GroupEvaluationsModule;
//# sourceMappingURL=group-evaluations.module.js.map