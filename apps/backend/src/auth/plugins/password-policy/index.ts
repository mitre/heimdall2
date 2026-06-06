import type {BetterAuthPlugin} from 'better-auth';
import {APIError} from 'better-auth/api';
import {getCurrentAuthContext} from '@better-auth/core/context';
import {defineErrorCodes} from '@better-auth/core/utils/error-codes';

import env from '../../../env';

export const PASSWORD_POLICY_ERROR_CODES = defineErrorCodes({
  PASSWORD_TOO_SHORT:
    `Password must be at least ${env.PASSWORD_MIN_LENGTH} characters`,
  MISSING_CHARACTER_CLASS:
    'Password must contain lowercase, uppercase, digits, and special characters',
  CONSECUTIVE_CHARACTER_CLASS:
    'Password must not contain 4 or more consecutive characters of the same class',
});

const CHAR_CLASS_PATTERNS = [
  /[a-z]/,
  /[A-Z]/,
  /[0-9]/,
  /[^A-Za-z0-9]/,
];

const CONSECUTIVE_PATTERNS = [
  /(.)\1{3,}/,
  /[a-z]{4,}/,
  /[A-Z]{4,}/,
  /[0-9]{4,}/,
  /[^A-Za-z0-9]{4,}/,
];

export interface PasswordPolicyOptions {
  minLength?: number;
}

export interface PasswordPolicyPlugin extends BetterAuthPlugin {
  id: 'password-policy';
  version: string;
  $ERROR_CODES: typeof PASSWORD_POLICY_ERROR_CODES;
  validatePassword: (password: string) => void;
}

export function passwordPolicy(
  options?: PasswordPolicyOptions
): PasswordPolicyPlugin {
  const minLength = options?.minLength ?? env.PASSWORD_MIN_LENGTH;

  function validatePassword(password: string): void {
    if (password.length < minLength) {
      throw APIError.from(
        'BAD_REQUEST',
        PASSWORD_POLICY_ERROR_CODES.PASSWORD_TOO_SHORT
      );
    }

    const classCount = CHAR_CLASS_PATTERNS.filter((p) =>
      p.test(password)
    ).length;
    if (classCount < CHAR_CLASS_PATTERNS.length) {
      throw APIError.from(
        'BAD_REQUEST',
        PASSWORD_POLICY_ERROR_CODES.MISSING_CHARACTER_CLASS
      );
    }

    if (CONSECUTIVE_PATTERNS.some((p) => p.test(password))) {
      throw APIError.from(
        'BAD_REQUEST',
        PASSWORD_POLICY_ERROR_CODES.CONSECUTIVE_CHARACTER_CLASS
      );
    }
  }

  return {
    id: 'password-policy',
    version: '0.1.0',
    $ERROR_CODES: PASSWORD_POLICY_ERROR_CODES,
    validatePassword,
    init(ctx) {
      const originalHash = ctx.password.hash;
      const validationPaths = [
        '/sign-up/email',
        '/change-password',
        '/reset-password',
        '/admin/set-password',
      ];
      return {
        context: {
          password: {
            ...ctx.password,
            async hash(password: string) {
              const authCtx = await getCurrentAuthContext();
              if (!authCtx.path || validationPaths.includes(authCtx.path)) {
                validatePassword(password);
              }
              return originalHash(password);
            },
          },
        },
      };
    },
  } satisfies PasswordPolicyPlugin;
}
