import { request as sendHttpRequest } from 'node:http';
import { UnauthorizedException } from '@nestjs/common';
import {
  EXCEPTION_FILTERS_METADATA,
  MODULE_METADATA,
} from '@nestjs/common/constants';
import { APP_FILTER, Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { AuthGuard } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../app.module';
import { AuthnController } from '../authn/authn.controller';
import { AuthnService } from '../authn/authn.service';
import { ConfigService } from '../config/config.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthenticationExceptionFilter } from './authentication-exception.filter';

const NOT_PROVISIONED_RESPONSE = {
  error: 'account_not_provisioned',
  message:
    'No Heimdall account exists for this SSO user. Please ask your system administrator to create the account.',
  statusCode: 401,
};

const LdapAuthGuard = AuthGuard('ldap');

const createContext = (
  {
    authInfo = { message: 'Identity provider rejected login' },
    headers = {},
    query = {},
  }: {
    authInfo?: Record<string, unknown>;
    headers?: Record<string, string>;
    query?: Record<string, string>;
  } = {},
) => {
  const request = { authInfo, headers, query };
  const response = { cookie: vi.fn(), redirect: vi.fn() };
  return {
    host: new ExecutionContextHost([request, response]),
    response,
  };
};

const controllerHandler = (name: 'login' | 'loginToLDAP') => {
  const handler = Object.getOwnPropertyDescriptor(
    AuthnController.prototype,
    name,
  )?.value;
  if (typeof handler !== 'function') {
    throw new TypeError(`Expected AuthnController.${name} to be a function`);
  }
  return handler;
};

const post = (url: string) =>
  new Promise<{
    body: unknown;
    headers: Record<string, string | string[] | undefined>;
    statusCode: number | undefined;
  }>((resolve, reject) => {
    const request = sendHttpRequest(url, { method: 'POST' }, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      response.on('end', () => {
        resolve({
          body: JSON.parse(Buffer.concat(chunks).toString('utf8')),
          headers: response.headers,
          statusCode: response.statusCode,
        });
      });
    });
    request.on('error', reject);
    request.end();
  });

