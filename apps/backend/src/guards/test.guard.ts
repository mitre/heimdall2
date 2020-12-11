import {CanActivate, Injectable} from '@nestjs/common';

@Injectable()
export class TestGuard implements CanActivate {
  async canActivate(): Promise<boolean> {
    return process.env.NODE_ENV === 'test';
  }
}
