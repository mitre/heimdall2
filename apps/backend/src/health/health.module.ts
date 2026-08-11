import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule } from '../config/config.module';
import { CryptoModule } from '../crypto/crypto.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * ADR-006 §17. ConfigModule feeds FIPS_MODE; CryptoModule feeds the write
 * gate. The Sequelize connection (raw §17 count queries and the Terminus
 * ping) is provided by the root DatabaseModule registration. TerminusModule
 * supplies the /health/ready probe machinery — probes stay constant-cost and
 * never touch the §17 scans.
 */
@Module({
  controllers: [HealthController],
  exports: [HealthService],
  imports: [ConfigModule, CryptoModule, TerminusModule],
  providers: [HealthService],
})
export class HealthModule {}
