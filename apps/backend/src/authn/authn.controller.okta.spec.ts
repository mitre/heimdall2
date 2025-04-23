import {Test, TestingModule} from '@nestjs/testing';
import {AuthnController} from './authn.controller';
import {AuthnService} from './authn.service';
import {ConfigService} from '../config/config.service';
import {OktaStrategy} from './okta.strategy';
import {User} from '../users/user.model';

// Mock LocalAuthGuard
jest.mock('../guards/local-auth.guard', () => {
  return {
    LocalAuthGuard: jest.fn().mockImplementation(() => {
      return {
        canActivate: jest.fn().mockReturnValue(true)
      };
    })
  };
});

// Mock OktaStrategy
jest.mock('./okta.strategy', () => {
  return {
    OktaStrategy: jest.fn().mockImplementation(() => {
      return {
        validate: jest.fn(),
        onModuleInit: jest.fn()
      };
    })
  };
});

// Mock AuthGuard
jest.mock('@nestjs/passport', () => {
  const mockAuthGuard = jest.fn().mockImplementation(() => {
    return {
      canActivate: jest.fn().mockReturnValue(true)
    };
  });

  return {
    AuthGuard: mockAuthGuard,
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

describe('AuthnController - Okta Integration', () => {
  let controller: AuthnController;
  let authnService: AuthnService;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockAuthnService = {
      login: jest.fn().mockResolvedValue({
        userID: 'test-user-id',
        accessToken: 'test-access-token'
      })
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'OKTA_DOMAIN') return 'test-okta-domain.okta.com';
        if (key === 'OKTA_CLIENTID') return 'test-client-id';
        if (key === 'OKTA_CLIENTSECRET') return 'test-client-secret';
        if (key === 'EXTERNAL_URL') return 'https://heimdall-test.example.com';
        return undefined;
      }),
      isInProductionMode: jest.fn().mockReturnValue(false),
      isLocalLoginAllowed: jest.fn().mockReturnValue(true)
    };

    // Create a partial mock of OktaStrategy
    const mockOktaStrategy = {
      validate: jest.fn().mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      }),
      onModuleInit: jest.fn().mockResolvedValue(undefined)
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthnController],
      providers: [
        {
          provide: AuthnService,
          useValue: mockAuthnService
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        },
        {
          provide: OktaStrategy,
          useValue: mockOktaStrategy
        }
      ]
    }).compile();

    controller = module.get<AuthnController>(AuthnController);
    authnService = module.get<AuthnService>(AuthnService);
    configService = module.get<ConfigService>(ConfigService);

    // Spy on logger methods
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(controller['logger'], 'log').mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(controller['logger'], 'warn').mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(controller['logger'], 'error').mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(controller['logger'], 'debug').mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(controller['logger'], 'verbose').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('loginToOkta', () => {
    it('should initiate Okta login flow', async () => {
      const mockUser = {email: 'test@example.com'} as User;
      const mockRequest = {user: mockUser};

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await controller.loginToOkta(mockRequest as any);

      expect(result).toEqual({
        userID: 'test-user-id',
        accessToken: 'test-access-token'
      });
      expect(controller['logger'].verbose).toHaveBeenCalledWith(
        'Initiating Okta login flow',
        expect.objectContaining({
          context: 'AuthnController.loginToOkta'
        })
      );
      expect(authnService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getUserFromOkta', () => {
    it('should handle Okta callback correctly', async () => {
      const mockUser = {email: 'test@example.com'} as User;
      const mockResponse = {
        redirect: jest.fn(),
        cookie: jest.fn()
      };
      const mockRequest = {
        user: mockUser,
        res: mockResponse
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await controller.getUserFromOkta(mockRequest as any);

      expect(controller['logger'].log).toHaveBeenCalledWith(
        'Okta login callback received',
        expect.objectContaining({
          user: 'test@example.com',
          context: 'AuthnController.getUserFromOkta'
        })
      );
      expect(controller['logger'].log).toHaveBeenCalledWith(
        'Okta login completed successfully',
        expect.objectContaining({
          user: 'test@example.com',
          context: 'AuthnController.getUserFromOkta'
        })
      );
      expect(authnService.login).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.redirect).toHaveBeenCalledWith('/');
    });

    it('should handle unknown user in callback', async () => {
      const mockResponse = {
        redirect: jest.fn(),
        cookie: jest.fn()
      };
      const mockRequest = {
        // Empty user object to avoid the error
        user: {},
        res: mockResponse
      };

      // Mock the logger.log to avoid the error with email property
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(controller['logger'], 'log').mockImplementation(() => {});

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await controller.getUserFromOkta(mockRequest as any);

      expect(controller['logger'].log).toHaveBeenCalledWith(
        'Okta login callback received',
        expect.objectContaining({
          user: 'unknown',
          context: 'AuthnController.getUserFromOkta'
        })
      );
      // This should still work without throwing errors
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.redirect).toHaveBeenCalledWith('/');
    });
  });

  describe('setSessionCookies', () => {
    it('should set secure cookies in production mode', async () => {
      jest.spyOn(configService, 'isInProductionMode').mockReturnValue(true);

      const mockResponse = {
        redirect: jest.fn(),
        cookie: jest.fn()
      };
      const mockRequest = {
        res: mockResponse
      };

      const session = {
        userID: 'user-123',
        accessToken: 'access-token-123'
      };

      await controller.setSessionCookies(mockRequest as any, session);

      // Check first cookie call (userID)
      expect(mockResponse.cookie).toHaveBeenNthCalledWith(
        1,
        'userID',
        'user-123',
        expect.objectContaining({
          secure: true,
          httpOnly: false,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: 'lax'
        })
      );

      // Check second cookie call (accessToken)
      expect(mockResponse.cookie).toHaveBeenNthCalledWith(
        2,
        'accessToken',
        'access-token-123',
        expect.objectContaining({
          secure: true,
          httpOnly: false,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: 'lax'
        })
      );

      // Check redirection
      expect(mockResponse.redirect).toHaveBeenCalledWith('/');
    });

    it('should set non-secure cookies in development mode', async () => {
      jest.spyOn(configService, 'isInProductionMode').mockReturnValue(false);

      const mockResponse = {
        redirect: jest.fn(),
        cookie: jest.fn()
      };
      const mockRequest = {
        res: mockResponse
      };

      const session = {
        userID: 'user-123',
        accessToken: 'access-token-123'
      };

      await controller.setSessionCookies(mockRequest as any, session);

      // Check first cookie call (userID)
      expect(mockResponse.cookie).toHaveBeenNthCalledWith(
        1,
        'userID',
        'user-123',
        expect.objectContaining({
          secure: false,
          httpOnly: false,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: 'lax'
        })
      );
    });
  });
});
