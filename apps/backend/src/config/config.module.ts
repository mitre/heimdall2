import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({
  exports: [ConfigService],
  providers: [ConfigService],
})
export class ConfigModule {}
