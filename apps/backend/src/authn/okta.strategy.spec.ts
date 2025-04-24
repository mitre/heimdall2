import {OktaStrategy} from './okta.strategy';
import {Test} from '@nestjs/testing';
import {ConfigService} from '../config/config.service';
import {AuthnService} from './authn.service';
import {UnauthorizedException} from '@nestjs/common';

// Mock the openid-client passport module
jest.mock('openid-client/passport', () => {
  return {
    Strategy: jest.fn().mockImplementation(() => {
      return function () {
        return {
          authenticate: jest.fn()
        };
      };
    })
  };
});

// Mock the openid-client main module
jest.mock('openid-client', () => {
  // Create mock client with userinfo method
  const mockClient = {
    userinfo: jest.fn().mockResolvedValue({
      email: 'test@example.com',
      email_verified: true,
      given_name: 'Test',
      family_name: 'User',
      sub: '123456'
    }),
    revoke: jest.fn().mockResolvedValue(undefined)
  };

  // Create mock Client constructor
  const MockClient = jest.fn().mockImplementation(() => mockClient);

  // Create mock Issuer with Client constructor
  const mockIssuer = {
    Client: MockClient,
    metadata: {
      issuer: 'https://test-okta-domain.okta.com',
      authorization_endpoint:
        'https://test-okta-domain.okta.com/oauth2/v1/authorize',
      token_endpoint: 'https://test-okta-domain.okta.com/oauth2/v1/token',
      userinfo_endpoint: 'https://test-okta-domain.okta.com/oauth2/v1/userinfo'
    }
  };

  return {
    Issuer: {
      discover: jest.fn().mockResolvedValue(mockIssuer)
    }
  };
});

// Mock the PassportStrategy
jest.mock('@nestjs/passport', () => {
  return {
    PassportStrategy: jest.fn().mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return function (options: any) {
        return {
          ...options
        };
      };
    })
  };
});

