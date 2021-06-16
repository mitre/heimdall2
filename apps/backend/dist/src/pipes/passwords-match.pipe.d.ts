import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
export declare class PasswordsMatchPipe implements PipeTransform {
    transform(value: {
        currentPassword?: string;
        password: string | undefined;
        passwordConfirmation: string | undefined;
    }, _metadata: ArgumentMetadata): Record<string, unknown>;
}
