import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import _ from 'lodash';
import { Observable } from 'rxjs';
import winston from 'winston';
import { ConfigService } from '../config/config.service';
import { SlimUserDto } from '../users/dto/slim-user.dto';
import { UserDto } from '../users/dto/user.dto';
import { User } from '../users/user.model';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly configService: ConfigService;
  private readonly line = '___________________________________________\n';

  public logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss Z' }),
      winston.format.printf(
        info =>
          `${this.line}[${[info.timestamp]}] (Interceptor): ${info.ip} ${
            info.referer
          } ${info.userAgent} ${info.user} ${info.message}`,
      ),
    ),
    transports: [new winston.transports.Console()],
  });

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  getRealIP(request: Request): string | unknown {
    const realIP = Object.keys(request.headers).find(
      header =>
        header.toLowerCase() === 'x-forwarded-for'
        || header.toLowerCase() === 'x-real-ip',
    );
    return realIP ? `${request.headers[realIP]} -> ${request.ip}` : request.ip;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<void> {
    const request: Request & { user?: User } = context
      .switchToHttp()
      .getRequest();
    const method = request.method;
    const endpoint = request.originalUrl;
    const callingUser: undefined | User = request.user;
    const calledMethod = context.getHandler().name;
    const requestParameters = JSON.stringify(this.redact(request.body));
    const referer = request.headers.referer;
    const userAgent = request.headers['user-agent'];
    this.logger.info({
      ip: this.getRealIP(request),
      message: `${_.startCase(
        calledMethod,
      )} (${method}) ${requestParameters} ${endpoint}`,
      referer: referer,
      user: this.userToString(callingUser),
      userAgent: userAgent,
    });
    return next.handle();
  }

  redact(object?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!_.isObject(object)) {
      return undefined;
    }
    return this.redactObject(structuredClone(object));
  }

  redactObject(object: Record<string, unknown>): Record<string, unknown> {
    for (const key of Object.keys(object)) {
      if (this.configService.sensitiveKeys.some(regex => regex.test(key))) {
        object[key] = '[REDACTED]';
      }
    }
    return object;
  }

  userToString(user?: SlimUserDto | User | UserDto): string {
    if (user) {
      return `User<ID: ${user.id}>`;
    }
    return 'User<Unknown>';
  }
}
