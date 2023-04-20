import {Module} from '@nestjs/common';
import {TenableController} from './tenable.controller';
import {TenableService} from './tenable.service';

@Module({
  providers: [TenableService],
  controllers: [TenableController]
})
export class TenableModule {}
