import {ArgumentsHost, Catch, ExceptionFilter} from '@nestjs/common';

@Catch(Error)
export class AuthenticationExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    response
      .status(500)
      .send(
        'An error occoured while signing you in (Did you verify your identity with your identity provider?). Please go back to the <a href="/">home page</a>.'
      );
  }
}
