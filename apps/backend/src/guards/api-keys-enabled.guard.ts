import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {Observable} from 'rxjs';
import {ConfigService} from '../config/config.service';

@Injectable()
export class APIKeysEnabled implements CanActivate {
  private readonly configService: ConfigService;
  constructor(configService: ConfigService) {
    this.configService = configService;
  }
  canActivate(
    _context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    return Boolean(this.configService.get('API_KEY_SECRET'));
  }
}
