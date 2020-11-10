import {Controller, Get} from '@nestjs/common';
import {ConfigService} from './config/config.service';
import {StartupSettingsDto} from './config/dto/startup-settings.dto';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get('/server')
  server(): StartupSettingsDto {
    return this.configService.frontendStartupSettings();
  }
}
