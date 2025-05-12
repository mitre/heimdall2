import {ArgumentsHost, Catch, ExceptionFilter} from '@nestjs/common';
import * as _ from 'lodash';
import winston from 'winston';
import {ConfigService} from '../config/config.service';

@Catch(Error)
export class AuthenticationExceptionFilter implements ExceptionFilter {
  configService = new ConfigService();

  private readonly line = '_______________________________________________\n';
  public loggingTimeFormat = 'MMM-DD-YYYY HH:mm:ss Z';
  public logger = winston.createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.timestamp({
        format: this.loggingTimeFormat
      }),
      winston.format.printf(
        (info) =>
          `${this.line}[${[info.timestamp]}] (Authentication Exception Filter): ${info.message}`
      )
    )
  });

  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const errInfo = {
      message: exception.message,
      stack: exception.stack,
      authInfo: _.get(request, 'authInfo'),
      query: request.query,
      headers: request.headers
    };
    this.logger.warn(
      `Authentication Error\n${JSON.stringify(errInfo, null, 2)}`
    );
    const authError =
      `${_.get(request, 'authInfo.message')}\n${exception.message}`.trim();
    response.cookie('authenticationError', authError, {
      secure: this.configService.isInProductionMode()
    });
    response.redirect(302, '/');
  }
}
