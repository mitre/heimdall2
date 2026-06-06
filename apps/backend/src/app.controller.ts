import {Controller, Get, UseInterceptors} from '@nestjs/common';
import {AllowAnonymous} from '@thallesp/nestjs-better-auth';
import {frontendStartupSettings} from './env';
import {StartupSettingsDto} from './config/dto/startup-settings.dto';
import {LoggingInterceptor} from './interceptors/logging.interceptor';

@Controller()
@UseInterceptors(LoggingInterceptor)
export class AppController {
  @AllowAnonymous()
  @Get('/server')
  getServerInfo(): StartupSettingsDto {
    return new StartupSettingsDto(frontendStartupSettings());
  }

  @AllowAnonymous()
  @Get('/api')
  getApiDiscovery() {
    return {
      name: 'Heimdall Enterprise Server API',
      version: '3.0.0',
      docs: '/api/docs',
      openapi: '/api/docs/swagger-json',
      health: '/api/health',
      auth: '/api/auth',
    };
  }
}
