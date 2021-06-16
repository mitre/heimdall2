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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationsController = void 0;
const ability_1 = require("@casl/ability");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const lodash_1 = __importDefault(require("lodash"));
const authz_service_1 = require("../authz/authz.service");
const casl_ability_factory_1 = require("../casl/casl-ability.factory");
const config_service_1 = require("../config/config.service");
const group_dto_1 = require("../groups/dto/group.dto");
const groups_service_1 = require("../groups/groups.service");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const create_evaluation_interceptor_1 = require("../interceptors/create-evaluation-interceptor");
const create_evaluation_dto_1 = require("./dto/create-evaluation.dto");
const evaluation_dto_1 = require("./dto/evaluation.dto");
const update_evaluation_dto_1 = require("./dto/update-evaluation.dto");
const evaluations_service_1 = require("./evaluations.service");
let EvaluationsController = class EvaluationsController {
    constructor(evaluationsService, groupsService, configService, authz) {
        this.evaluationsService = evaluationsService;
        this.groupsService = groupsService;
        this.configService = configService;
        this.authz = authz;
    }
    async findById(id, request) {
        const abac = this.authz.abac.createForUser(request.user);
        const evaluation = await this.evaluationsService.findById(id);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.Read, evaluation);
        return new evaluation_dto_1.EvaluationDto(evaluation, abac.can(casl_ability_factory_1.Action.Update, evaluation));
    }
    async groupsForEvaluation(id, request) {
        const abac = this.authz.abac.createForUser(request.user);
        let evaluationGroups = await this.evaluationsService.groups(id);
        evaluationGroups = evaluationGroups.filter((group) => abac.can(casl_ability_factory_1.Action.AddEvaluation, group) &&
            abac.can(casl_ability_factory_1.Action.RemoveEvaluation, group));
        return evaluationGroups.map((group) => new group_dto_1.GroupDto(group));
    }
    async findAll(request) {
        const abac = this.authz.abac.createForUser(request.user);
        let evaluations = await this.evaluationsService.findAll();
        evaluations = evaluations.filter((evaluation) => abac.can(casl_ability_factory_1.Action.Read, evaluation));
        return evaluations.map((evaluation) => new evaluation_dto_1.EvaluationDto(evaluation, abac.can(casl_ability_factory_1.Action.Update, evaluation)));
    }
    async create(createEvaluationDto, data, request) {
        const serializedDta = JSON.parse(data.buffer.toString('utf8'));
        let groups = createEvaluationDto.groups
            ? await this.groupsService.findByIds(createEvaluationDto.groups)
            : [];
        const abac = this.authz.abac.createForUser(request.user);
        groups = groups.filter((group) => {
            return abac.can(casl_ability_factory_1.Action.AddEvaluation, group);
        });
        const evaluation = await this.evaluationsService
            .create({
            filename: createEvaluationDto.filename,
            evaluationTags: createEvaluationDto.evaluationTags || [],
            public: createEvaluationDto.public,
            data: serializedDta,
            userId: request.user.id
        })
            .then((createdEvaluation) => {
            groups.forEach((group) => this.groupsService.addEvaluationToGroup(group, createdEvaluation));
            return createdEvaluation;
        });
        const createdDto = new evaluation_dto_1.EvaluationDto(evaluation, true, `${this.configService.get('EXTERNAL_URL') || ''}/results/${evaluation.id}`);
        return lodash_1.default.omit(createdDto, 'data');
    }
    async update(id, request, updateEvaluationDto) {
        const abac = this.authz.abac.createForUser(request.user);
        const evaluationToUpdate = await this.evaluationsService.findById(id);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.Update, evaluationToUpdate);
        const updatedEvaluation = await this.evaluationsService.update(id, updateEvaluationDto);
        return new evaluation_dto_1.EvaluationDto(updatedEvaluation, abac.can(casl_ability_factory_1.Action.Update, updatedEvaluation));
    }
    async remove(id, request) {
        const abac = this.authz.abac.createForUser(request.user);
        const evaluationToDelete = await this.evaluationsService.findById(id);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.Delete, evaluationToDelete);
        return new evaluation_dto_1.EvaluationDto(await this.evaluationsService.remove(id));
    }
};
__decorate([
    common_1.Get(':id'),
    __param(0, common_1.Param('id')),
    __param(1, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationsController.prototype, "findById", null);
__decorate([
    common_1.Get(':id/groups'),
    __param(0, common_1.Param('id')),
    __param(1, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationsController.prototype, "groupsForEvaluation", null);
__decorate([
    common_1.Get(),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationsController.prototype, "findAll", null);
__decorate([
    common_1.Post(),
    common_1.UseInterceptors(platform_express_1.FileInterceptor('data'), create_evaluation_interceptor_1.CreateEvaluationInterceptor),
    __param(0, common_1.Body()),
    __param(1, common_1.UploadedFile()),
    __param(2, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_evaluation_dto_1.CreateEvaluationDto, Object, Object]),
    __metadata("design:returntype", Promise)
], EvaluationsController.prototype, "create", null);
__decorate([
    common_1.Put(':id'),
    __param(0, common_1.Param('id')),
    __param(1, common_1.Request()),
    __param(2, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_evaluation_dto_1.UpdateEvaluationDto]),
    __metadata("design:returntype", Promise)
], EvaluationsController.prototype, "update", null);
__decorate([
    common_1.Delete(':id'),
    __param(0, common_1.Param('id')),
    __param(1, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationsController.prototype, "remove", null);
EvaluationsController = __decorate([
    common_1.Controller('evaluations'),
    common_1.UseGuards(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [evaluations_service_1.EvaluationsService,
        groups_service_1.GroupsService,
        config_service_1.ConfigService,
        authz_service_1.AuthzService])
], EvaluationsController);
exports.EvaluationsController = EvaluationsController;
//# sourceMappingURL=evaluations.controller.js.map