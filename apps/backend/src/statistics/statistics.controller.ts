import {ForbiddenError} from '@casl/ability';
import {
  Controller,
  Get,
  Request,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import {AuthzService} from '../authz/authz.service';
import {Action} from '../casl/casl-ability.factory';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {LoggingInterceptor} from '../interceptors/logging.interceptor';
import {User} from '../users/user.model';
import {StatisticsDTO} from './dto/statistics.dto';
import {StatisticsService} from './statistics.service';

@Controller('statistics')
@UseInterceptors(LoggingInterceptor)
export class StatisticsController {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly authz: AuthzService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getHeimdallStatistics(
    @Request() request: {user: User}
  ): Promise<StatisticsDTO> {
    const abac = this.authz.abac.createForUser(request.user);
    ForbiddenError.from(abac).throwUnlessCan(Action.ViewStatistics, User);
    return this.statisticsService.getHeimdallStatistics();
  }
}
