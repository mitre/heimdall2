import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
export declare class PasswordComplexityPipe implements PipeTransform {
    transform(value: {
        password: string | undefined;
        passwordConfirmation: string | undefined;
    }, _metadata: ArgumentMetadata): Record<string, unknown>;
    hasClasses(password: string): boolean;
    noRepeats(password: string): boolean;
}
