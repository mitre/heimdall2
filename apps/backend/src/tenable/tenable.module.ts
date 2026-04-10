import {Module} from '@nestjs/common';
import {TenableController} from './tenable.controller';
import {TenableService} from './tenable.service';

// NestJS module definition for the Tenable proxy feature.
// Registers the controller and service needed for routing Tenable requests.

@Module({
  // Handles HTTP requests related to Tenable
  controllers: [TenableController],
  // Provides logic for proxying and interacting with Tenable API
  providers: [TenableService]
})
export class TenableModule {}
