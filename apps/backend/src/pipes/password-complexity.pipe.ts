import {validators} from '@heimdall/password-complexity';
import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform
} from '@nestjs/common';

export function validatePassword(password?: string): string[] {
  if (typeof password !== 'string') {
    return ['Password must be of type string'];
  } else {
    return validators.filter(validator => !validator.check(password)).map(validator.name);
  }
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
