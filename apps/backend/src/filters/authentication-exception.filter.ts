import {ArgumentsHost, Catch, ExceptionFilter} from '@nestjs/common';
import * as _ from 'lodash';
import {ConfigService} from '../config/config.service';

@Catch(Error)
export class AuthenticationExceptionFilter implements ExceptionFilter {
  configService = new ConfigService();
  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    // Restart OIDC auth flow if state fails to verify, this is a known bug with passport-openidconnect that occours sometimes when logging in.
    if (
      _.get(request, 'authInfo.message') ===
      'Unable to verify authorization request state.'
    ) {
      return response.redirect(301, '/authn/oidc');
    }
    response.cookie('authenticationError', exception.message, {
      secure: this.configService.isInProductionMode()
    });
    response.redirect(301, '/');
  }
}
