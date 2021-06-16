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
exports.Group = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const evaluation_model_1 = require("../evaluations/evaluation.model");
const group_evaluation_model_1 = require("../group-evaluations/group-evaluation.model");
const group_user_model_1 = require("../group-users/group-user.model");
const user_model_1 = require("../users/user.model");
let Group = class Group extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", String)
], Group.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.Unique,
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING),
    __metadata("design:type", String)
], Group.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(false),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BOOLEAN),
    __metadata("design:type", Boolean)
], Group.prototype, "public", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.DATE),
    __metadata("design:type", Date)
], Group.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.DATE),
    __metadata("design:type", Date)
], Group.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.BelongsToMany(() => user_model_1.User, () => group_user_model_1.GroupUser),
    __metadata("design:type", Array)
], Group.prototype, "users", void 0);
__decorate([
    sequelize_typescript_1.BelongsToMany(() => evaluation_model_1.Evaluation, () => group_evaluation_model_1.GroupEvaluation),
    __metadata("design:type", Array)
], Group.prototype, "evaluations", void 0);
Group = __decorate([
    sequelize_typescript_1.Table
], Group);
exports.Group = Group;
//# sourceMappingURL=group.model.js.map