"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationDto = void 0;
const evaluation_tag_dto_1 = require("../../evaluation-tags/dto/evaluation-tag.dto");
class EvaluationDto {
    constructor(evaluation, editable = false, shareURL = undefined) {
        this.id = evaluation.id;
        this.filename = evaluation.filename;
        this.data = evaluation.data;
        if (evaluation.evaluationTags === null ||
            evaluation.evaluationTags === undefined) {
            this.evaluationTags = [];
        }
        else {
            this.evaluationTags = evaluation.evaluationTags.map((tag) => new evaluation_tag_dto_1.EvaluationTagDto(tag));
        }
        this.userId = evaluation.userId;
        this.public = evaluation.public;
        this.createdAt = evaluation.createdAt;
        this.updatedAt = evaluation.updatedAt;
        this.editable = editable;
        this.shareURL = shareURL;
    }
}
exports.EvaluationDto = EvaluationDto;
//# sourceMappingURL=evaluation.dto.js.map