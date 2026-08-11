import { ForbiddenError } from '@casl/ability';
import {
  Controller,
  Get,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthzService } from '../authz/authz.service';
import { Action } from '../casl/casl-ability.factory';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { HealthDetailsDto } from '../health/dto/health.dto';
import { HealthService } from '../health/health.service';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { User } from '../users/user.model';

/**
 * ADR-006 §17 (renamed 2026-08-10, ratified policy): the migration report is
 * an ADMIN endpoint, not a health check — it moved out of the probe
 * namespace so /health carries only the probe-safe surface. Same guard chain
 * as StatisticsController: JwtAuthGuard + the CASL admin-only ViewStatistics
 * action.
 *
 * NEVER wire this route into a container healthcheck or readiness probe:
 * its counts are full Users/ApiKeys scans, uncached by design (§17 —
 * self-inflicted outage).
 */
@Controller('admin')
@UseInterceptors(LoggingInterceptor)
export class AdminController {
  constructor(
    private readonly authz: AuthzService,
    private readonly healthService: HealthService,
  ) {}

  @Get('migration-status')
  @UseGuards(JwtAuthGuard)
  async getMigrationStatus(
    @Request() request: { user: User },
  ): Promise<HealthDetailsDto> {
    const abac = this.authz.abac.createForUser(request.user);
    ForbiddenError.from(abac).throwUnlessCan(Action.ViewStatistics, User);
    return this.healthService.getDetails();
  }
}
