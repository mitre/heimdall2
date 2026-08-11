import { Controller, Get, UseInterceptors } from '@nestjs/common';
import type { HealthCheckResult } from '@nestjs/terminus';
import {
  HealthCheck,
  HealthCheckService,
  SequelizeHealthIndicator,
} from '@nestjs/terminus';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { HealthDto } from './dto/health.dto';
import { HealthService } from './health.service';

/**
 * ADR-006 §17 (ratified policy, 2026-08-10): this controller carries ONLY
 * the probe-safe surface. GET /health is the UNAUTHENTICATED liveness check
 * ({status, version}, no dependency checks — a DB outage must never restart
 * app pods). GET /health/ready is the UNAUTHENTICATED Terminus readiness
 * probe — a constant-cost DB ping for container/k8s/systemd probe use.
 *
 * The admin migration report lives at /admin/migration-status
 * (AdminController) — it is NOT a health check, must never be probed (its
 * counts are full table scans), and never returns on this surface (Risks —
 * disclosure).
 */
@Controller('health')
@UseInterceptors(LoggingInterceptor)
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly healthService: HealthService,
    private readonly sequelizeIndicator: SequelizeHealthIndicator,
  ) {}

  @Get('ready')
  @HealthCheck()
  checkReadiness(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      () => this.sequelizeIndicator.pingCheck('database'),
    ]);
  }

  @Get()
  getHealth(): HealthDto {
    return this.healthService.getHealth();
  }
}
