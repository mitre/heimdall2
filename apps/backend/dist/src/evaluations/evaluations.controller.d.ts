/// <reference types="multer" />
import { AuthzService } from '../authz/authz.service';
import { ConfigService } from '../config/config.service';
import { GroupDto } from '../groups/dto/group.dto';
import { GroupsService } from '../groups/groups.service';
import { User } from '../users/user.model';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { EvaluationDto } from './dto/evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { EvaluationsService } from './evaluations.service';
export declare class EvaluationsController {
    private readonly evaluationsService;
    private readonly groupsService;
    private readonly configService;
    private readonly authz;
    constructor(evaluationsService: EvaluationsService, groupsService: GroupsService, configService: ConfigService, authz: AuthzService);
    findById(id: string, request: {
        user: User;
    }): Promise<EvaluationDto>;
    groupsForEvaluation(id: string, request: {
        user: User;
    }): Promise<GroupDto[]>;
    findAll(request: {
        user: User;
    }): Promise<EvaluationDto[]>;
    create(createEvaluationDto: CreateEvaluationDto, data: Express.Multer.File, request: {
        user: User;
    }): Promise<EvaluationDto>;
    update(id: string, request: {
        user: User;
    }, updateEvaluationDto: UpdateEvaluationDto): Promise<EvaluationDto>;
    remove(id: string, request: {
        user: User;
    }): Promise<EvaluationDto>;
}
