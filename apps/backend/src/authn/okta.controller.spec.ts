import { Test, TestingModule } from '@nestjs/testing';
import { AuthnController } from './authn.controller';
import { AuthnService } from './authn.service';
import { ConfigService } from '../config/config.service';
import { User } from '../users/user.model';

// Mock AuthGuard and other guards
jest.mock('@nestjs/passport', () => {
  return {
    AuthGuard: jest.fn().mockImplementation(() => {
      return {
        canActivate: jest.fn().mockReturnValue(true),
      };
    }),
  };
});

// Mock LocalAuthGuard
jest.mock('../guards/local-auth.guard', () => {
  return {
    LocalAuthGuard: jest.fn().mockImplementation(() => {
      return {
        canActivate: jest.fn().mockReturnValue(true),
      };
    }),
  };
});

// Mock AuthenticationExceptionFilter
jest.mock('../filters/authentication-exception.filter', () => {
  return {
    AuthenticationExceptionFilter: jest.fn().mockImplementation(() => {
      return {
        catch: jest.fn(),
      };
    }),
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
        accessToken: 'test-access-token',
      }),
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
      isLocalLoginAllowed: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthnController],
      providers: [
        {
          provide: AuthnService,
          useValue: mockAuthnService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthnController>(AuthnController);
    authnService = module.get<AuthnService>(AuthnService);
    configService = module.get<ConfigService>(ConfigService);

    // Spy on logger methods
    jest.spyOn(controller['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(controller['logger'], 'warn').mockImplementation(() => {});
    jest.spyOn(controller['logger'], 'error').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('loginToOkta', () => {
    it('should initiate Okta login flow', async () => {
      const mockUser = { email: 'test@example.com' } as User;
      const mockRequest = { user: mockUser };

      const result = await controller.loginToOkta(mockRequest as any);

      expect(result).toEqual({
        userID: 'test-user-id',
        accessToken: 'test-access-token',
      });
      expect(controller['logger'].log).toHaveBeenCalledWith(
        expect.stringContaining('Initiating Okta login flow')
      );
      expect(authnService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getUserFromOkta', () => {
    it('should handle Okta callback correctly', async () => {
      const mockUser = { email: 'test@example.com' } as User;
      const mockResponse = {
        redirect: jest.fn(),
        cookie: jest.fn(),
      };
      const mockRequest = {
        user: mockUser,
        res: mockResponse,
      };

      await controller.getUserFromOkta(mockRequest as any);

      expect(controller['logger'].log).toHaveBeenCalledWith(
        expect.stringContaining('Okta login callback received for user: test@example.com')
      );
      expect(controller['logger'].log).toHaveBeenCalledWith(
        expect.stringContaining('Okta login completed successfully for user: test@example.com')
      );
      expect(authnService.login).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.redirect).toHaveBeenCalledWith('/');
    });

    it('should handle unknown user in callback', async () => {
      const mockUser = { email: null } as User; // Empty user
      const mockResponse = {
        redirect: jest.fn(),
        cookie: jest.fn(),
      };
      const mockRequest = {
        user: mockUser,
        res: mockResponse,
      };

      // Mock implementation to avoid null error
      jest.spyOn(controller['logger'], 'log').mockImplementation(() => {});

      await expect(controller.getUserFromOkta(mockRequest as any)).resolves.not.toThrow();

      expect(controller['logger'].log).toHaveBeenCalledWith(
        expect.stringContaining('Okta login callback received for user: unknown')
      );
      expect(authnService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('setSessionCookies', () => {
    it('should set secure cookies in production mode', async () => {
      jest.spyOn(configService, 'isInProductionMode').mockReturnValue(true);

      const mockResponse = {
        redirect: jest.fn(),
        cookie: jest.fn(),
      };
      const mockRequest = {
        res: mockResponse,
      };

      const session = {
        userID: 'user-123',
        accessToken: 'access-token-123',
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
          sameSite: 'lax',
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
          sameSite: 'lax',
        })
      );

      // Check redirection
      expect(mockResponse.redirect).toHaveBeenCalledWith('/');
    });

    it('should set non-secure cookies in development mode', async () => {
      jest.spyOn(configService, 'isInProductionMode').mockReturnValue(false);

      const mockResponse = {
        redirect: jest.fn(),
        cookie: jest.fn(),
      };
      const mockRequest = {
        res: mockResponse,
      };

      const session = {
        userID: 'user-123',
        accessToken: 'access-token-123',
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
          sameSite: 'lax',
        })
      );
    });
  });
});