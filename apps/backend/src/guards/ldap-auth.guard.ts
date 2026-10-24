import {ExecutionContext, ForbiddenException, Injectable} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ConfigService} from '../config/config.service';

@Injectable()
export class LDAPAuthGuard extends AuthGuard('ldap') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (!this.configService.isLDAPLoginAllowed()) {
      throw new ForbiddenException(
        'LDAP login is disabled. Set LDAP_ENABLED=true to use this feature.'
      );
    }
    return super.canActivate(context);
  }
}
