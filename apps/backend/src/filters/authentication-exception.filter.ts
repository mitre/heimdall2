import {ArgumentsHost, Catch, ExceptionFilter} from '@nestjs/common';
import {ConfigService} from '../config/config.service';

@Catch(Error)
export class AuthenticationExceptionFilter implements ExceptionFilter {
  configService = new ConfigService();
  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    response.cookie('authenticationError', exception.message, {
      secure: this.configService.isInProductionMode()
    });
    response.redirect(301, '/');
  }
}
