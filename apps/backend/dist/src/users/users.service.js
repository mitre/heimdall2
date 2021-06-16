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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const bcryptjs_1 = require("bcryptjs");
const casl_ability_factory_1 = require("../casl/casl-ability.factory");
const user_model_1 = require("./user.model");
let UsersService = class UsersService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    async adminFindAll() {
        return this.userModel.findAll();
    }
    async userFindAll() {
        return this.userModel.findAll({
            attributes: ['id', 'email', 'title', 'firstName', 'lastName']
        });
    }
    async count() {
        return this.userModel.count();
    }
    async findById(id) {
        return this.findByPkBang(id);
    }
    async findByEmail(email) {
        return this.findOneBang({
            where: {
                email
            }
        });
    }
    async create(createUserDto) {
        const user = new user_model_1.User();
        user.email = createUserDto.email;
        user.firstName = createUserDto.firstName || undefined;
        user.lastName = createUserDto.lastName || undefined;
        user.title = createUserDto.title || undefined;
        user.organization = createUserDto.organization || undefined;
        user.role = createUserDto.role;
        user.creationMethod = createUserDto.creationMethod;
        try {
            user.encryptedPassword = await bcryptjs_1.hash(createUserDto.password, 14);
        }
        catch {
            throw new common_1.BadRequestException();
        }
        return user.save();
    }
    async update(userToUpdate, updateUserDto, abac) {
        if (!abac.can('update-no-password', userToUpdate)) {
            await this.testPassword(updateUserDto, userToUpdate);
        }
        if (updateUserDto.password == null &&
            userToUpdate.forcePasswordChange &&
            !abac.can('skip-force-password-change', userToUpdate)) {
            throw new common_1.BadRequestException('You must change your password');
        }
        else if (updateUserDto.password) {
            userToUpdate.encryptedPassword = await bcryptjs_1.hash(updateUserDto.password, 14);
            userToUpdate.passwordChangedAt = new Date();
            userToUpdate.forcePasswordChange = false;
        }
        userToUpdate.email = updateUserDto.email || userToUpdate.email;
        userToUpdate.firstName = updateUserDto.firstName || userToUpdate.firstName;
        userToUpdate.lastName = updateUserDto.lastName || userToUpdate.lastName;
        userToUpdate.title = updateUserDto.title || userToUpdate.title;
        userToUpdate.organization =
            updateUserDto.organization || userToUpdate.organization;
        if (abac.can('update-role', userToUpdate)) {
            userToUpdate.role = updateUserDto.role || userToUpdate.role;
        }
        userToUpdate.forcePasswordChange =
            updateUserDto.forcePasswordChange || userToUpdate.forcePasswordChange;
        return userToUpdate.save();
    }
    async updateLoginMetadata(user) {
        user.lastLogin = new Date();
        user.loginCount++;
        await user.save();
    }
    async remove(userToDelete, deleteUserDto, abac) {
        if (abac.cannot(casl_ability_factory_1.Action.DeleteNoPassword, userToDelete)) {
            try {
                if (!(await bcryptjs_1.compare(deleteUserDto.password || '', userToDelete.encryptedPassword))) {
                    throw new common_1.ForbiddenException();
                }
            }
            catch {
                throw new common_1.ForbiddenException('Password was incorrect, could not delete account');
            }
        }
        const adminCount = await this.userModel.count({ where: { role: 'admin' } });
        if (userToDelete.role === 'admin' && adminCount < 2) {
            throw new common_1.ForbiddenException('Cannot destroy only administrator account, please promote another user to administrator first');
        }
        await userToDelete.destroy();
        return userToDelete;
    }
    async findByPkBang(identifier) {
        const user = await this.userModel.findByPk(identifier);
        if (user === null) {
            throw new common_1.NotFoundException('User with given id not found');
        }
        else {
            return user;
        }
    }
    async findOneBang(options) {
        const user = await this.userModel.findOne(options);
        if (user === null) {
            throw new common_1.NotFoundException('User with given id not found');
        }
        else {
            return user;
        }
    }
    async testPassword(updateUserDto, user) {
        try {
            if (!(await bcryptjs_1.compare(updateUserDto.currentPassword || '', user.encryptedPassword))) {
                throw new common_1.ForbiddenException('Current password is incorrect');
            }
        }
        catch {
            throw new common_1.ForbiddenException('Current password is incorrect');
        }
    }
};
UsersService = __decorate([
    common_1.Injectable(),
    __param(0, sequelize_1.InjectModel(user_model_1.User)),
    __metadata("design:paramtypes", [Object])
], UsersService);
exports.UsersService = UsersService;
//# sourceMappingURL=users.service.js.map