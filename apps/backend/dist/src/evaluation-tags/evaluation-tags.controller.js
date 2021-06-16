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
exports.EvaluationTagsController = void 0;
const ability_1 = require("@casl/ability");
const common_1 = require("@nestjs/common");
const authz_service_1 = require("../authz/authz.service");
const casl_ability_factory_1 = require("../casl/casl-ability.factory");
const evaluations_service_1 = require("../evaluations/evaluations.service");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const create_evaluation_tag_dto_1 = require("./dto/create-evaluation-tag.dto");
const evaluation_tag_dto_1 = require("./dto/evaluation-tag.dto");
const evaluation_tags_service_1 = require("./evaluation-tags.service");
let EvaluationTagsController = class EvaluationTagsController {
    constructor(evaluationTagsService, evaluationsService, authz) {
        this.evaluationTagsService = evaluationTagsService;
        this.evaluationsService = evaluationsService;
        this.authz = authz;
    }
    async index(request) {
        const abac = this.authz.abac.createForUser(request.user);
        let evaluationTags = await this.evaluationTagsService.findAll();
        evaluationTags = evaluationTags.filter((evaluationTag) => abac.can(casl_ability_factory_1.Action.Read, evaluationTag.evaluation));
        return evaluationTags.map((evaluationTag) => new evaluation_tag_dto_1.EvaluationTagDto(evaluationTag));
    }
    async findById(id, request) {
        const abac = this.authz.abac.createForUser(request.user);
        const evaluationTag = await this.evaluationTagsService.findById(id);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.Read, evaluationTag.evaluation);
        return new evaluation_tag_dto_1.EvaluationTagDto(evaluationTag);
    }
    async create(evaluationId, createEvaluationTagDto, request) {
        const abac = this.authz.abac.createForUser(request.user);
        const evaluation = await this.evaluationsService.findById(evaluationId);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.Update, evaluation);
        return new evaluation_tag_dto_1.EvaluationTagDto(await this.evaluationTagsService.create(evaluationId, createEvaluationTagDto));
    }
    async remove(id, request) {
        const abac = this.authz.abac.createForUser(request.user);
        const evaluationTag = await this.evaluationTagsService.findById(id);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.Delete, evaluationTag.evaluation);
        return new evaluation_tag_dto_1.EvaluationTagDto(await this.evaluationTagsService.remove(id));
    }
};
__decorate([
    common_1.Get(),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationTagsController.prototype, "index", null);
__decorate([
    common_1.Get(':id'),
    __param(0, common_1.Param('id')),
    __param(1, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationTagsController.prototype, "findById", null);
__decorate([
    common_1.Post(':evaluationId'),
    __param(0, common_1.Param('evaluationId')),
    __param(1, common_1.Body()),
    __param(2, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_evaluation_tag_dto_1.CreateEvaluationTagDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationTagsController.prototype, "create", null);
__decorate([
    common_1.Delete(':id'),
    __param(0, common_1.Param('id')),
    __param(1, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationTagsController.prototype, "remove", null);
EvaluationTagsController = __decorate([
    common_1.Controller('evaluation-tags'),
    common_1.UseGuards(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [evaluation_tags_service_1.EvaluationTagsService,
        evaluations_service_1.EvaluationsService,
        authz_service_1.AuthzService])
], EvaluationTagsController);
exports.EvaluationTagsController = EvaluationTagsController;
//# sourceMappingURL=evaluation-tags.controller.js.map