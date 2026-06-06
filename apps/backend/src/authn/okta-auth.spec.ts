import {describe, it, expect, beforeEach, vi} from 'vitest';
import {UnauthorizedException} from '@nestjs/common';
import {AuthnController} from './authn.controller';
import {AuthnService} from './authn.service';
import {ConfigService} from '../config/config.service';

describe('AuthnController — OAuth callback flows', () => {
  let controller: AuthnController;
  let mockAuthnService: {
    login: ReturnType<typeof vi.fn>;
  };
  let mockConfigService: {
    get: ReturnType<typeof vi.fn>;
    isInProductionMode: ReturnType<typeof vi.fn>;
    isLocalLoginAllowed: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockAuthnService = {
      login: vi.fn().mockResolvedValue({
        userID: 'user-123',
        accessToken: 'token-abc',
      }),
    };

    mockConfigService = {
      get: vi.fn().mockReturnValue(undefined),
      isInProductionMode: vi.fn().mockReturnValue(false),
      isLocalLoginAllowed: vi.fn().mockReturnValue(true),
    };

    controller = new AuthnController(
      mockAuthnService as unknown as AuthnService,
      mockConfigService as unknown as ConfigService,
    );
  });

  describe('loginToOkta', () => {
    it('returns session tokens from authnService.login', async () => {
      const mockUser = {id: '1', email: 'test@example.com', role: 'user', forcePasswordChange: false};
      const req = {user: mockUser, session: {}} as any;

      const result = await controller.loginToOkta(req);

      expect(result).toEqual({userID: 'user-123', accessToken: 'token-abc'});
      expect(mockAuthnService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getUserFromOkta', () => {
    it('sets cookies and redirects on successful callback', async () => {
      const mockCookie = vi.fn();
      const mockRedirect = vi.fn();
      const mockUser = {id: '1', email: 'test@example.com', role: 'user', forcePasswordChange: false};
      const req = {
        user: mockUser,
        session: {},
        res: {cookie: mockCookie, redirect: mockRedirect},
      } as any;

      await controller.getUserFromOkta(req);

      expect(mockAuthnService.login).toHaveBeenCalledWith(mockUser);
      expect(mockCookie).toHaveBeenCalledTimes(2);
      expect(mockCookie).toHaveBeenCalledWith('userID', 'user-123', {secure: false, sameSite: 'lax', httpOnly: true});
      expect(mockCookie).toHaveBeenCalledWith('accessToken', 'token-abc', {secure: false, sameSite: 'lax', httpOnly: true});
      expect(mockRedirect).toHaveBeenCalledWith('/');
    });

    it('handles callback when user is undefined', async () => {
      const mockCookie = vi.fn();
      const mockRedirect = vi.fn();
      const req = {
        user: undefined,
        session: {},
        res: {cookie: mockCookie, redirect: mockRedirect},
      } as any;

      await controller.getUserFromOkta(req);

      expect(mockAuthnService.login).toHaveBeenCalledWith(undefined);
    });
  });

  describe('setSessionCookies', () => {
    it('sets secure cookies in production mode', async () => {
      mockConfigService.isInProductionMode.mockReturnValue(true);
      const mockCookie = vi.fn();
      const mockRedirect = vi.fn();
      const req = {res: {cookie: mockCookie, redirect: mockRedirect}} as any;

      await controller.setSessionCookies(req, {userID: 'u-1', accessToken: 'tok-1'});

      expect(mockCookie).toHaveBeenCalledWith('userID', 'u-1', {secure: true, sameSite: 'lax', httpOnly: true});
      expect(mockCookie).toHaveBeenCalledWith('accessToken', 'tok-1', {secure: true, sameSite: 'lax', httpOnly: true});
      expect(mockRedirect).toHaveBeenCalledWith('/');
    });

    it('sets non-secure cookies in development mode', async () => {
      mockConfigService.isInProductionMode.mockReturnValue(false);
      const mockCookie = vi.fn();
      const mockRedirect = vi.fn();
      const req = {res: {cookie: mockCookie, redirect: mockRedirect}} as any;

      await controller.setSessionCookies(req, {userID: 'u-2', accessToken: 'tok-2'});

      expect(mockCookie).toHaveBeenCalledWith('userID', 'u-2', {secure: false, sameSite: 'lax', httpOnly: true});
      expect(mockCookie).toHaveBeenCalledWith('accessToken', 'tok-2', {secure: false, sameSite: 'lax', httpOnly: true});
    });

    it('handles missing res gracefully without throwing', async () => {
      const req = {res: undefined} as any;

      await expect(
        controller.setSessionCookies(req, {userID: 'u-3', accessToken: 'tok-3'}),
      ).resolves.not.toThrow();
    });
  });
});

describe('OktaStrategy — validate', () => {
  it('calls validateOrCreateUser with email from profile and returns user via done', async () => {
    const mockValidateOrCreate = vi.fn().mockResolvedValue({
      id: 1,
      email: 'okta-user@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    });

    const mockDone = vi.fn();

    const {OktaStrategy} = await import('./okta.strategy');

    const mockAuthnService = {validateOrCreateUser: mockValidateOrCreate} as unknown as AuthnService;
    const mockConfigService = {
      get: vi.fn().mockReturnValue('disabled'),
      getExternalUrl: vi.fn().mockReturnValue('http://localhost:3000'),
    } as unknown as ConfigService;

    const strategy = new OktaStrategy(mockAuthnService, mockConfigService);

    await strategy.validate('https://issuer', {
      provider: 'okta',
      id: 'okta-id-1',
      displayName: 'Jane Doe',
      name: {familyName: 'Doe', givenName: 'Jane', middleName: ''},
      emails: [{value: 'okta-user@example.com'}],
    }, mockDone);

    expect(mockValidateOrCreate).toHaveBeenCalledWith(
      'okta-user@example.com', 'Jane', 'Doe', 'okta',
    );
    expect(mockDone).toHaveBeenCalledWith(null, {
      id: 1,
      email: 'okta-user@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    });
  });

  it('calls done with UnauthorizedException when profile has no emails', async () => {
    const mockDone = vi.fn();

    const {OktaStrategy} = await import('./okta.strategy');

    const mockAuthnService = {validateOrCreateUser: vi.fn()} as unknown as AuthnService;
    const mockConfigService = {
      get: vi.fn().mockReturnValue('disabled'),
      getExternalUrl: vi.fn().mockReturnValue('http://localhost:3000'),
    } as unknown as ConfigService;

    const strategy = new OktaStrategy(mockAuthnService, mockConfigService);

    await strategy.validate('https://issuer', {
      provider: 'okta',
      id: 'okta-id-2',
      displayName: 'No Email',
      name: {familyName: 'User', givenName: 'No', middleName: ''},
      emails: [],
    }, mockDone);

    expect(mockDone).toHaveBeenCalledWith(expect.any(UnauthorizedException));
    expect(mockAuthnService.validateOrCreateUser).not.toHaveBeenCalled();
  });
});
