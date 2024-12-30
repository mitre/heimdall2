import {validators} from '@heimdall/password-complexity';
import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform
} from '@nestjs/common';

export function validatePassword(password?: string): string[] {
  const errors = [];
  if (typeof password !== 'string') {
    errors.push('Password must be of type string');
  } else {
    validators.forEach((validator) => {
      if (!validator.check(password)) {
        errors.push(validator.name);
      }
    });
  }

  return errors;
}

@Injectable()
export class PasswordComplexityPipe implements PipeTransform {
  transform(
    value: {
      password: string | undefined;
      passwordConfirmation: string | undefined;
    }
  ): Record<string, unknown> {
    if (!value.password && !value.passwordConfirmation) {
      return value;
    }
    if (
      typeof value.password === 'string' &&
      validatePassword(value.password).length === 0
    ) {
      return value;
    } else {
      throw new BadRequestException(
        validatePassword(value.password).join(', ')
      );
    }
  }
}
