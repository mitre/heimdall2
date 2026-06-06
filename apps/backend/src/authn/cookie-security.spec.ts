import {describe, expect, it, vi} from 'vitest';

describe('Cookie security hardening', () => {
  describe('setSessionCookies', () => {
    it('sets sameSite lax on userID and accessToken cookies', async () => {
      const {AuthnController} = await import('./authn.controller');
      const mockConfigService = {
        isInProductionMode: vi.fn().mockReturnValue(false),
        isLocalLoginAllowed: vi.fn().mockReturnValue(true),
      };
      const controller = new AuthnController(
        {} as any,
        mockConfigService as any,
      );
      const mockCookie = vi.fn();
      const mockRedirect = vi.fn();
      const req = {res: {cookie: mockCookie, redirect: mockRedirect}} as any;

      await controller.setSessionCookies(req, {userID: 'u1', accessToken: 'tok1'});

      expect(mockCookie).toHaveBeenCalledTimes(2);

      const userIdCall = mockCookie.mock.calls[0];
      expect(userIdCall[0]).toBe('userID');
      expect(userIdCall[2]).toHaveProperty('sameSite', 'lax');

      const accessTokenCall = mockCookie.mock.calls[1];
      expect(accessTokenCall[0]).toBe('accessToken');
      expect(accessTokenCall[2]).toHaveProperty('sameSite', 'lax');
    });

    it('sets httpOnly on userID cookie', async () => {
      const {AuthnController} = await import('./authn.controller');
      const controller = new AuthnController(
        {} as any,
        {isInProductionMode: vi.fn().mockReturnValue(false), isLocalLoginAllowed: vi.fn()} as any,
      );
      const mockCookie = vi.fn();
      const req = {res: {cookie: mockCookie, redirect: vi.fn()}} as any;

      await controller.setSessionCookies(req, {userID: 'u1', accessToken: 'tok1'});

      const userIdCall = mockCookie.mock.calls[0];
      expect(userIdCall[2]).toHaveProperty('httpOnly', true);
    });
  });

  describe('AuthenticationExceptionFilter', () => {
    it('sets httpOnly and sameSite on authenticationError cookie', async () => {
      const source = (await import('../filters/authentication-exception.filter')).AuthenticationExceptionFilter;
      const filter = new source();
      const filterCode = source.prototype.catch.toString();
      expect(filterCode).toContain('httpOnly');
      expect(filterCode).toContain('sameSite');
    });
  });

  describe('Express session cookie', () => {
    it('main.ts session config includes httpOnly and sameSite', async () => {
      const {readFileSync} = await import('fs');
      const {resolve} = await import('path');
      const mainSource = readFileSync(
        resolve(__dirname, '../main.ts'),
        'utf-8',
      );
      const cookieSection = mainSource.slice(
        mainSource.indexOf('cookie: {'),
        mainSource.indexOf('}', mainSource.indexOf('cookie: {') + 10) + 1,
      );
      expect(cookieSection).toContain('httpOnly');
      expect(cookieSection).toContain('sameSite');
    });
  });
});
