import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {AuthzService} from '../authz/authz.service';

@Injectable()
export class AbacGuard implements CanActivate {
  constructor(private authz: AuthzService) {}
  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.authz.can(
      request.user,
      request.method.toLowerCase(),
      request.url
    );
  }
}
