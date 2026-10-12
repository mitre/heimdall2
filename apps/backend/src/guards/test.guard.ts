import { CanActivate, Injectable } from '@nestjs/common';

@Injectable()
export class TestGuard implements CanActivate {
  canActivate(): boolean {
    const environment = process.env.NODE_ENV;
    return (
      environment !== undefined
      && ['development', 'test'].includes(environment)
      && process.env.CYPRESS_TESTING === 'true'
    );
  }
}
