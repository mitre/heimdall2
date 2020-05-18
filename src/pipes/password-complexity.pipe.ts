import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class PasswordComplexityPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if(this.hasClasses(value.password) && this.noRepeats(value.password)) {
      return value;
    } else {
      throw new BadRequestException('Password does not meet complexity requirements. Passwords are a minimum of 15' +
        ' characters in length. Passwords must contain at least one special character, number, upper-case letter, and' +
        ' lower-case letter. Passwords cannot contain more than three consecutive repeating characters.' +
        ' Passwords cannot contain more than four repeating characters from the same character class.');
    }
  }

  hasClasses(password: string) : boolean {
    const validators = [
      RegExp('[a-z]'),
      RegExp('[A-Z]'),
      RegExp('[0-9]'),
      RegExp('[^\w\s]'),
      RegExp('.{15,}')
    ];
    return validators.filter(expr => expr.test(password)).length == validators.length;
  }

  noRepeats(password: string) : boolean {
    const validators = [
      RegExp(/(.)\1{3,}/),
      RegExp('[a-z]{4,}'),
      RegExp('[A-Z]{4,}'),
      RegExp('[0-9]{4,}'),
      RegExp(/^\w\s]{4,}/)
    ]
    return validators.filter(expr => expr.test(password)).length == 0
  }
}
