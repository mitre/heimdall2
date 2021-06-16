import { ICreateEvaluation } from '@heimdall/interfaces';
import { CreateEvaluationTagDto } from '../../evaluation-tags/dto/create-evaluation-tag.dto';
export declare class CreateEvaluationDto implements ICreateEvaluation {
    readonly filename: string;
    readonly public: boolean;
    readonly evaluationTags: CreateEvaluationTagDto[] | undefined;
    readonly groups: string[] | undefined;
}
