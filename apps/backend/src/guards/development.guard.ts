import {CanActivate, Injectable} from '@nestjs/common';

@Injectable()
export class DevelopmentGuard implements CanActivate {
  async canActivate(): Promise<boolean> {
    return process.env.NODE_ENV === 'test';
  }
}
