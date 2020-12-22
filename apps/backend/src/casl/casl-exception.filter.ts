import {ForbiddenError} from '@casl/ability';
import {ArgumentsHost, Catch, ForbiddenException} from '@nestjs/common';
import {BaseExceptionFilter} from '@nestjs/core';

@Catch()
export class CaslExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    // Transform Casl Exception from ForbiddenError to ForbiddenException,
    // which Nest will properly transform into a 403 error.
    if (exception instanceof ForbiddenError) {
      super.catch(new ForbiddenException(exception.message), host);
    } else {
      super.catch(exception, host);
    }
  }
}
