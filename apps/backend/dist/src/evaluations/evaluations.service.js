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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationsService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const database_service_1 = require("../database/database.service");
const evaluation_tag_model_1 = require("../evaluation-tags/evaluation-tag.model");
const group_model_1 = require("../groups/group.model");
const user_model_1 = require("../users/user.model");
const evaluation_model_1 = require("./evaluation.model");
let EvaluationsService = class EvaluationsService {
    constructor(evaluationModel, databaseService) {
        this.evaluationModel = evaluationModel;
        this.databaseService = databaseService;
    }
    async findAll() {
        return this.evaluationModel.findAll({
            attributes: { exclude: ['data'] },
            include: [evaluation_tag_model_1.EvaluationTag, user_model_1.User, { model: group_model_1.Group, include: [user_model_1.User] }]
        });
    }
    async count() {
        return this.evaluationModel.count();
    }
    async create(evaluation) {
        return evaluation_model_1.Evaluation.create({
            ...evaluation
        }, {
            include: [evaluation_tag_model_1.EvaluationTag]
        });
    }
    async update(id, updateEvaluationDto) {
        const evaluation = await this.findByPkBang(id, {
            include: [evaluation_tag_model_1.EvaluationTag]
        });
        return evaluation.update(updateEvaluationDto);
    }
    async remove(id) {
        const evaluation = await this.findByPkBang(id, {
            include: [evaluation_tag_model_1.EvaluationTag]
        });
        await this.databaseService.sequelize.transaction(async (transaction) => {
            if (evaluation.evaluationTags !== null) {
                await Promise.all([
                    evaluation.evaluationTags.map(async (evaluationTag) => {
                        await evaluationTag.destroy({ transaction });
                    })
                ]);
            }
            return evaluation.destroy({ transaction });
        });
        return evaluation;
    }
    async findById(id) {
        return this.findByPkBang(id, {
            include: [evaluation_tag_model_1.EvaluationTag, user_model_1.User, { model: group_model_1.Group, include: [user_model_1.User] }]
        });
    }
    async groups(id) {
        return (await this.findByPkBang(id, { include: { model: group_model_1.Group, include: [user_model_1.User] } })).groups;
    }
    async findByPkBang(identifier, options) {
        const evaluation = await this.evaluationModel.findByPk(identifier, options);
        if (evaluation === null) {
            throw new common_1.NotFoundException('Evaluation with given id not found');
        }
        else {
            return evaluation;
        }
    }
};
EvaluationsService = __decorate([
    common_1.Injectable(),
    __param(0, sequelize_1.InjectModel(evaluation_model_1.Evaluation)),
    __metadata("design:paramtypes", [Object, database_service_1.DatabaseService])
], EvaluationsService);
exports.EvaluationsService = EvaluationsService;
//# sourceMappingURL=evaluations.service.js.map