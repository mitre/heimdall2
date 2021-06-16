"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationTagDto = void 0;
class EvaluationTagDto {
    constructor(evaluationTag) {
        this.id = evaluationTag.id;
        this.value = evaluationTag.value;
        this.evaluationId = evaluationTag.evaluationId;
        this.createdAt = evaluationTag.createdAt;
        this.updatedAt = evaluationTag.updatedAt;
    }
}
exports.EvaluationTagDto = EvaluationTagDto;
//# sourceMappingURL=evaluation-tag.dto.js.map