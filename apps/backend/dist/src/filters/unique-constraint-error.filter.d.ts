import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { UniqueConstraintError, ValidationErrorItem } from 'sequelize';
export declare class UniqueConstraintErrorFilter implements ExceptionFilter {
    catch(exception: UniqueConstraintError, host: ArgumentsHost): void;
    buildMessage(errors: ValidationErrorItem[]): string[];
}
