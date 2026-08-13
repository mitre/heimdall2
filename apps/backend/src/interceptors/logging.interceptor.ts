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
          `${this.line}[${String([info.timestamp])}] (Interceptor): ${String(info.ip)} ${String(
            info.referer
          )} ${String(info.userAgent)} ${String(info.user)} ${String(info.message)}`,
      ),
    ),
    transports: [new winston.transports.Console()],
  });

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  getRealIP(request: Request): string | unknown {
    const forwarded = Object.entries(request.headers).find(
      ([header]) =>
        header.toLowerCase() === 'x-forwarded-for'
        || header.toLowerCase() === 'x-real-ip',
    );
    if (!forwarded) {
      return request.ip;
    }
    // Node models repeated headers as string[]; a comma join is the HTTP
    // semantics for that case and keeps the template expression a string.
    const [, value] = forwarded;
    const proxyIP = Array.isArray(value) ? value.join(', ') : value;
    return `${proxyIP} -> ${request.ip}`;
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
    // Rebuilt rather than mutated in place: no computed-key write exists for
    // an attacker-shaped key to reach. Entries preserves own enumerable keys
    // only, so an own __proto__ from JSON.parse rides through as data — it
    // can never hit the prototype setter here.
    return Object.fromEntries(
      Object.entries(object).map(([key, value]) =>
        this.configService.sensitiveKeys.some(regex => regex.test(key))
          ? [key, '[REDACTED]']
          : [key, value],
      ),
    );
  }

  userToString(user?: SlimUserDto | User | UserDto): string {
    if (user) {
      return `User<ID: ${user.id}>`;
    }
    return 'User<Unknown>';
  }
}
