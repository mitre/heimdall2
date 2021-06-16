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
exports.UsersController = void 0;
const ability_1 = require("@casl/ability");
const common_1 = require("@nestjs/common");
const authz_service_1 = require("../authz/authz.service");
const casl_ability_factory_1 = require("../casl/casl-ability.factory");
const config_service_1 = require("../config/config.service");
const unique_constraint_error_filter_1 = require("../filters/unique-constraint-error.filter");
const implicit_allow_jwt_auth_guard_1 = require("../guards/implicit-allow-jwt-auth.guard");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const test_guard_1 = require("../guards/test.guard");
const password_change_pipe_1 = require("../pipes/password-change.pipe");
const password_complexity_pipe_1 = require("../pipes/password-complexity.pipe");
const passwords_match_pipe_1 = require("../pipes/passwords-match.pipe");
const user_model_1 = require("../users/user.model");
const create_user_dto_1 = require("./dto/create-user.dto");
const delete_user_dto_1 = require("./dto/delete-user.dto");
const slim_user_dto_1 = require("./dto/slim-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const user_dto_1 = require("./dto/user.dto");
const users_service_1 = require("./users.service");
let UsersController = class UsersController {
    constructor(usersService, configService, authz) {
        this.usersService = usersService;
        this.configService = configService;
        this.authz = authz;
    }
    async userFindAll(request) {
        const abac = this.authz.abac.createForUser(request.user);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.ReadSlim, user_model_1.User);
        const users = await this.usersService.userFindAll();
        return users.map((user) => new slim_user_dto_1.SlimUserDto(user));
    }
    async findById(id, request) {
        const user = await this.usersService.findById(id);
        const abac = this.authz.abac.createForUser(request.user);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.Read, user);
        return new user_dto_1.UserDto(user);
    }
    async adminFindAll(request) {
        const abac = this.authz.abac.createForUser(request.user);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.ReadAll, user_model_1.User);
        const users = await this.usersService.adminFindAll();
        return users.map((user) => new user_dto_1.UserDto(user));
    }
    async create(createUserDto, request) {
        const abac = request.user
            ? this.authz.abac.createForUser(request.user)
            : this.authz.abac.createForAnonymous();
        if (!this.configService.isRegistrationAllowed()) {
            ability_1.ForbiddenError.from(abac)
                .setMessage('User registration is disabled. Please ask your system administrator to create the account.')
                .throwUnlessCan(casl_ability_factory_1.Action.ForceRegistration, user_model_1.User);
        }
        return new user_dto_1.UserDto(await this.usersService.create(createUserDto));
    }
    async update(id, request, updateUserDto) {
        const abac = this.authz.abac.createForUser(request.user);
        const userToUpdate = await this.usersService.findByPkBang(id);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.Update, userToUpdate);
        return new user_dto_1.UserDto(await this.usersService.update(userToUpdate, updateUserDto, abac));
    }
    async remove(id, request, deleteUserDto) {
        const abac = this.authz.abac.createForUser(request.user);
        const userToDelete = await this.usersService.findByPkBang(id);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.Delete, userToDelete);
        return new user_dto_1.UserDto(await this.usersService.remove(userToDelete, deleteUserDto, abac));
    }
    async clear() {
        user_model_1.User.destroy({ where: {} });
    }
};
__decorate([
    common_1.Get('/user-find-all'),
    common_1.UseGuards(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "userFindAll", null);
__decorate([
    common_1.UseGuards(jwt_auth_guard_1.JwtAuthGuard),
    common_1.Get(':id'),
    __param(0, common_1.Param('id')),
    __param(1, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findById", null);
__decorate([
    common_1.Get(),
    common_1.UseGuards(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "adminFindAll", null);
__decorate([
    common_1.Post(),
    common_1.UsePipes(new passwords_match_pipe_1.PasswordsMatchPipe(), new password_complexity_pipe_1.PasswordComplexityPipe()),
    common_1.UseFilters(new unique_constraint_error_filter_1.UniqueConstraintErrorFilter()),
    common_1.UseGuards(implicit_allow_jwt_auth_guard_1.ImplicitAllowJwtAuthGuard),
    __param(0, common_1.Body()),
    __param(1, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    common_1.UseGuards(jwt_auth_guard_1.JwtAuthGuard),
    common_1.Put(':id'),
    __param(0, common_1.Param('id')),
    __param(1, common_1.Request()),
    __param(2, common_1.Body(new passwords_match_pipe_1.PasswordsMatchPipe(), new password_change_pipe_1.PasswordChangePipe(), new password_complexity_pipe_1.PasswordComplexityPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    common_1.UseGuards(jwt_auth_guard_1.JwtAuthGuard),
    common_1.Delete(':id'),
    __param(0, common_1.Param('id')),
    __param(1, common_1.Request()),
    __param(2, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, delete_user_dto_1.DeleteUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
__decorate([
    common_1.UseGuards(test_guard_1.TestGuard),
    common_1.Post('clear'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "clear", null);
UsersController = __decorate([
    common_1.Controller('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        config_service_1.ConfigService,
        authz_service_1.AuthzService])
], UsersController);
exports.UsersController = UsersController;
//# sourceMappingURL=users.controller.js.map