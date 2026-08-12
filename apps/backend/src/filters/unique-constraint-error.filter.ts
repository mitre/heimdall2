import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { UniqueConstraintError, ValidationErrorItem } from 'sequelize';

@Catch(UniqueConstraintError)
export class UniqueConstraintErrorFilter implements ExceptionFilter {
  buildMessage(errors: ValidationErrorItem[]): string[] {
    const builtErrors: string[] = Array.from(errors, error => error.message);
    return builtErrors;
  }

  catch(exception: UniqueConstraintError, host: ArgumentsHost): void {
    const context_ = host.switchToHttp();
    const response = context_.getResponse<Response>();
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.buildMessage(exception.errors);

    response.status(status).json({
      error: 'Internal Server Error',
      message: message,
      statusCode: status,
    });
  }
}
