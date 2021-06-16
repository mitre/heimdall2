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
exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const sequelize_2 = require("sequelize");
const group_model_1 = require("./group.model");
let GroupsService = class GroupsService {
    constructor(groupModel) {
        this.groupModel = groupModel;
    }
    async findAll() {
        return this.groupModel.findAll({ include: 'users' });
    }
    async count() {
        return this.groupModel.count();
    }
    async findByPkBang(id) {
        const group = await this.groupModel.findByPk(id, { include: 'users' });
        if (group === null) {
            throw new common_1.NotFoundException('Group with given id not found');
        }
        else {
            return group;
        }
    }
    async findByIds(id) {
        return this.groupModel.findAll({
            where: { id: { [sequelize_2.Op.in]: id } },
            include: 'users'
        });
    }
    async addUserToGroup(group, user, role) {
        await group.$add('user', user, {
            through: { role: role, createdAt: new Date(), updatedAt: new Date() }
        });
    }
    async removeUserFromGroup(group, user) {
        const owners = (await group.$get('users')).filter((userOnGroup) => userOnGroup.GroupUser.role === 'owner');
        if (owners.length < 2 && owners.some((owner) => owner.id === user.id)) {
            throw new common_1.ForbiddenException('Cannot remove only group owner, please promote another user to owner first');
        }
        return group.$remove('user', user);
    }
    async addEvaluationToGroup(group, evaluation) {
        await group.$add('evaluation', evaluation, {
            through: { createdAt: new Date(), updatedAt: new Date() }
        });
    }
    async removeEvaluationFromGroup(group, evaluation) {
        return group.$remove('evaluation', evaluation);
    }
    async create(createGroupDto) {
        const group = new group_model_1.Group(createGroupDto);
        return group.save();
    }
    async update(groupToUpdate, groupDto) {
        groupToUpdate.update(groupDto);
        return groupToUpdate.save();
    }
    async remove(groupToDelete) {
        await groupToDelete.destroy();
        return groupToDelete;
    }
};
GroupsService = __decorate([
    common_1.Injectable(),
    __param(0, sequelize_1.InjectModel(group_model_1.Group)),
    __metadata("design:paramtypes", [Object])
], GroupsService);
exports.GroupsService = GroupsService;
//# sourceMappingURL=groups.service.js.map