import {ArgumentsHost, Catch, ExceptionFilter} from '@nestjs/common';

@Catch(Error)
export class AuthenticationExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    response.cookie('authenticationError', exception.message);
    response.redirect(301, '/');
  }
}
