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
exports.EvaluationTag = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const evaluation_model_1 = require("../evaluations/evaluation.model");
let EvaluationTag = class EvaluationTag extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", String)
], EvaluationTag.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], EvaluationTag.prototype, "value", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], EvaluationTag.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], EvaluationTag.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => evaluation_model_1.Evaluation),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", String)
], EvaluationTag.prototype, "evaluationId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => evaluation_model_1.Evaluation),
    __metadata("design:type", evaluation_model_1.Evaluation)
], EvaluationTag.prototype, "evaluation", void 0);
EvaluationTag = __decorate([
    sequelize_typescript_1.Table
], EvaluationTag);
exports.EvaluationTag = EvaluationTag;
//# sourceMappingURL=evaluation-tag.model.js.map