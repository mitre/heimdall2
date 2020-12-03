import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import {Observable} from 'rxjs';
import {UsersService} from '../users/users.service';

@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
  constructor(private readonly usersService: UsersService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    // In case the user's JWT is out of sync with the database,
    // grab the most up-to-date value from the user table.
    const user = await this.usersService.findById(request.user.id);
    request.params.currentUser = user;

    return next.handle();
  }
}
