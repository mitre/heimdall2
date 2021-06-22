import {Module} from '@nestjs/common';
import {ConfigModule} from '../config/config.module';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';

@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [DatabaseService],
  exports: [DatabaseService]
})
export class LoggingModule {}
