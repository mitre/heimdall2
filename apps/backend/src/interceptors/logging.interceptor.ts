import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import {Request} from 'express';
import _ from 'lodash';
import {Observable} from 'rxjs';
import winston from 'winston';
import {SlimUserDto} from '../users/dto/slim-user.dto';
import {UserDto} from '../users/dto/user.dto';
import {User} from '../users/user.model';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  public logger = winston.createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'MMM-DD-YYYY HH:mm:ss'
      }),
      winston.format.printf(
        (info) =>
          `[${[info.timestamp]} ${info.ip}] ${info.user} ${info.message}`
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
    this.logger.info({
      ip: request.ip,
      user: this.userToString(callingUser),
      message: `${_.startCase(calledMethod)} (${method}) ${endpoint}`
    });
    return next.handle();
  }

  userToString(user?: User | UserDto | SlimUserDto): string {
    if (user) {
      return `User<ID: ${user.id}>`;
    }
    return `User<Unknown>`;
  }
}
