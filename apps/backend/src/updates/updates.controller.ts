import {Controller, Get} from '@nestjs/common';
import {UpdatesService} from './updates.service';

@Controller('updates')
export class UpdatesController {
  constructor(private readonly usersService: UpdatesService) {}

  @Get('')
  async checkUpdates(): Promise<any> {
    return this.usersService.checkForUpdate();
  }
}
