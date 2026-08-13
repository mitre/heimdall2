import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import _ from 'lodash';
import winston from 'winston';
import { ConfigService } from '../config/config.service';

@Catch(Error)
export class AuthenticationExceptionFilter implements ExceptionFilter {
  private readonly line = '_______________________________________________\n';

  configService = new ConfigService();
  public loggingTimeFormat = 'MMM-DD-YYYY HH:mm:ss Z';
  public logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp({ format: this.loggingTimeFormat }),
      winston.format.printf(
        info =>
          `${this.line}[${String([info.timestamp])}] (Authentication Exception Filter): ${String(info.message)}`,
      ),
    ),
    transports: [new winston.transports.Console()],
  });

  catch(exception: Error, host: ArgumentsHost): void {
    const context_ = host.switchToHttp();
    const request = context_.getRequest();
    const response = context_.getResponse();
    const errorInfo = {
      authInfo: _.get(request, 'authInfo'),
      headers: request.headers,
      message: exception.message,
      query: request.query,
      stack: exception.stack,
    };
    this.logger.warn(
      `Authentication Error\n${JSON.stringify(errorInfo, null, 2)}`,
    );
    const authError
      = `${_.has(request, 'authInfo.message') ? _.get(request, 'authInfo.message') : ''}\n${exception.message}`.trim();
    response.cookie('authenticationError', authError, { secure: this.configService.isInProductionMode() });
    response.redirect(302, '/');
  }
}
