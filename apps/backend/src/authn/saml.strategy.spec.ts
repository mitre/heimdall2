import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '../config/config.service';
import type { AuthnService } from './authn.service';
import { getRequiredClaim, SAMLStrategy } from './saml.strategy';

function expectMissingRequiredClaim(
  claims: Record<string, unknown>,
  claimName: string,
): void {
  try {
    getRequiredClaim(claims, claimName);
  } catch (error) {
    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(error).toHaveProperty('status', 401);
    expect(error).toHaveProperty(
      'message',
      `Missing required claim "${claimName}".`,
    );
    return;
  }

  throw new Error(`Expected missing required claim "${claimName}".`);
}

describe('getRequiredClaim', () => {
  it('returns default email scalar', () => {
    expect(getRequiredClaim({ email: 'mary@example.com' }, 'email')).toBe(
      'mary@example.com',
    );
  });

  it('returns configured flat URI claim scalar', () => {
    expect(
      getRequiredClaim(
        { 'http://schemas.example.com/given name': 'Mary Anne' },
        'firstName',
        'http://schemas.example.com/given name',
      ),
    ).toBe('Mary Anne');
  });

  it('rejects array claim values', () => {
    expect(() =>
      getRequiredClaim({ firstName: ['Mary', 'Anne'] }, 'firstName'),
    ).toThrow(new UnauthorizedException('Missing required claim "firstName".'));
  });

  it('rejects empty claim values', () => {
    expect(() => getRequiredClaim({ lastName: '' }, 'lastName')).toThrow(
      new UnauthorizedException('Missing required claim "lastName".'),
    );
  });

  it('rejects inherited claim values', () => {
    expect.hasAssertions();
    expectMissingRequiredClaim(
      Object.create({ email: 'mary@example.com' }) as Record<string, unknown>,
      'email',
    );
  });

  it.each([
    ['missing', {}],
    ['null', { email: null }],
    ['number', { email: 1 }],
    ['boolean', { email: true }],
    ['object', { email: {} }],
  ] as [string, Record<string, unknown>][])('rejects %s email claim values', (_valueType, claims) => {
    expect.hasAssertions();
    expectMissingRequiredClaim(claims, 'email');
  });
});

describe('SAMLStrategy', () => {
  it('uses configured identity claim names', async () => {
    const validateOrCreateUser = vi.fn();
    const configValues = new Map([
      ['SAML_EMAIL_ATTRIBUTE', 'customEmail'],
      ['SAML_FAMILY_NAME_ATTRIBUTE', 'customFamilyName'],
      ['SAML_GIVEN_NAME_ATTRIBUTE', 'customGivenName'],
    ]);
    const configService = {
      get: vi.fn((key: string) => configValues.get(key)),
      getExternalUrl: vi.fn(() => 'http://localhost:3000'),
    } as unknown as ConfigService;
    const strategy = new SAMLStrategy(
      { validateOrCreateUser } as unknown as AuthnService,
      configService,
    );

    await strategy.validate({
      customEmail: 'mary@example.com',
      customFamilyName: 'Smith',
      customGivenName: 'Mary Anne',
    });

    expect(validateOrCreateUser).toHaveBeenCalledWith(
      'mary@example.com',
      'Mary Anne',
      'Smith',
      'saml',
    );
  });
});
