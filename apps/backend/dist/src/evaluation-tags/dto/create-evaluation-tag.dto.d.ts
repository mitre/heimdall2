import { ICreateEvaluationTag } from '@heimdall/interfaces';
export declare class CreateEvaluationTagDto implements ICreateEvaluationTag {
    readonly value: string;
    constructor(evaluationTag: string);
}
