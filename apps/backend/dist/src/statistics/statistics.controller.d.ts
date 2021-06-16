import { AuthzService } from '../authz/authz.service';
import { User } from '../users/user.model';
import { StatisticsDTO } from './dto/statistics.dto';
import { StatisticsService } from './statistics.service';
export declare class StatisticsController {
    private readonly statisticsService;
    private readonly authz;
    constructor(statisticsService: StatisticsService, authz: AuthzService);
    userFindAll(request: {
        user: User;
    }): Promise<StatisticsDTO>;
}
