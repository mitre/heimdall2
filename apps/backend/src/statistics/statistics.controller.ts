import {ForbiddenError} from '@casl/ability';
import {Controller, Get, Ip, Request, UseGuards} from '@nestjs/common';
import {AuthzService} from '../authz/authz.service';
import {Action} from '../casl/casl-ability.factory';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {LoggingService} from '../logging/logging.service';
import {User} from '../users/user.model';
import {StatisticsDTO} from './dto/statistics.dto';
import {StatisticsService} from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly authz: AuthzService,
    private readonly loggingService: LoggingService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async userFindAll(
    @Request() request: {user: User},
    @Ip() ip: string
  ): Promise<StatisticsDTO> {
    const abac = this.authz.abac.createForUser(request.user);
    ForbiddenError.from(abac).throwUnlessCan(Action.ViewStatistics, User);
    this.loggingService.logAction(
      request,
      ip,
      'Accessed Deployment Statistics'
    );
    return this.statisticsService.getHeimdallStatistics();
  }
}
