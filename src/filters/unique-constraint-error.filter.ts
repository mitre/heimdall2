import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { UniqueConstraintError, ValidationErrorItem } from 'sequelize';

@Catch(UniqueConstraintError)
export class UniqueConstraintErrorFilter implements ExceptionFilter {
  catch(exception: UniqueConstraintError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.buildMessage(exception.errors);

    response
      .status(status)
      .json({
        statusCode: status,
        error: 'Internal Server Error',
        messages: message
      });
  }

  buildMessage(errors: ValidationErrorItem[]): {}[] {
    let builtErrors:{}[] = [];
    errors.forEach((error) => {
      let message: { [id: string] : string } = {};
      message[error.path] = error.message;
      builtErrors.push(message);
    });
    return builtErrors;
  }
}
