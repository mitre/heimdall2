import {vi} from 'vitest';
import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import * as request from 'supertest';
import {AppModule} from '../src/app.module';
import {ConfigService} from '../src/config/config.service';
import env from '../src/env';
import axios from 'axios';

describe('Okta Authentication (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;

  const runIfOIDCConfigured = () => {
    return env.OKTA_DOMAIN && env.OKTA_CLIENTID && env.OKTA_CLIENTSECRET
      ? describe
      : describe.skip;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configService = moduleFixture.get<ConfigService>(ConfigService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  runIfOIDCConfigured()('OIDC Authentication Flow', () => {
    it('should redirect to Okta/OIDC provider for authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/authn/okta')
        .expect(302);

      const location = response.header.location;
      expect(location).toBeDefined();
      expect(location).toContain(env.OKTA_DOMAIN);
      expect(location).toContain('oauth2/default/v1/authorize');
      expect(location).toContain('response_type=code');
      expect(location).toContain('scope=openid+email+profile');

      expect(location).toContain('code_challenge=');
      expect(location).toContain('code_challenge_method=S256');
    });
  });

  describe('OIDC Discovery', () => {
    it('should successfully discover OpenID Connect endpoints', async () => {
      const domain = env.OKTA_DOMAIN ?? 'test.okta.com';

      vi.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          issuer: `https://${domain}/oauth2/default`,
          authorization_endpoint: `https://${domain}/oauth2/default/v1/authorize`,
          token_endpoint: `https://${domain}/oauth2/default/v1/token`,
          userinfo_endpoint: `https://${domain}/oauth2/default/v1/userinfo`,
          jwks_uri: `https://${domain}/oauth2/default/v1/keys`,
          response_types_supported: ['code'],
          grant_types_supported: ['authorization_code'],
          subject_types_supported: ['public'],
          id_token_signing_alg_values_supported: ['RS256'],
          scopes_supported: ['openid', 'email', 'profile'],
          token_endpoint_auth_methods_supported: ['client_secret_basic'],
          claims_supported: ['sub', 'email', 'email_verified', 'name', 'given_name', 'family_name'],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });

      const {OktaStrategy} = await import('../src/authn/okta.strategy');
      const strategy = new OktaStrategy(
        app.get('AuthnService'),
        app.get('ConfigService'),
      );

      await expect(strategy.onModuleInit()).resolves.not.toThrow();
    });
  });
});
