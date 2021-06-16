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
exports.EvaluationTagsService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const evaluation_model_1 = require("../evaluations/evaluation.model");
const group_model_1 = require("../groups/group.model");
const user_model_1 = require("../users/user.model");
const evaluation_tag_model_1 = require("./evaluation-tag.model");
let EvaluationTagsService = class EvaluationTagsService {
    constructor(evaluationTagModel) {
        this.evaluationTagModel = evaluationTagModel;
    }
    async findAll() {
        return this.evaluationTagModel.findAll({
            include: [
                {
                    model: evaluation_model_1.Evaluation,
                    include: [
                        {
                            model: group_model_1.Group,
                            include: [user_model_1.User]
                        }
                    ]
                }
            ]
        });
    }
    async count() {
        return this.evaluationTagModel.count();
    }
    async findById(id) {
        return this.findByPkBang(id, {
            include: [
                {
                    model: evaluation_model_1.Evaluation,
                    include: [
                        {
                            model: group_model_1.Group,
                            include: [user_model_1.User]
                        }
                    ]
                }
            ]
        });
    }
    async create(evaluationId, createEvaluationTagDto) {
        const evaluationTag = new evaluation_tag_model_1.EvaluationTag();
        evaluationTag.value = createEvaluationTagDto.value;
        evaluationTag.evaluationId = evaluationId;
        return evaluationTag.save();
    }
    async remove(id) {
        const evaluationTag = await this.findByPkBang(id, {
            include: [
                {
                    model: evaluation_model_1.Evaluation,
                    include: [
                        {
                            model: group_model_1.Group,
                            include: [user_model_1.User]
                        }
                    ]
                }
            ]
        });
        await evaluationTag.destroy();
        return evaluationTag;
    }
    async findByPkBang(identifier, options) {
        const evaluationTag = await this.evaluationTagModel.findByPk(identifier, options);
        if (evaluationTag === null) {
            throw new common_1.NotFoundException('EvaluationTag with given id not found');
        }
        else {
            return evaluationTag;
        }
    }
};
EvaluationTagsService = __decorate([
    common_1.Injectable(),
    __param(0, sequelize_1.InjectModel(evaluation_tag_model_1.EvaluationTag)),
    __metadata("design:paramtypes", [Object])
], EvaluationTagsService);
exports.EvaluationTagsService = EvaluationTagsService;
//# sourceMappingURL=evaluation-tags.service.js.map