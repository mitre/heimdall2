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
exports.StatisticsController = void 0;
const ability_1 = require("@casl/ability");
const common_1 = require("@nestjs/common");
const authz_service_1 = require("../authz/authz.service");
const casl_ability_factory_1 = require("../casl/casl-ability.factory");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const user_model_1 = require("../users/user.model");
const statistics_service_1 = require("./statistics.service");
let StatisticsController = class StatisticsController {
    constructor(statisticsService, authz) {
        this.statisticsService = statisticsService;
        this.authz = authz;
    }
    async userFindAll(request) {
        const abac = this.authz.abac.createForUser(request.user);
        ability_1.ForbiddenError.from(abac).throwUnlessCan(casl_ability_factory_1.Action.ViewStatistics, user_model_1.User);
        return this.statisticsService.getHeimdallStatistics();
    }
};
__decorate([
    common_1.Get(),
    common_1.UseGuards(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "userFindAll", null);
StatisticsController = __decorate([
    common_1.Controller('statistics'),
    __metadata("design:paramtypes", [statistics_service_1.StatisticsService,
        authz_service_1.AuthzService])
], StatisticsController);
exports.StatisticsController = StatisticsController;
//# sourceMappingURL=statistics.controller.js.map