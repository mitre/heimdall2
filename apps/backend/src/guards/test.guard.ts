import { CanActivate, Injectable } from '@nestjs/common';

@Injectable()
export class TestGuard implements CanActivate {
  canActivate(): boolean {
    return isEndToEndTesting();
  }
}

export function isEndToEndTesting(): boolean {
  return (
    ['development', 'test'].includes(process.env.NODE_ENV ?? '')
    && process.env.CYPRESS_TESTING === 'true'
  );
}
