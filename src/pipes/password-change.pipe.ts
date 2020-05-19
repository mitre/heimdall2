import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import levenshtein = require('js-levenshtein');

@Injectable()
export class PasswordChangePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (levenshtein(value.password, value.currentPassword) > 8 && this.classesChanged(value.password, value.currentPassword)) {
      return value;
    } else {
      throw new BadRequestException('A minimum of four character classes must be changed when updating a password.' +
        ' A minimum of eight of the total number of characters must be changed when updating a password.');
    }
  }

  classesChanged(future: string, current: string) : boolean {
    const validators = [
      RegExp('[a-z]', 'g'),
      RegExp('[A-Z]', 'g'),
      RegExp('[0-9]', 'g'),
      RegExp('[^\w\s]', 'g')
    ]

    for(const validator of validators) {
      const currentMatch = [...current.matchAll(validator)];
      const futureMatch = [...future.matchAll(validator)];
      if(currentMatch == futureMatch) {
        return false;
      }
    }
    return true;
  }
}
