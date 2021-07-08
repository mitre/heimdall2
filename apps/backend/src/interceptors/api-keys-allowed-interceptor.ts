import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import {Observable} from 'rxjs';
import {ConfigService} from '../config/config.service';

@Injectable()
export class ApiKeysAllowedInterceptor implements NestInterceptor {
  private readonly configService: ConfigService;
  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<void> {
    if (this.configService.get('API_KEYS_DISABLED')?.toLowerCase() === 'true' || !this.configService.get('JWT_SECRET')) {
      throw new ForbiddenException('API Keys have been disabled');
    }
    return next.handle();
  }
}
