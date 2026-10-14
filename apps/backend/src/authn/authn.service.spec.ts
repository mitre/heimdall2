import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { type JwtPayload, verify } from 'jsonwebtoken';
import { unix } from 'moment';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ApiKeyService } from '../apikeys/apikey.service';
import { ConfigService } from '../config/config.service';
import { TokenModule } from '../token/token.module';
import type { UsersService } from '../users/users.service';
import { AuthnService } from './authn.service';

describe('AuthnService login expiry', () => {
  let testModule: TestingModule | undefined;

  afterEach(async () => {
    vi.restoreAllMocks();
    await testModule?.close();
    testModule = undefined;
  });

  async function service(adminExpiry?: string, userExpiry?: string) {
    const config = {
      get: (key: string) => {
        if (key === 'ADMIN_JWT_EXPIRE_TIME') {
          return adminExpiry;
        }
        if (key === 'JWT_EXPIRE_TIME') {
          return userExpiry;
        }
        if (key === 'JWT_SECRET') {
          return 'test-secret';
        }
      },
    } as ConfigService;
    const users = { findById: () => Promise.resolve({ jwtSecret: 'user-secret' }) } as unknown as UsersService;
    testModule = await Test.createTestingModule({ imports: [TokenModule] })
      .overrideProvider(ConfigService)
      .useValue(config)
      .compile();
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
      ['60s', 60],
      ['60m', 3600],
      ['2d', 172_800],
      ['3d', 172_800],
    ])('uses %s as a lifetime of %s seconds', async (setting, seconds) => {
      const { authn, jwt } = await service('10m', setting);
      const { accessToken } = await authn.login({
        email: 'user@example.test',
        forcePasswordChange: false,
        id: 'user-1',
        role: 'user',
      });
      const payload = verify(accessToken, 'test-secretuser-secret') as JwtPayload;
      expect(payload.exp).toBe(Number(payload.iat) + seconds);
      const defaultPayload = verify(jwt.sign({ sub: 'user-1' }), 'test-secret') as JwtPayload;
      expect(defaultPayload.exp).toBe(Number(defaultPayload.iat) + seconds);
    });
  });

  describe('admin sessions', () => {
    it.each([
      [undefined, 600],
      ['60m', 3600],
      ['2d', 172_800],
      ['3d', 172_800],
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

  it.each([
    ['admin', false],
    ['user', false],
    ['admin', true],
  ])('logs the token expiration for %s with password change %s', async (role, forcePasswordChange) => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 0, 1));
    const { authn } = await service('60m', '2m');
    const log = vi.spyOn(authn.logger, 'info');
    const { accessToken } = await authn.login({
      email: 'user@example.test',
      forcePasswordChange,
      id: 'user-1',
      role,
    });
    const payload = verify(accessToken, 'test-secretuser-secret') as JwtPayload;
    const expireTime = unix(Number(payload.exp)).format(authn.loggingTimeFormat);
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ message: `New session for User<ID: user-1> expires at ${expireTime}` }),
    );
  });

  it('rejects an invalid admin duration', async () => {
    const { authn } = await service('invalid');
    await expect(
      authn.login({
        email: 'user@example.test',
        forcePasswordChange: false,
        id: 'user-1',
        role: 'admin',
      }),
    ).rejects.toThrow();
  });
});
