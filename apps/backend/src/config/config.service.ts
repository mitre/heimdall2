import type { SequelizeOptions } from 'sequelize-typescript';
import AppConfig from '../../config/app_config';
import { StartupSettingsDto } from './dto/startup-settings.dto';

export class ConfigService {
  public defaultGithubAPIURL = 'https://api.github.com/';
  public defaultGithubBaseURL = 'https://github.com/';
  public sensitiveKeys = [
    /cookie/i,
    /passw(or)?d/i,
    /^pw$/v,
    /^pass$/i,
    /secret/i,
    /token/i,
    /api[-._]?key/i,
    /data/iv,
  ];

  private readonly appConfig: AppConfig;

  constructor() {
    this.appConfig = AppConfig.getInstance();
  }

  enabledOauthStrategies() {
    const enabledOauth: string[] = [];
    for (const oauthStrategy of supportedOauth) {
      if (this.get(`${oauthStrategy.toUpperCase()}_CLIENTID`)) {
        enabledOauth.push(oauthStrategy);
      }
    }
    return enabledOauth;
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
      enabledOAuth: this.enabledOauthStrategies(),
      externalUrl: this.getExternalUrl(),
      forceTenableFrontend:
        this.get('FORCE_TENABLE_FRONTEND')?.toLowerCase() === 'true',
      ldap: this.get('LDAP_ENABLED')?.toLocaleLowerCase() === 'true' || false,
      localLoginEnabled: this.isLocalLoginAllowed(),
      oidcName: this.get('OIDC_NAME') || '',
      registrationEnabled: this.isRegistrationAllowed(),
      splunkHostUrl: this.getSplunkHostUrl(),
      tenableHostUrl: this.getTenableHostUrl(),
    });
  }

  get(key: string): string | undefined {
    return this.appConfig.get(key);
  }

  getDbConfig(): SequelizeOptions {
    return this.appConfig.getDbConfig();
  }

  getExternalUrl(): string {
    return this.appConfig.getExternalUrl();
  }

  getSplunkHostUrl(): string {
    return this.appConfig.getSplunkHostUrl();
  }

  getSSLConfig(): false | Record<string, unknown> {
    return this.appConfig.getSSLConfig();
  }

  getTenableHostUrl(): string {
    return this.appConfig.getTenableHostUrl();
  }

  isInProductionMode(): boolean {
    return this.get('NODE_ENV')?.toLowerCase() === 'production';
  }

  isLocalLoginAllowed(): boolean {
    return this.get('LOCAL_LOGIN_DISABLED')?.toLowerCase() !== 'true';
  }

  isRegistrationAllowed(): boolean {
    return this.get('REGISTRATION_DISABLED')?.toLowerCase() !== 'true';
  }

  set(key: string, value: string | undefined): void {
    this.appConfig.set(key, value);
  }
}
export const supportedOauth: string[] = [
  'github',
  'gitlab',
  'google',
  'okta',
  'oidc',
];
