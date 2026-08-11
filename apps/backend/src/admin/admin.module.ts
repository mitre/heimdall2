import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { HealthModule } from '../health/health.module';
import { AdminController } from './admin.controller';

/**
 * ADR-006 §17: the admin surface. Holds the migration report (moved out of
 * the probe namespace, ratified 2026-08-10); e25.24's bulk migration
 * endpoints may extend it. HealthModule exports HealthService — the report's
 * data source is unchanged by the rename. ConfigModule feeds the
 * LoggingInterceptor (ConfigModule is NOT @Global in this app — found live:
 * the app context failed to boot without it while the spec was green,
 * because the original harness mounted the controller at root with a
 * root-level ConfigModule; the spec now consumes this real module instead).
 */
@Module({
  controllers: [AdminController],
  imports: [ConfigModule, HealthModule],
})
export class AdminModule {}
