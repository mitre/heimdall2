import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus
} from '@nestjs/common';
import {Response} from 'express';
import {UniqueConstraintError, ValidationErrorItem} from 'sequelize';

@Catch(UniqueConstraintError)
export class UniqueConstraintErrorFilter implements ExceptionFilter {
  catch(exception: UniqueConstraintError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.buildMessage(exception.errors);

    response.status(status).json({
      statusCode: status,
      error: 'Internal Server Error',
      message: message
    });
  }

  buildMessage(errors: ValidationErrorItem[]): string[] {
    const builtErrors: string[] = [];
    errors.forEach((error) => {
      builtErrors.push(error.message);
    });
    return builtErrors;
  }
}
