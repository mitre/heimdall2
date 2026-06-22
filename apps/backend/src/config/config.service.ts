import type {AuthStrategy} from '@heimdall/common/interfaces';
import {SequelizeOptions} from 'sequelize-typescript';
import AppConfig from '../../config/app_config';
import {StartupSettingsDto} from './dto/startup-settings.dto';

const OAUTH_AUTH_STRATEGIES = [
  'github',
  'gitlab',
  'google',
  'okta',
  'oidc'
] as const;

export class ConfigService {
  private readonly appConfig: AppConfig;
  public defaultGithubBaseURL = 'https://github.com/';
  public defaultGithubAPIURL = 'https://api.github.com/';

  constructor() {
    this.appConfig = new AppConfig();
  }

  public sensitiveKeys = [
    /cookie/i,
    /passw(or)?d/i,
    /^pw$/,
    /^pass$/i,
    /secret/i,
    /token/i,
    /api[-._]?key/i,
    /data/i
  ];

  isRegistrationAllowed(): boolean {
    return this.get('REGISTRATION_DISABLED')?.toLowerCase() !== 'true';
  }

  isLocalLoginAllowed(): boolean {
    return this.get('LOCAL_LOGIN_DISABLED')?.toLowerCase() !== 'true';
  }

  isInProductionMode(): boolean {
    return this.get('NODE_ENV')?.toLowerCase() === 'production';
  }

  enabledAuthStrategies(): AuthStrategy[] {
    const enabledAuthStrategies: AuthStrategy[] = [];
    if (this.isLocalLoginAllowed()) {
      enabledAuthStrategies.push('local');
    }
    if (this.get('LDAP_ENABLED')?.toLocaleLowerCase() === 'true') {
      enabledAuthStrategies.push('ldap');
    }
    enabledAuthStrategies.push(
      ...OAUTH_AUTH_STRATEGIES.filter((authStrategy) =>
        this.get(`${authStrategy.toUpperCase()}_CLIENTID`)
      )
    );
    if (
      ['SAML_ENTRY_POINT', 'SAML_ISSUER', 'SAML_IDP_CERT'].every((setting) =>
        this.get(setting)
      )
    ) {
      enabledAuthStrategies.push('saml');
    }

    return enabledAuthStrategies;
  }

  frontendStartupSettings(): StartupSettingsDto {
    return new StartupSettingsDto({
      apiKeysEnabled: this.get('API_KEY_SECRET') ? true : false,
      banner: this.get('WARNING_BANNER') || '',
      classificationBannerColor:
        this.get('CLASSIFICATION_BANNER_COLOR') || 'red',
      classificationBannerText: this.get('CLASSIFICATION_BANNER_TEXT') || '',
      classificationBannerTextColor:
        this.get('CLASSIFICATION_BANNER_TEXT_COLOR') || 'white',
      enabledAuthStrategies: this.enabledAuthStrategies(),
      externalUrl: this.getExternalUrl(),
      oidcName: this.get('OIDC_NAME') || '',
      registrationEnabled: this.isRegistrationAllowed(),
      tenableHostUrl: this.getTenableHostUrl(),
      forceTenableFrontend:
        this.get('FORCE_TENABLE_FRONTEND')?.toLowerCase() === 'true',
      splunkHostUrl: this.getSplunkHostUrl()
    });
  }

  getExternalUrl(): string {
    return this.appConfig.getExternalUrl();
  }

  getSplunkHostUrl(): string {
    return this.appConfig.getSplunkHostUrl();
  }

  getTenableHostUrl(): string {
    return this.appConfig.getTenableHostUrl();
  }

  getDbConfig(): SequelizeOptions {
    return this.appConfig.getDbConfig();
  }

  getSSLConfig(): false | Record<string, unknown> {
    return this.appConfig.getSSLConfig();
  }

  set(key: string, value: string | undefined): void {
    this.appConfig.set(key, value);
  }

  get(key: string): string | undefined {
    return this.appConfig.get(key);
  }
}
