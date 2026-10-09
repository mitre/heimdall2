import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '../config/config.service';
import type { AuthnService } from './authn.service';
import { SAMLStrategy } from './saml.strategy';

describe('SAMLStrategy', () => {
  it('rejects HTTP-POST authentication requests during construction', () => {
    const configService = {
      get: (key: string) => key === 'SAML_AUTHN_REQUEST_BINDING' ? 'HTTP-POST' : undefined,
      getExternalUrl: () => 'http://localhost:3000',
    } as unknown as ConfigService;

    expect(() => new SAMLStrategy({} as AuthnService, configService)).toThrow(
      'SAML_AUTHN_REQUEST_BINDING=HTTP-POST is unsupported; use HTTP-Redirect.',
    );
  });

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

    validateOrCreateUser.mockClear();
    await expect(strategy.validate({
      customFamilyName: 'Smith',
      customGivenName: 'Mary Anne',
    })).rejects.toThrow('Missing required claim "customEmail".');
    expect(validateOrCreateUser).not.toHaveBeenCalled();
  });
});
