import { AuthzService } from '../authz/authz.service';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { User } from '../users/user.model';
import { CreateEvaluationTagDto } from './dto/create-evaluation-tag.dto';
import { EvaluationTagDto } from './dto/evaluation-tag.dto';
import { EvaluationTagsService } from './evaluation-tags.service';
export declare class EvaluationTagsController {
    private readonly evaluationTagsService;
    private readonly evaluationsService;
    private readonly authz;
    constructor(evaluationTagsService: EvaluationTagsService, evaluationsService: EvaluationsService, authz: AuthzService);
    index(request: {
        user: User;
    }): Promise<EvaluationTagDto[]>;
    findById(id: string, request: {
        user: User;
    }): Promise<EvaluationTagDto>;
    create(evaluationId: string, createEvaluationTagDto: CreateEvaluationTagDto, request: {
        user: User;
    }): Promise<EvaluationTagDto>;
    remove(id: string, request: {
        user: User;
    }): Promise<EvaluationTagDto>;
}
