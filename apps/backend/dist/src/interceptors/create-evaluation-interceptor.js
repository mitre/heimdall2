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
exports.CreateEvaluationInterceptor = void 0;
const common_1 = require("@nestjs/common");
const create_evaluation_tag_dto_1 = require("../evaluation-tags/dto/create-evaluation-tag.dto");
const groups_service_1 = require("../groups/groups.service");
let CreateEvaluationInterceptor = class CreateEvaluationInterceptor {
    constructor(groupsService) {
        this.groupsService = groupsService;
    }
    intercept(_context, next) {
        const request = _context.switchToHttp().getRequest();
        if (request.body.public) {
            request.body.public = [true, 'true'].includes(request.body.public);
        }
        if (request.body.evaluationTags !== undefined &&
            request.body.evaluationTags !== '') {
            request.body.evaluationTags = request.body.evaluationTags
                .split(',')
                .map((evaluationTag) => new create_evaluation_tag_dto_1.CreateEvaluationTagDto(evaluationTag));
        }
        else {
            request.body.evaluationTags = [];
        }
        if (request.body.groups !== undefined) {
            request.body.groups = request.body.groups.split(',');
        }
        return next.handle();
    }
};
CreateEvaluationInterceptor = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [groups_service_1.GroupsService])
], CreateEvaluationInterceptor);
exports.CreateEvaluationInterceptor = CreateEvaluationInterceptor;
//# sourceMappingURL=create-evaluation-interceptor.js.map