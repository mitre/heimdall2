import { IEvaluation } from '@heimdall/interfaces';
import { EvaluationTagDto } from '../../evaluation-tags/dto/evaluation-tag.dto';
import { Evaluation } from '../evaluation.model';
export declare class EvaluationDto implements IEvaluation {
    readonly id: string;
    filename: string;
    readonly data?: Record<string, unknown>;
    readonly evaluationTags: EvaluationTagDto[];
    readonly userId: string;
    readonly public: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly editable: boolean;
    readonly shareURL?: string;
    constructor(evaluation: Evaluation, editable?: boolean, shareURL?: string | undefined);
}
