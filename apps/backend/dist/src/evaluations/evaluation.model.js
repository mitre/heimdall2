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
exports.Evaluation = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const evaluation_tag_model_1 = require("../evaluation-tags/evaluation-tag.model");
const group_evaluation_model_1 = require("../group-evaluations/group-evaluation.model");
const group_model_1 = require("../groups/group.model");
const user_model_1 = require("../users/user.model");
let Evaluation = class Evaluation extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", String)
], Evaluation.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Evaluation.prototype, "filename", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.JSON),
    __metadata("design:type", Object)
], Evaluation.prototype, "data", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(false),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BOOLEAN),
    __metadata("design:type", Boolean)
], Evaluation.prototype, "public", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => user_model_1.User),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", String)
], Evaluation.prototype, "userId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => user_model_1.User),
    __metadata("design:type", user_model_1.User)
], Evaluation.prototype, "user", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Evaluation.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Evaluation.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => evaluation_tag_model_1.EvaluationTag),
    __metadata("design:type", Array)
], Evaluation.prototype, "evaluationTags", void 0);
__decorate([
    sequelize_typescript_1.BelongsToMany(() => group_model_1.Group, () => group_evaluation_model_1.GroupEvaluation),
    __metadata("design:type", Array)
], Evaluation.prototype, "groups", void 0);
Evaluation = __decorate([
    sequelize_typescript_1.Table
], Evaluation);
exports.Evaluation = Evaluation;
//# sourceMappingURL=evaluation.model.js.map