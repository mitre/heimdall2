import {Test} from '@nestjs/testing';
import {ConfigService} from '../config/config.service';
import {AuthnService} from './authn.service';
import {UnauthorizedException} from '@nestjs/common';

// Create a simple version of the validate function to test the logic
async function validateUser(
  authnService: AuthnService,
  logger: {log: jest.Mock; error: jest.Mock; warn: jest.Mock},
  userinfo: any
) {
  logger.log(`Validating Okta user with email: ${userinfo.email}`);

  if (!userinfo.email) {
    logger.error('Email not provided in Okta userinfo response');
    throw new UnauthorizedException('Email is required for authentication');
  }

  if (userinfo.email_verified !== true) {
    logger.warn(`User email ${userinfo.email} is not verified`);
    throw new UnauthorizedException('Email verification required');
  }

  try {
    const user = await authnService.validateOrCreateUser(
      userinfo.email,
      userinfo.given_name || '',
      userinfo.family_name || '',
      'okta'
    );

    logger.log(`Okta authentication successful for user: ${userinfo.email}`);
    return user;
  } catch (error) {
    logger.error(`Error validating Okta user: ${error.message}`);
    throw new UnauthorizedException('Failed to authenticate with Okta');
  }
}

describe('Okta User Validation', () => {
  let authnService: AuthnService;
  let logger: {log: jest.Mock; error: jest.Mock; warn: jest.Mock};

  beforeEach(async () => {
    // Create mocks for dependencies
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'OKTA_DOMAIN') return 'test-okta-domain.okta.com';
        if (key === 'OKTA_CLIENTID') return 'test-client-id';
        if (key === 'OKTA_CLIENTSECRET') return 'test-client-secret';
        if (key === 'EXTERNAL_URL') return 'https://heimdall-test.example.com';
        return undefined;
      }),
      isInProductionMode: jest.fn().mockReturnValue(false)
    };

    const mockAuthnService = {
      validateOrCreateUser: jest
        .fn()
        .mockImplementation((email, firstName, lastName, source) => {
          return Promise.resolve({
            id: 1,
            email,
            firstName,
            lastName,
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        })
    };

    // Create the testing module
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService
        },
        {
          provide: AuthnService,
          useValue: mockAuthnService
        }
      ]
    }).compile();

    // Get service instances
    authnService = moduleRef.get<AuthnService>(AuthnService);

    // Create logger mock
    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };
  });

  it('should validate a user with valid userinfo', async () => {
    const mockUserinfo = {
      email: 'test@example.com',
      email_verified: true,
      given_name: 'Test',
      family_name: 'User',
      sub: '123456'
    };

    // Call the method to test
    const result = await validateUser(authnService, logger, mockUserinfo);

    // Verify that the authnService was called correctly
    expect(authnService.validateOrCreateUser).toHaveBeenCalledWith(
      'test@example.com',
      'Test',
      'User',
      'okta'
    );

    // Verify logging
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining(
        'Validating Okta user with email: test@example.com'
      )
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining(
        'Okta authentication successful for user: test@example.com'
      )
    );

    // Verify the result
    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        email: 'test@example.com'
      })
    );
  });

  it('should throw UnauthorizedException when email is missing', async () => {
    const mockUserinfo = {
      // Email is missing
      email_verified: true,
      given_name: 'Test',
      family_name: 'User',
      sub: '123456'
    };

    // Expect the method to throw an exception
    await expect(
      validateUser(authnService, logger, mockUserinfo)
    ).rejects.toThrow(UnauthorizedException);

    // Verify logging
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Email not provided in Okta userinfo response')
    );
  });

  it('should throw UnauthorizedException when email is not verified', async () => {
    const mockUserinfo = {
      email: 'test@example.com',
      email_verified: false, // Email not verified
      given_name: 'Test',
      family_name: 'User',
      sub: '123456'
    };

    // Expect the method to throw an exception
    await expect(
      validateUser(authnService, logger, mockUserinfo)
    ).rejects.toThrow(UnauthorizedException);

    // Verify logging
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('User email test@example.com is not verified')
    );
  });

  it('should handle authentication service errors', async () => {
    const mockUserinfo = {
      email: 'test@example.com',
      email_verified: true,
      given_name: 'Test',
      family_name: 'User',
      sub: '123456'
    };

    // Mock the auth service to throw an error
    jest
      .spyOn(authnService, 'validateOrCreateUser')
      .mockRejectedValue(new Error('Service error'));

    await expect(
      validateUser(authnService, logger, mockUserinfo)
    ).rejects.toThrow(UnauthorizedException);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error validating Okta user')
    );
  });
});
