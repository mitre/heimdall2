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
exports.GroupsController = void 0;
const ability_1 = require("@casl/ability");
const common_1 = require("@nestjs/common");
const authz_service_1 = require("../authz/authz.service");
const casl_ability_factory_1 = require("../casl/casl-ability.factory");
const evaluations_service_1 = require("../evaluations/evaluations.service");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const user_model_1 = require("../users/user.model");
const users_service_1 = require("../users/users.service");
const add_user_to_group_dto_1 = require("./dto/add-user-to-group.dto");
const create_group_dto_1 = require("./dto/create-group.dto");
const evaluation_group_dto_1 = require("./dto/evaluation-group.dto");
const group_dto_1 = require("./dto/group.dto");
const remove_user_from_group_dto_1 = require("./dto/remove-user-from-group.dto");
const groups_service_1 = require("./groups.service");
let GroupsController = class GroupsController {
    constructor(groupsService, usersService, evaluationsService, authz) {
        this.groupsService = groupsService;
        this.usersService = usersService;
        this.evaluationsService = evaluationsService;
        this.authz = authz;
    }
    async findAll(request) {
        const abac = this.authz.abac.createForUser(request.user);
        let groups = await this.groupsService.findAll();
        groups = groups.filter((group) => abac.can(casl_ability_factory_1.Action.Read, group));
        return groups.map((group) => new group_dto_1.GroupDto(group));
    }
    async findForUser(request) {
        const groups = await request.user.$get('groups', { include: [user_model_1.User] });
        return groups.map((group) => new group_dto_1.GroupDto(group));
    }
    async create(request, createGroupDto) {
        const group = await this.groupsService.create(createGroupDto);
        await this.groupsService.addUserToGroup(group, request.user, 'owner');
        return new group_dto_1.GroupDto(group, 'owner');
    }
    async addUserToGroup(id, request, addUserToGroupDto) {
        const abac = this.authz.abac.createForUser(request.user);
        const group = await this.groupsService.findByPkBang(id);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.Update, group);
        const userToAdd = await this.usersService.findById(addUserToGroupDto.userId);
        await this.groupsService.addUserToGroup(group, userToAdd, addUserToGroupDto.groupRole);
        return new group_dto_1.GroupDto(group);
    }
    async removeUserFromGroup(id, request, removeUserFromGroupDto) {
        const abac = this.authz.abac.createForUser(request.user);
        const group = await this.groupsService.findByPkBang(id);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.Update, group);
        const userToRemove = await this.usersService.findById(removeUserFromGroupDto.userId);
        return new group_dto_1.GroupDto(await this.groupsService.removeUserFromGroup(group, userToRemove));
    }
    async addEvaluationToGroup(id, request, evaluationGroupDto) {
        const abac = this.authz.abac.createForUser(request.user);
        const group = await this.groupsService.findByPkBang(id);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.AddEvaluation, group);
        const evaluationToAdd = await this.evaluationsService.findById(evaluationGroupDto.id);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.Read, evaluationToAdd);
        await this.groupsService.addEvaluationToGroup(group, evaluationToAdd);
        return new group_dto_1.GroupDto(group);
    }
    async removeEvaluationFromGroup(id, request, evaluationGroupDto) {
        const abac = this.authz.abac.createForUser(request.user);
        const group = await this.groupsService.findByPkBang(id);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.RemoveEvaluation, group);
        const evaluationToRemove = await this.evaluationsService.findById(evaluationGroupDto.id);
        return new group_dto_1.GroupDto(await this.groupsService.removeEvaluationFromGroup(group, evaluationToRemove));
    }
    async findById(request, id) {
        const abac = this.authz.abac.createForUser(request.user);
        const group = await this.groupsService.findByPkBang(id);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.Read, group);
        return new group_dto_1.GroupDto(group, 'owner');
    }
    async update(request, id, updateGroup) {
        const abac = this.authz.abac.createForUser(request.user);
        const groupToUpdate = await this.groupsService.findByPkBang(id);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.Update, groupToUpdate);
        return new group_dto_1.GroupDto(await this.groupsService.update(groupToUpdate, updateGroup));
    }
    async remove(request, id) {
        const abac = this.authz.abac.createForUser(request.user);
        const groupToDelete = await this.groupsService.findByPkBang(id);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.Delete, groupToDelete);
        return new group_dto_1.GroupDto(await this.groupsService.remove(groupToDelete));
    }
};
__decorate([
    common_1.Get(),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "findAll", null);
__decorate([
    common_1.Get('/my'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "findForUser", null);
__decorate([
    common_1.Post(),
    __param(0, common_1.Request()),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_group_dto_1.CreateGroupDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "create", null);
__decorate([
    common_1.Post('/:id/user'),
    __param(0, common_1.Param('id')),
    __param(1, common_1.Request()),
    __param(2, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, add_user_to_group_dto_1.AddUserToGroupDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "addUserToGroup", null);
__decorate([
    common_1.Delete('/:id/user'),
    __param(0, common_1.Param('id')),
    __param(1, common_1.Request()),
    __param(2, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, remove_user_from_group_dto_1.RemoveUserFromGroupDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "removeUserFromGroup", null);
__decorate([
    common_1.Post('/:id/evaluation'),
    __param(0, common_1.Param('id')),
    __param(1, common_1.Request()),
    __param(2, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, evaluation_group_dto_1.EvaluationGroupDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "addEvaluationToGroup", null);
__decorate([
    common_1.Delete('/:id/evaluation'),
    __param(0, common_1.Param('id')),
    __param(1, common_1.Request()),
    __param(2, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, evaluation_group_dto_1.EvaluationGroupDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "removeEvaluationFromGroup", null);
__decorate([
    common_1.Get(':id'),
    __param(0, common_1.Request()),
    __param(1, common_1.Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "findById", null);
__decorate([
    common_1.Put(':id'),
    __param(0, common_1.Request()),
    __param(1, common_1.Param('id')),
    __param(2, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_group_dto_1.CreateGroupDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "update", null);
__decorate([
    common_1.Delete(':id'),
    __param(0, common_1.Request()),
    __param(1, common_1.Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "remove", null);
GroupsController = __decorate([
    common_1.Controller('groups'),
    common_1.UseGuards(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [groups_service_1.GroupsService,
        users_service_1.UsersService,
        evaluations_service_1.EvaluationsService,
        authz_service_1.AuthzService])
], GroupsController);
exports.GroupsController = GroupsController;
//# sourceMappingURL=groups.controller.js.map