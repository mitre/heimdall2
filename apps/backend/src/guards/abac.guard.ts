import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {UsersService} from 'src/users/users.service';
import {AuthzService} from '../authz/authz.service';

@Injectable()
export class AbacGuard implements CanActivate {
  constructor(
    private authz: AuthzService,
    private usersService: UsersService
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
