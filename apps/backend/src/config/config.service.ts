import {SequelizeOptions} from 'sequelize-typescript';
import AppConfig from '../../config/app_config';
import {AuthArtiAuthCreds} from '../../config/app_config';
import {StartupSettingsDto} from './dto/startup-settings.dto';

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

  isProjectMode(): boolean {
    return this.get('PROJECT_MODE')?.toLowerCase() === 'true';
  }

  enabledOauthStrategies() {
    const enabledOauth: string[] = [];
    supportedOauth.forEach((oauthStrategy) => {
      if (this.get(`${oauthStrategy.toUpperCase()}_CLIENTID`)) {
        enabledOauth.push(oauthStrategy);
      }
    });
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
      oidcName: this.get('OIDC_NAME') || '',
      projectMode: this.isProjectMode(),
      ldap: this.get('LDAP_ENABLED')?.toLocaleLowerCase() === 'true' || false,
      registrationEnabled: this.isRegistrationAllowed(),
      localLoginEnabled: this.isLocalLoginAllowed()
    });
  }

  getDbConfig(): SequelizeOptions {
    return this.appConfig.getDbConfig();
  }

  getSSLConfig(): false | Record<string, unknown> {
    return this.appConfig.getSSLConfig();
  }

  getAuthArtiS3URL(): string {
    return this.appConfig.getAuthArtiS3URL();
  }

  getAuthArtiS3BucketName(): string {
    return this.appConfig.getAuthArtiS3BucketName();
  }

  getAuthArtiS3AuthCreds(): AuthArtiAuthCreds {
    return this.appConfig.getAuthArtiS3AuthCreds();
  }

  set(key: string, value: string | undefined): void {
    this.appConfig.set(key, value);
  }

  get(key: string): string | undefined {
    return this.appConfig.get(key);
  }
}
export const supportedOauth: string[] = [
  'github',
  'gitlab',
  'google',
  'okta',
  'oidc'
];
