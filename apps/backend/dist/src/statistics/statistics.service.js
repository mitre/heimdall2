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
exports.StatisticsService = void 0;
const common_1 = require("@nestjs/common");
const evaluation_tags_service_1 = require("../evaluation-tags/evaluation-tags.service");
const evaluations_service_1 = require("../evaluations/evaluations.service");
const groups_service_1 = require("../groups/groups.service");
const users_service_1 = require("../users/users.service");
const statistics_dto_1 = require("./dto/statistics.dto");
let StatisticsService = class StatisticsService {
    constructor(evaluationsService, evaluationTagsService, groupsService, usersService) {
        this.evaluationsService = evaluationsService;
        this.evaluationTagsService = evaluationTagsService;
        this.groupsService = groupsService;
        this.usersService = usersService;
    }
    async getHeimdallStatistics() {
        return new statistics_dto_1.StatisticsDTO({
            userCount: await this.usersService.count(),
            evaluationCount: await this.evaluationsService.count(),
            evaluationTagCount: await this.evaluationTagsService.count(),
            groupCount: await this.groupsService.count()
        });
    }
};
StatisticsService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [evaluations_service_1.EvaluationsService,
        evaluation_tags_service_1.EvaluationTagsService,
        groups_service_1.GroupsService,
        users_service_1.UsersService])
], StatisticsService);
exports.StatisticsService = StatisticsService;
//# sourceMappingURL=statistics.service.js.map