import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform
} from '@nestjs/common';
import levenshtein = require('js-levenshtein');

@Injectable()
export class PasswordChangePipe implements PipeTransform {
  transform(
    value: {
      currentPassword?: string;
      password: string | undefined;
      passwordConfirmation: string | undefined;
    },
    _metadata: ArgumentMetadata
  ): any {
    if (
      (!value.password && !value.passwordConfirmation) ||
      !value.currentPassword
    ) {
      return value;
    } else if (
      typeof value.password == 'string' &&
      typeof value.currentPassword == 'string' &&
      levenshtein(value.password, value.currentPassword) > 8 &&
      this.classesChanged(value.password, value.currentPassword)
    ) {
      return value;
    } else {
      throw new BadRequestException(
        'A minimum of four character classes must be changed when updating a password.' +
          ' A minimum of eight of the total number of characters must be changed when updating a password.'
      );
    }
  }

  classesChanged(future: string, current: string): boolean {
    const validators = [
      RegExp('[a-z]', 'g'),
      RegExp('[A-Z]', 'g'),
      RegExp('[0-9]', 'g'),
      RegExp(/[^\w\s]/, 'g')
    ];

    for (const validator of validators) {
      const currentMatch = [...current.matchAll(validator)];
      const futureMatch = [...future.matchAll(validator)];
      if (JSON.stringify(currentMatch) === JSON.stringify(futureMatch)) {
        return false;
      }
    }
    return true;
  }
}
