import {CanActivate, Injectable} from '@nestjs/common';
import env from '../env';

@Injectable()
export class TestGuard implements CanActivate {
  async canActivate(): Promise<boolean> {
    return (
      ['development', 'test'].includes(env.NODE_ENV) &&
      env.CYPRESS_TESTING === 'true'
    );
  }
}
