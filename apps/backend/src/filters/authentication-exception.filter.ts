import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import _ from 'lodash';
import winston from 'winston';
import { ConfigService } from '../config/config.service';

@Catch(Error)
export class AuthenticationExceptionFilter implements ExceptionFilter {
  configService = new ConfigService();

  public loggingTimeFormat = 'MMM-DD-YYYY HH:mm:ss Z';
  private readonly line = '_______________________________________________\n';
  public logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp({ format: this.loggingTimeFormat }),
      winston.format.printf(
        info =>
          `${this.line}[${[info.timestamp]}] (Authentication Exception Filter): ${info.message}`,
      ),
    ),
    transports: [new winston.transports.Console()],
  });

  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const errInfo = {
      authInfo: _.get(request, 'authInfo'),
      headers: request.headers,
      message: exception.message,
      query: request.query,
      stack: exception.stack,
    };
    this.logger.warn(
      `Authentication Error\n${JSON.stringify(errInfo, null, 2)}`,
    );
    const authError
      = `${_.has(request, 'authInfo.message') ? _.get(request, 'authInfo.message') : ''}\n${exception.message}`.trim();
    response.cookie('authenticationError', authError, { secure: this.configService.isInProductionMode() });
    response.redirect(302, '/');
  }
}
