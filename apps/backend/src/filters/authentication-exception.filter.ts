import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import _ from 'lodash';
import winston from 'winston';
import { ConfigService } from '../config/config.service';

const OAUTH_SECRET_QUERY_KEYS = new Set(['code', 'state']);
const SAFE_DIAGNOSTIC_HEADERS = ['host', 'referer', 'user-agent'];

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
    const context_ = host.switchToHttp();
    const request = context_.getRequest<Request>();
    const response = context_.getResponse<Response>();
    const authInfo = _.get(request, 'authInfo.message');
    const authInfoMessage = typeof authInfo === 'string' ? authInfo : '';
    const redactedQuery = _.mapValues(request.query, (value, key) =>
      OAUTH_SECRET_QUERY_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : value,
    );
    const errorInfo = {
      authInfo: authInfoMessage,
      headers: _.pick(request.headers, SAFE_DIAGNOSTIC_HEADERS),
      message: exception.message,
      query: redactedQuery,
      stack: exception.stack,
    };
    this.logger.warn(
      `Authentication Error\n${JSON.stringify(errorInfo, null, 2)}`,
    );
    const authError
      = `${authInfoMessage}\n${exception.message}`.trim();
    const cookieOptions = { secure: this.configService.isInProductionMode() };
    response.cookie('authenticationError', authError, cookieOptions);
    const exceptionResponse
      = exception instanceof HttpException ? exception.getResponse() : undefined;
    if (
      typeof exceptionResponse === 'object'
      && exceptionResponse !== null
      && 'error' in exceptionResponse
      && exceptionResponse.error === 'account_not_provisioned'
    ) {
      response.cookie(
        'authenticationErrorCode',
        exceptionResponse.error,
        cookieOptions,
      );
    }
    response.redirect(302, '/');
  }
}
