import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import levenshtein from 'js-levenshtein';

@Injectable()
export class PasswordChangePipe implements PipeTransform {
  classesChanged(future: string, current: string): boolean {
    const validators = [
      new RegExp('[a-z]', 'gv'),
      new RegExp('[A-Z]', 'gv'),
      new RegExp(String.raw`\d`, 'g'),
      new RegExp(/[^\s\w]/, 'g'),
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

  transform(value: {
    currentPassword?: string;
    password: string | undefined;
    passwordConfirmation: string | undefined;
  }): Record<string, unknown> {
    if (
      (!value.password && !value.passwordConfirmation)
      || !value.currentPassword
    ) {
      return value;
    } else if (
      typeof value.password == 'string'
      && typeof value.currentPassword == 'string'
      && levenshtein(value.password, value.currentPassword) > 8
      && this.classesChanged(value.password, value.currentPassword)
    ) {
      return value;
    } else {
      throw new BadRequestException(
        'A minimum of four character classes must be changed when updating a password.'
        + ' A minimum of eight of the total number of characters must be changed when updating a password.',
      );
    }
  }
}
