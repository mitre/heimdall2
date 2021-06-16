import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
export declare class AuthenticationExceptionFilter implements ExceptionFilter {
    catch(exception: Error, host: ArgumentsHost): void;
}
