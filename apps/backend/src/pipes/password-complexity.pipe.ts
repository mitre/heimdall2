import {IPasswordValidationResult} from '@heimdall/interfaces';
import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform
} from '@nestjs/common';

export function checkLength(password: string): boolean {
  return password.length >= 15;
}

export function hasClasses(password: string): boolean {
  const validators = [
    RegExp('[a-z]'),
    RegExp('[A-Z]'),
    RegExp('[0-9]'),
    RegExp(/[^\w\s]/)
  ];
  return (
    validators.filter((expr) => expr.test(password)).length == validators.length
  );
}

export function noRepeats(password: string): boolean {
  const validators = [
    RegExp(/(.)\1{3,}/),
    RegExp('[a-z]{4,}'),
    RegExp('[A-Z]{4,}'),
    RegExp('[0-9]{4,}'),
    RegExp(/[^\w\s]{4,}/)
  ];
  return validators.filter((expr) => expr.test(password)).length === 0;
}

export function validatePassword(password?: string): IPasswordValidationResult {
  const validationResult: IPasswordValidationResult = {
    errors: [],
    isString: false,
    meetsCharRequirement: false,
    meetsClassRequirement: false,
    meetsNoRepeatsRequirement: false
  };
  if (typeof password !== 'string') {
    validationResult.errors.push('Password must be of type string');
  } else {
    if (!checkLength(password)) {
      validationResult.errors.push('Password must be at least 15 characters');
    } else {
      validationResult.meetsCharRequirement = true;
    }
    if (!hasClasses(password)) {
      validationResult.errors.push(
        'Password must contain a combination of lowercase letters, uppercase letters, numbers, and special characters'
      );
    } else {
      validationResult.meetsClassRequirement = true;
    }
    if (!noRepeats(password)) {
      validationResult.errors.push(
        'Password must not contain 4 consecutive characters of the same character class'
      );
    } else {
      validationResult.meetsNoRepeatsRequirement = true;
    }
  }

  return validationResult;
}

@Injectable()
export class PasswordComplexityPipe implements PipeTransform {
  transform(
    value: {
      password: string | undefined;
      passwordConfirmation: string | undefined;
    },
    _metadata: ArgumentMetadata
  ): Record<string, unknown> {
    if (!value.password && !value.passwordConfirmation) {
      return value;
    }
    if (
      typeof value.password == 'string' &&
      validatePassword(value.password).errors.length === 0
    ) {
      return value;
    } else {
      throw new BadRequestException(
        validatePassword(value.password).errors.join(', ')
      );
    }
  }
}
