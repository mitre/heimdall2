import {ForbiddenError} from '@casl/ability';
import {Controller, Get, Request, UseInterceptors} from '@nestjs/common';
import {AuthzService} from '../authz/authz.service';
import {Action, type AuthUser} from '../casl/casl-ability.factory';
import {LoggingInterceptor} from '../interceptors/logging.interceptor';
import {StatisticsDTO} from './dto/statistics.dto';
import {StatisticsService} from './statistics.service';

@Controller('statistics')
@UseInterceptors(LoggingInterceptor)
export class StatisticsController {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly authz: AuthzService,
  ) {}

  @Get()
  async getHeimdallStatistics(
    @Request() request: {user: {id: string | number; role: string}},
  ): Promise<StatisticsDTO> {
    const abac = this.authz.abac.createForUser({
      id: String(request.user.id),
      role: request.user.role,
    });
    ForbiddenError.from(abac).throwUnlessCan(Action.ViewStatistics, 'all');
    return this.statisticsService.getHeimdallStatistics();
  }
}
