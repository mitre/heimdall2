import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { ConfigService } from '../config/config.service';
import { AuthnService } from './authn.service';
import { LDAPStrategy } from './ldap.strategy';

// The PassportStrategy mixin awaits validate() and hands its resolved value
// to passport's done() itself — that is the contract every sibling strategy
// (github, gitlab, okta, oidc) follows. Before the fix these tests pin, this
// strategy called done() directly with the UNAWAITED validateOrCreateUser
// promise, so req.user for LDAP logins was a pending Promise rather than a
// User, and done() fired a second time when the mixin completed.

const VALIDATED_USER = Object.freeze({
  email: 'alice@example.com',
  id: '42',
});

async function buildStrategy(): Promise<{
  strategy: LDAPStrategy;
  validateOrCreateUser: ReturnType<typeof vi.fn>;
}> {
  const validateOrCreateUser = vi.fn().mockResolvedValue(VALIDATED_USER);
  const moduleReference = await Test.createTestingModule({
    providers: [
      LDAPStrategy,
      {
        provide: AuthnService,
        useValue: {
          splitName: vi
            .fn()
            .mockReturnValue({ firstName: 'Alice', lastName: 'Doe' }),
          validateOrCreateUser,
        },
      },
      { provide: ConfigService, useValue: { get: vi.fn() } },
    ],
  }).compile();
  return { strategy: moduleReference.get(LDAPStrategy), validateOrCreateUser };
}

describe('LDAPStrategy', () => {
  it('resolves validate() to the validated user for the mixin to hand to done()', async () => {
    const { strategy, validateOrCreateUser } = await buildStrategy();
    await expect(
      strategy.validate({ mail: 'alice@example.com', name: 'Alice Doe' }),
    ).resolves.toBe(VALIDATED_USER);
    expect(validateOrCreateUser).toHaveBeenCalledWith(
      'alice@example.com',
      'Alice',
      'Doe',
      'ldap',
    );
  });

  it('uses the first address when LDAP returns the mail field as an array', async () => {
    const { strategy, validateOrCreateUser } = await buildStrategy();
    await expect(
      strategy.validate({
        mail: ['first@example.com', 'second@example.com'],
        name: 'Alice Doe',
      }),
    ).resolves.toBe(VALIDATED_USER);
    expect(validateOrCreateUser).toHaveBeenCalledWith(
      'first@example.com',
      'Alice',
      'Doe',
      'ldap',
    );
  });
});
