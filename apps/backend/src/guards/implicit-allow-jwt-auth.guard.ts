import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ImplicitAllowJwtAuthGuard extends AuthGuard('jwt') {
  // All these are typed as any within passport

  handleRequest(_err: any, user: any, _info: any): any {
    return user;
  }
}
