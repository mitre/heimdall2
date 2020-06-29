import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class PasswordsMatchPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: any, metadata: ArgumentMetadata) {
    if((value.currentPassword != null) && (value.password == null) && (value.passwordConfirmation == null)) {
      return value;
    }
    if (value.password == value.passwordConfirmation) {
      return value;
    } else {
      throw new BadRequestException('Passwords do not match');
    }
  }
}
