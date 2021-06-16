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
exports.GroupEvaluation = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const evaluation_model_1 = require("../evaluations/evaluation.model");
const group_model_1 = require("../groups/group.model");
let GroupEvaluation = class GroupEvaluation extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", String)
], GroupEvaluation.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => group_model_1.Group),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", String)
], GroupEvaluation.prototype, "groupId", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => evaluation_model_1.Evaluation),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", String)
], GroupEvaluation.prototype, "evaluationId", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.DATE),
    __metadata("design:type", Date)
], GroupEvaluation.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.DATE),
    __metadata("design:type", Date)
], GroupEvaluation.prototype, "updatedAt", void 0);
GroupEvaluation = __decorate([
    sequelize_typescript_1.Table
], GroupEvaluation);
exports.GroupEvaluation = GroupEvaluation;
//# sourceMappingURL=group-evaluation.model.js.map