import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '../src/config/config.service';
import axios from 'axios';

describe('Okta Authentication (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;
  
  // Skip tests if OIDC credentials are not configured
  const runIfOIDCConfigured = () => {
    const oktaDomain = process.env.OKTA_DOMAIN;
    const oktaClientId = process.env.OKTA_CLIENTID;
    const oktaClientSecret = process.env.OKTA_CLIENTSECRET;
    
    return oktaDomain && oktaClientId && oktaClientSecret 
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
        .expect(302); // 302 redirect

      const location = response.header.location;
      expect(location).toBeDefined();
      expect(location).toContain(process.env.OKTA_DOMAIN);
      expect(location).toContain('oauth2/default/v1/authorize');
      expect(location).toContain('response_type=code');
      expect(location).toContain('scope=openid+email+profile');
      
      // Verify PKCE is being used (code_challenge parameter should be present)
      expect(location).toContain('code_challenge=');
      expect(location).toContain('code_challenge_method=S256');
    });
  });

  // Test the discovery endpoint is working by mocking the response
  describe('OIDC Discovery', () => {
    it('should successfully discover OpenID Connect endpoints', async () => {
      // This test verifies the application can process discovery information
      // by mocking the discovery endpoint response
      
      // Mock axios to return a valid discovery document
      jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          issuer: `https://${process.env.OKTA_DOMAIN}/oauth2/default`,
          authorization_endpoint: `https://${process.env.OKTA_DOMAIN}/oauth2/default/v1/authorize`,
          token_endpoint: `https://${process.env.OKTA_DOMAIN}/oauth2/default/v1/token`,
          userinfo_endpoint: `https://${process.env.OKTA_DOMAIN}/oauth2/default/v1/userinfo`,
          jwks_uri: `https://${process.env.OKTA_DOMAIN}/oauth2/default/v1/keys`,
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
      
      // We can't directly test onModuleInit, so we create a new instance of OktaStrategy
      // and check it doesn't throw errors when initializing
      const { OktaStrategy } = await import('../src/authn/okta.strategy');
      const strategy = new OktaStrategy(
        app.get('AuthnService'), 
        app.get('ConfigService')
      );
      
      await expect(strategy.onModuleInit()).resolves.not.toThrow();
    });
  });
});