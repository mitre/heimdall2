import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { TenableController } from './tenable.controller';
import { TenableService } from './tenable.service';

// NestJS module definition for the Tenable proxy feature.
// Registers the controller and service needed for routing Tenable requests.

@Module({
  // Handles HTTP requests related to Tenable
  controllers: [TenableController],
  // ConfigModule is NOT @Global, so every module needing ConfigService must
  // import it. The controller reads the host allowlist from configuration, and
  // omitting this import fails at BOOT while unit specs stay green — they
  // provide ConfigService directly and never exercise module wiring.
  imports: [ConfigModule],
  // Provides logic for proxying and interacting with Tenable API
  providers: [TenableService],
})
export class TenableModule {}