describe('AuthenticationExceptionFilter', () => {
  let applyFilter: AuthenticationExceptionFilter['catch'];
  let filter: AuthenticationExceptionFilter;

  beforeEach(() => {
    vi.restoreAllMocks();
    filter = new AuthenticationExceptionFilter();
    applyFilter = filter.catch.bind(filter);
    vi.spyOn(filter.logger, 'warn').mockImplementation(() => filter.logger);
  });

  it('sets authenticationErrorCode for a provisioning denial and redirects to root', () => {
    vi.spyOn(filter.configService, 'isInProductionMode').mockReturnValue(true);
    const { host, response } = createContext();

    applyFilter(new UnauthorizedException(NOT_PROVISIONED_RESPONSE), host);

    expect(response.cookie).toHaveBeenNthCalledWith(
      1,
      'authenticationError',
      `Identity provider rejected login\n${NOT_PROVISIONED_RESPONSE.message}`,
      { secure: true },
    );
    expect(response.cookie).toHaveBeenNthCalledWith(
      2,
      'authenticationErrorCode',
      'account_not_provisioned',
      { secure: true },
    );
    expect(response.cookie).toHaveBeenCalledTimes(2);
    expect(response.redirect).toHaveBeenCalledExactlyOnceWith(302, '/');
  });

  it('preserves the existing cookie only for a generic error', () => {
    vi.spyOn(filter.configService, 'isInProductionMode').mockReturnValue(false);
    const { host, response } = createContext();

    applyFilter(new Error('OAuth authentication failed'), host);

    expect(response.cookie).toHaveBeenCalledExactlyOnceWith(
      'authenticationError',
      'Identity provider rejected login\nOAuth authentication failed',
      { secure: false },
    );
    expect(response.redirect).toHaveBeenCalledExactlyOnceWith(302, '/');
  });

  it('redacts OAuth query secrets and omits credential headers from WARN diagnostics', () => {
    const { host } = createContext({
      authInfo: {
        message: 'Identity provider rejected login',
        token: 'auth-info-token-secret',
      },
      headers: {
        authorization: 'Bearer authorization-secret',
        cookie: 'session=cookie-secret',
        host: 'localhost:3100',
        referer: 'http://localhost:3100/login',
        'user-agent': 'curl/8.0',
        'x-api-key': 'header-api-key-secret',
      },
      query: {
        code: 'oauth-code-secret',
        error: 'access_denied',
        state: 'oauth-state-secret',
      },
    });
    const warn = vi.mocked(filter.logger.warn);
    let loggedWarning: unknown;
    warn.mockImplementation((message) => {
      loggedWarning = message;
      return filter.logger;
    });

    applyFilter(new UnauthorizedException(NOT_PROVISIONED_RESPONSE), host);

    expect(warn).toHaveBeenCalledOnce();
    const logMessage = loggedWarning;
    if (typeof logMessage !== 'string') {
      throw new TypeError('Expected serialized WARN diagnostics');
    }
    expect(logMessage).not.toContain('oauth-code-secret');
    expect(logMessage).not.toContain('oauth-state-secret');
    expect(logMessage).not.toContain('authorization-secret');
    expect(logMessage).not.toContain('cookie-secret');
    expect(logMessage).not.toContain('auth-info-token-secret');
    expect(logMessage).not.toContain('header-api-key-secret');

    const diagnostics = JSON.parse(
      logMessage.slice('Authentication Error\n'.length),
    );
    expect(diagnostics.authInfo).toBe('Identity provider rejected login');
    expect(diagnostics.headers).toEqual({
      host: 'localhost:3100',
      referer: 'http://localhost:3100/login',
      'user-agent': 'curl/8.0',
    });
    expect(diagnostics.query).toEqual({
      code: '[REDACTED]',
      error: 'access_denied',
      state: '[REDACTED]',
    });
  });

  it('leaves LDAP and local POST error transport unchanged', async () => {
    const exception = new UnauthorizedException(NOT_PROVISIONED_RESPONSE);
    const reflector = new Reflector();

    const denialGuard = {
      canActivate: () => {
        throw exception;
      },
    };
    const moduleReference = await Test.createTestingModule({
      controllers: [AuthnController],
      providers: [
        { provide: AuthnService, useValue: { login: vi.fn() } },
        {
          provide: ConfigService,
          useValue: { isLocalLoginAllowed: vi.fn().mockReturnValue(true) },
        },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue(denialGuard)
      .overrideGuard(LdapAuthGuard)
      .useValue(denialGuard)
      .compile();
    const app = moduleReference.createNestApplication();

    await app.listen(0, '127.0.0.1');
    try {
      const appUrl = await app.getUrl();
      for (const path of ['/authn/login', '/authn/login/ldap']) {
        const response = await post(`${appUrl}${path}`);

        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual(NOT_PROVISIONED_RESPONSE);
        expect(response.headers.location).toBeUndefined();
        expect(response.headers['set-cookie']).toBeUndefined();
      }
    } finally {
      await app.close();
    }

    expect(exception.getResponse()).toEqual(NOT_PROVISIONED_RESPONSE);
    expect(
      reflector.getAllAndMerge(EXCEPTION_FILTERS_METADATA, [
        controllerHandler('login'),
        AuthnController,
      ]),
    ).toEqual([]);
    expect(
      reflector.getAllAndMerge(EXCEPTION_FILTERS_METADATA, [
        controllerHandler('loginToLDAP'),
        AuthnController,
      ]),
    ).toEqual([]);

    const globalProviders
      = reflector.get<unknown[]>(MODULE_METADATA.PROVIDERS, AppModule) ?? [];
    expect(
      globalProviders.some(
        provider =>
          typeof provider === 'object'
          && provider !== null
          && 'provide' in provider
          && provider.provide === APP_FILTER
          && 'useClass' in provider
          && provider.useClass === AuthenticationExceptionFilter,
      ),
    ).toBe(false);
    expect(
      reflector.get(
        EXCEPTION_FILTERS_METADATA,
        controllerHandler('login'),
      ),
    ).toBeUndefined();
    expect(
      reflector.get(
        EXCEPTION_FILTERS_METADATA,
        controllerHandler('loginToLDAP'),
      ),
    ).toBeUndefined();
  });
});
