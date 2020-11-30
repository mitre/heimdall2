import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {AuthzService} from '../authz/authz.service';
import {UsersService} from '../users/users.service';

@Injectable()
export class AbacGuard implements CanActivate {
  constructor(
    private readonly authz: AuthzService,
    private readonly usersService: UsersService
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.authz.can(
      await this.usersService.findById(request.user.id),
      request.method.toLowerCase(),
      request.url
    );
  }
}
