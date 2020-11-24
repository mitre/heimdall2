import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import {Observable} from 'rxjs';
import {UsersService} from '../users/users.service';

@Injectable()
export class IsAdminInterceptor implements NestInterceptor {
  constructor(private usersService: UsersService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    // In case the user's JWT is out of sync with the database,
    // grab the most up-to-date value from the user table.
    const user = await this.usersService.findById(request.user.id);
    request.params.role = user.role;

    return next.handle();
  }
}
