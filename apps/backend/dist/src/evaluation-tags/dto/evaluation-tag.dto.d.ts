import { IEvaluationTag } from '@heimdall/interfaces';
import { EvaluationTag } from '../evaluation-tag.model';
export declare class EvaluationTagDto implements IEvaluationTag {
    readonly id: string;
    readonly value: string;
    readonly evaluationId: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    constructor(evaluationTag: EvaluationTag);
}
