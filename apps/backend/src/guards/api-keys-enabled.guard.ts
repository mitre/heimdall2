import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {Observable} from 'rxjs';
import env from '../env';

@Injectable()
export class APIKeysEnabled implements CanActivate {
  canActivate(
    _context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return Boolean(env.API_KEY_SECRET);
  }
}
