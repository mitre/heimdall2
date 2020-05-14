import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class PasswordsMatchPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value.password == value.passwordConfirmation) {
      return value;
    } else {
      throw new BadRequestException('Passwords do not match');
    }
  }
}
