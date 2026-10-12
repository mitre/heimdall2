import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import levenshtein from 'js-levenshtein';

// Safe to share: matchAll iterates an internal clone and never advances the
// source regex's lastIndex.
const CHARACTER_CLASS_MATCHERS = [/[a-z]/gv, /[A-Z]/gv, /\d/g, /[^\s\w]/g];

@Injectable()
export class PasswordChangePipe implements PipeTransform {
  classesChanged(future: string, current: string): boolean {
    for (const validator of CHARACTER_CLASS_MATCHERS) {
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
    }
    if (
      typeof value.password == 'string'
      && typeof value.currentPassword == 'string'
      && levenshtein(value.password, value.currentPassword) > 8
      && this.classesChanged(value.password, value.currentPassword)
    ) {
      return value;
    }
    throw new BadRequestException(
      'A minimum of four character classes must be changed when updating a password.'
      + ' A minimum of eight of the total number of characters must be changed when updating a password.',
    );
  }
}
