import { IUpdateEvaluation } from '@heimdall/interfaces';
export declare class UpdateEvaluationDto implements IUpdateEvaluation {
    readonly filename: string | undefined;
    readonly data: Record<string, unknown> | undefined;
    readonly public: boolean | undefined;
}
