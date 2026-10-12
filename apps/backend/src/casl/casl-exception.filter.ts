import { ForbiddenError } from '@casl/ability';
import { ArgumentsHost, Catch, ForbiddenException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class CaslExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    // Transform Casl Exception from ForbiddenError to ForbiddenException,
    // which Nest will properly transform into a 403 error.
    /* eslint-disable promise/valid-params -- No code fix exists: Nest's
       ExceptionFilter contract mandates a method NAMED catch(exception,
       host), and the promise plugin's syntactic check assumes any two-
       argument .catch() call is Promise.prototype.catch. These are super
       calls to BaseExceptionFilter.catch, not promises. */
    if (exception instanceof ForbiddenError) {
      super.catch(new ForbiddenException(exception.message), host);
    } else {
      super.catch(exception, host);
    }
    /* eslint-enable promise/valid-params */
  }
}
