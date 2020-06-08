import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../src/database/database.module';
import { ConfigModule } from '../../src/config/config.module';
import { TestHelperService } from './test-helper.service';

@Module({
  imports: [DatabaseModule, ConfigModule],
  exports: [TestHelperService],
  providers: [TestHelperService]
})
export class TestHelperModule {}
