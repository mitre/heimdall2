import {Get, Controller} from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/server')
  server(): null {
    return;
  }
}
