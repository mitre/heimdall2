import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform
} from '@nestjs/common';

@Injectable()
export class PasswordsMatchPipe implements PipeTransform {
  transform(
    value: {
      currentPassword?: string;
      password: string | undefined;
      passwordConfirmation: string | undefined;
    },
    _metadata: ArgumentMetadata
  ): any {
    if (
      value.currentPassword != null &&
      value.password == null &&
      value.passwordConfirmation == null
    ) {
      return value;
    }
    if (value.password == value.passwordConfirmation) {
      return value;
    } else {
      throw new BadRequestException('Passwords do not match');
    }
  }
}
