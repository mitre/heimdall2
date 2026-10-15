import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { type JwtPayload, verify } from 'jsonwebtoken';
import { unix } from 'moment';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppConfig from '../../config/app_config';
import type { ApiKeyService } from '../apikeys/apikey.service';
import { ConfigService } from '../config/config.service';
import { TokenModule } from '../token/token.module';
import type { UsersService } from '../users/users.service';
import { AuthnService } from './authn.service';

describe('AuthnService login expiry', () => {
  let testModule: TestingModule | undefined;

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 0, 1));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await testModule?.close();
    testModule = undefined;
  });

  async function service(adminExpiry?: string, userExpiry?: string) {
    vi.spyOn(AppConfig.prototype, 'get').mockImplementation((key: string) => {
      if (key === 'ADMIN_JWT_EXPIRE_TIME') {
        return adminExpiry;
      }
      if (key === 'JWT_EXPIRE_TIME') {
        return userExpiry;
      }
      if (key === 'JWT_SECRET') {
        return 'test-secret';
      }
    });
    const users = { findById: () => Promise.resolve({ jwtSecret: 'user-secret' }) } as unknown as UsersService;
    testModule = await Test.createTestingModule({ imports: [TokenModule] })
      .compile();
    const config = testModule.get(ConfigService);
    const jwt = testModule.get(JwtService);
    const authn = new AuthnService(
      {} as ApiKeyService,
      config,
      users,
      jwt,
    );
    authn.logger.silent = true;
    return { authn, jwt };
  }

  describe('ordinary sessions', () => {
    it.each([
      [undefined, 60],
      ['', 60],
      [' '.repeat(3), 60],
      ['1000ms', 1],
      ['60m', 3600],
      [' 1500ms ', 1],
      ['2000', 2],
      ['2d', 172_800],
    ])('uses %s as a lifetime of %s seconds', async (setting, seconds) => {
      const { authn } = await service('10m', setting);
      const { accessToken } = await authn.login({
        email: 'user@example.test',
        forcePasswordChange: false,
        id: 'user-1',
        role: 'user',
      });
      const payload = verify(accessToken, 'test-secretuser-secret') as JwtPayload;
      expect(payload.exp).toBe(Number(payload.iat) + seconds);
    });
  });

  describe('admin sessions', () => {
    it.each([
      [undefined, 600],
      ['60m', 3600],
    ])('uses %s independently of the ordinary lifetime', async (setting, seconds) => {
      const { authn } = await service(setting, '5s');
      const { accessToken } = await authn.login({
        email: 'user@example.test',
        forcePasswordChange: false,
        id: 'user-1',
        role: 'admin',
      });
      const payload = verify(accessToken, 'test-secretuser-secret') as JwtPayload;
      expect(payload.exp).toBe(Number(payload.iat) + seconds);
    });
  });

  describe.each(['admin', 'user'])('%s password-change sessions', (role) => {
    it.each(['5s', '60m'])(
      'lasts ten minutes even when normal sessions use %s',
      async (setting) => {
        const { authn } = await service(setting, setting);
        const { accessToken } = await authn.login({
          email: 'user@example.test',
          forcePasswordChange: true,
          id: 'user-1',
          role,
        });
        const payload = verify(accessToken, 'test-secretuser-secret') as JwtPayload;
        expect(payload.exp).toBe(Number(payload.iat) + 600);
      },
    );
  });

  it('logs the token expiration', async () => {
    const { authn } = await service('60m', '2m');
    const log = vi.spyOn(authn.logger, 'info');
    const { accessToken } = await authn.login({
      email: 'user@example.test',
      forcePasswordChange: false,
      id: 'user-1',
      role: 'user',
    });
    const payload = verify(accessToken, 'test-secretuser-secret') as JwtPayload;
    const expireTime = unix(Number(payload.exp)).format(authn.loggingTimeFormat);
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ message: `New session for User<ID: user-1> expires at ${expireTime}` }),
    );
  });

  describe.each(['JWT_EXPIRE_TIME', 'ADMIN_JWT_EXPIRE_TIME'])('%s startup validation', (setting) => {
    it.each(['asdf', 'Infinity', '0', '-1s', '999ms', '172800001ms'])(
      'rejects %s before login and identifies the setting',
      async (duration) => {
        await expect(service(
          setting === 'ADMIN_JWT_EXPIRE_TIME' ? duration : undefined,
          setting === 'JWT_EXPIRE_TIME' ? duration : undefined,
        )).rejects.toThrow(setting);
      },
    );
  });
});
