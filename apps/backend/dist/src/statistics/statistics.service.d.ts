import { EvaluationTagsService } from '../evaluation-tags/evaluation-tags.service';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { GroupsService } from '../groups/groups.service';
import { UsersService } from '../users/users.service';
import { StatisticsDTO } from './dto/statistics.dto';
export declare class StatisticsService {
    private readonly evaluationsService;
    private readonly evaluationTagsService;
    private readonly groupsService;
    private readonly usersService;
    constructor(evaluationsService: EvaluationsService, evaluationTagsService: EvaluationTagsService, groupsService: GroupsService, usersService: UsersService);
    getHeimdallStatistics(): Promise<StatisticsDTO>;
}
