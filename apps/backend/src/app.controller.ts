import {Controller, Get, UseInterceptors} from '@nestjs/common';
import {ConfigService} from './config/config.service';
import {StartupSettingsDto} from './config/dto/startup-settings.dto';
import {LoggingInterceptor} from './interceptors/logging.interceptor';

@Controller()
@UseInterceptors(LoggingInterceptor)
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get('/server')
  getServerInfo(): StartupSettingsDto {
    return this.configService.frontendStartupSettings();
  }
}
