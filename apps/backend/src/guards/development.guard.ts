import {CanActivate, Injectable} from '@nestjs/common';
import {ConfigService} from '../config/config.service';

@Injectable()
export class DevelopmentGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}
  async canActivate(): Promise<boolean> {
    return this.configService.get('NODE_ENV') === 'test';
  }
}
