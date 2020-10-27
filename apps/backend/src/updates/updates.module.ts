import {HttpModule, Module} from '@nestjs/common';
import {UpdatesService} from './updates.service';
import {UpdatesController} from './updates.controller';

@Module({
  imports: [HttpModule],
  providers: [UpdatesService],
  controllers: [UpdatesController],
  exports: [UpdatesService]
})
export class UpdatesModule {}
