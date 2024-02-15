import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import {Request} from 'express';
import * as _ from 'lodash';
import {Observable} from 'rxjs';
import winston from 'winston';
import {ConfigService} from '../config/config.service';
import {SlimUserDto} from '../users/dto/slim-user.dto';
import {UserDto} from '../users/dto/user.dto';
import {User} from '../users/user.model';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly configService: ConfigService;
  private readonly line = '___________________________________________\n';

  constructor(configService: ConfigService) {
    this.configService = configService;
  }
  public logger = winston.createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'MMM-DD-YYYY HH:mm:ss Z'
      }),
      winston.format.printf(
        (info) =>
          `${this.line}[${[info.timestamp]}] (Interceptor): ${info.ip} ${
            info.referer
          } ${info.userAgent} ${info.user} ${info.message}`
      )
    )
  });

  intercept(context: ExecutionContext, next: CallHandler): Observable<void> {
    const request: Request & {user?: User} = context
      .switchToHttp()
      .getRequest();
    const method = request.method;
    const endpoint = request.originalUrl;
    const callingUser: User | undefined = request.user;
    const calledMethod = context.getHandler().name;
    const requestParams = JSON.stringify(this.redact(request.body));
    const referer = request.headers['referer'];
    const userAgent = request.headers['user-agent'];
    this.logger.info({
      ip: this.getRealIP(request),
      user: this.userToString(callingUser),
      referer: referer,
      userAgent: userAgent,
      message: `${_.startCase(
        calledMethod
      )} (${method}) ${requestParams} ${endpoint}`
    });
    return next.handle();
  }

  userToString(user?: User | UserDto | SlimUserDto): string {
    if (user) {
      return `User<ID: ${user.id}>`;
    }
    return `User<Unknown>`;
  }

  getRealIP(request: Request): string | unknown {
    const realIP = Object.keys(request.headers).find(
      (header) =>
        header.toLowerCase() === 'x-forwarded-for' ||
        header.toLowerCase() === 'x-real-ip'
    );
    if (realIP) {
      return `${request.headers[realIP]} -> ${request.ip}`;
    } else {
      return request.ip;
    }
  }

  redact(obj: Record<string, unknown>): Record<string, unknown> {
    return this.redactObject(_.cloneDeep(obj));
  }

  redactObject(obj: Record<string, unknown>): Record<string, unknown> {
    Object.keys(obj).forEach((key) => {
      if (this.configService.sensitiveKeys.some((regex) => regex.test(key))) {
        obj[key] = '[REDACTED]';
      }
    });
    return obj;
  }
}