describe('OktaStrategy', () => {
  let oktaStrategy: OktaStrategy;
  let authnService: AuthnService;

  beforeEach(async () => {
    // Create mocks for dependencies
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        // Return mock values based on configuration key
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
        .mockImplementation((email, firstName, lastName, _source) => {
          // Return a mock user for testing
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
        OktaStrategy,
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
    oktaStrategy = moduleRef.get<OktaStrategy>(OktaStrategy);
    authnService = moduleRef.get<AuthnService>(AuthnService);

    // Manually add the validate and onModuleInit methods to make tests pass
    // This is needed because of how PassportStrategy wraps the strategy class
    oktaStrategy.validate = OktaStrategy.prototype.validate;
    oktaStrategy.onModuleInit = OktaStrategy.prototype.onModuleInit;

    // Spy on methods for later verification
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(oktaStrategy['logger'], 'log').mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(oktaStrategy['logger'], 'error').mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(oktaStrategy['logger'], 'warn').mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(oktaStrategy['logger'], 'debug').mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(oktaStrategy['logger'], 'verbose').mockImplementation(() => {});
  });

  it('should validate a user with valid token and userinfo', async () => {
    // Mock token and userinfo
    const mockTokenSet = {
      access_token: 'test-access-token',
      id_token: 'test-id-token',
      token_type: 'bearer' as const // lowercase as required by TokenEndpointResponse
    };

    const mockUserinfo = {
      email: 'test@example.com',
      email_verified: true,
      given_name: 'Test',
      family_name: 'User',
      sub: '123456'
    };

    // Call the method to test
    const result = await oktaStrategy.validate(mockTokenSet, mockUserinfo);

    // Verify that the authnService was called correctly
    expect(authnService.validateOrCreateUser).toHaveBeenCalledWith(
      'test@example.com',
      'Test',
      'User',
      'okta'
    );

    // Verify logging
    expect(oktaStrategy['logger'].verbose).toHaveBeenCalledWith(
      'Validating Okta user',
      expect.objectContaining({
        email: 'test@example.com',
        context: 'OktaStrategy.validate'
      })
    );
    expect(oktaStrategy['logger'].log).toHaveBeenCalledWith(
      'Okta authentication successful',
      expect.objectContaining({
        email: 'test@example.com',
        context: 'OktaStrategy.validate'
      })
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
    // Mock token and userinfo without email
    const mockTokenSet = {
      access_token: 'test-access-token',
      id_token: 'test-id-token',
      token_type: 'bearer' as const // lowercase as required by TokenEndpointResponse
    };

    const mockUserinfo = {
      // Email is missing
      email_verified: true,
      given_name: 'Test',
      family_name: 'User',
      sub: '123456'
    };

    // Expect the method to throw an exception
    await expect(
      oktaStrategy.validate(mockTokenSet, mockUserinfo)
    ).rejects.toThrow(UnauthorizedException);

    // Verify logging
    expect(oktaStrategy['logger'].error).toHaveBeenCalledWith(
      'Email not provided in Okta userinfo response',
      expect.objectContaining({
        context: 'OktaStrategy.validate'
      })
    );
  });

  it('should throw UnauthorizedException when email is not verified', async () => {
    // Mock token and userinfo with unverified email
    const mockTokenSet = {
      access_token: 'test-access-token',
      id_token: 'test-id-token',
      token_type: 'bearer' as const // lowercase as required by TokenEndpointResponse
    };

    const mockUserinfo = {
      email: 'test@example.com',
      email_verified: false, // Email not verified
      given_name: 'Test',
      family_name: 'User',
      sub: '123456'
    };

    // Expect the method to throw an exception
    await expect(
      oktaStrategy.validate(mockTokenSet, mockUserinfo)
    ).rejects.toThrow(UnauthorizedException);

    // Verify logging
    expect(oktaStrategy['logger'].warn).toHaveBeenCalledWith(
      'User email is not verified',
      expect.objectContaining({
        email: 'test@example.com',
        context: 'OktaStrategy.validate'
      })
    );
  });

  describe('onModuleInit', () => {
    it('should initialize OIDC client during onModuleInit', async () => {
      // Mock Issuer.discover
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {Issuer} = require('openid-client');

      await oktaStrategy.onModuleInit();

      expect(Issuer.discover).toHaveBeenCalledWith(
        'https://test-okta-domain.okta.com/oauth2/default'
      );
      expect(oktaStrategy['logger'].verbose).toHaveBeenCalledWith(
        'Discovering OpenID Connect endpoints',
        expect.objectContaining({
          context: 'OktaStrategy.onModuleInit'
        })
      );
      expect(oktaStrategy['logger'].debug).toHaveBeenCalledWith(
        'OpenID Connect endpoints discovered successfully',
        expect.objectContaining({
          context: 'OktaStrategy.onModuleInit'
        })
      );
      expect(oktaStrategy['logger'].log).toHaveBeenCalledWith(
        'Okta OIDC strategy initialized successfully',
        expect.objectContaining({
          context: 'OktaStrategy.onModuleInit'
        })
      );
    });

    it('should handle errors during initialization', async () => {
      // Reset the mock and make it reject
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {Issuer} = require('openid-client');
      Issuer.discover.mockRejectedValueOnce(new Error('Discovery failed'));

      await oktaStrategy.onModuleInit();

      expect(oktaStrategy['logger'].error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to initialize Okta OIDC strategy: Discovery failed'
        ),
        expect.objectContaining({
          context: 'OktaStrategy.onModuleInit',
          name: 'Error'
        })
      );
    });

    it('should correctly configure PKCE', async () => {
      // Since we're testing implementation details, we can verify by re-creating the class
      // and checking whether constructor parameters include PKCE
      const mockConfigService = {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'OKTA_DOMAIN') return 'test-domain';
          if (key === 'OKTA_CLIENTID') return 'test-id';
          if (key === 'OKTA_CLIENTSECRET') return 'test-secret';
          if (key === 'EXTERNAL_URL') return 'https://test.com';
          return undefined;
        }),
        isInProductionMode: jest.fn().mockReturnValue(false)
      };

      // Create a testable instance to verify PKCE
      // We use this instance to verify proper PKCE initialization
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testStrategy = new OktaStrategy(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {validateOrCreateUser: jest.fn()} as unknown as AuthnService,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockConfigService as unknown as ConfigService
      );

      // We can't access options directly, but we can verify proper initialization
      expect(testStrategy).toBeDefined();

      // Extract the actual options from where they're set in the super() call
      // and verify PKCE is enabled
      expect(oktaStrategy['usePKCE']).toBe(true);
    });
  });

  describe('Integration with Authentication Flow', () => {
    // Define mockResponse once so it's not recreated unnecessarily in beforeEach
    const mockResponse = {
      redirect: jest.fn(),
      cookie: jest.fn()
    };
    
    beforeEach(() => {
      // Reset mocks between tests
      mockResponse.redirect.mockClear();
      mockResponse.cookie.mockClear();
    });

    it('should handle authentication errors', async () => {
      const mockTokenSet = {
        access_token: 'test-access-token',
        id_token: 'test-id-token',
        token_type: 'bearer' as const // lowercase as required by TokenEndpointResponse
      };

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
        oktaStrategy.validate(mockTokenSet, mockUserinfo)
      ).rejects.toThrow(UnauthorizedException);

      expect(oktaStrategy['logger'].error).toHaveBeenCalledWith(
        'Error validating Okta user',
        expect.objectContaining({
          email: 'test@example.com',
          error: 'Service error',
          context: 'OktaStrategy.validate'
        })
      );
    });
  });
});
