import {SequelizeOptions} from 'sequelize-typescript';
import AppConfig from '../../config/app_config';
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
      externalUrl: this.getExternalUrl(),
      oidcName: this.get('OIDC_NAME') || '',
      ldap: this.get('LDAP_ENABLED')?.toLocaleLowerCase() === 'true' || false,
      registrationEnabled: this.isRegistrationAllowed(),
      localLoginEnabled: this.isLocalLoginAllowed(),
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

  getTenableHostUrl(): string[] {
    return this.appConfig.getTenableHostUrl();
  }

  getDbConfig(): SequelizeOptions {
    return this.appConfig.getDbConfig();
  }

  getMaxFilesPerUpload(): number {
    const raw = this.get('MAX_FILES_PER_UPLOAD')?.trim() || '100';

    // Only an explicit zero disables the cap; numeric underflow must not.
    if (raw === '0') {
      return Infinity;
    }

    const count = Number(raw);
    if (!Number.isSafeInteger(count) || count <= 0) {
      throw new Error(
        'MAX_FILES_PER_UPLOAD must be 0 (unlimited) or a positive safe integer',
      );
    }

    return count;
  }

  getMaxFileUploadSizeBytes(): number {
    const raw = this.get('MAX_FILE_UPLOAD_SIZE')?.trim() || '50';

    // Only an explicit zero disables the cap; numeric underflow must not.
    if (raw === '0') {
      return Infinity;
    }

    const bytes = Number(raw) * 1024 ** 2;
    if (!Number.isSafeInteger(bytes) || bytes <= 0) {
      throw new Error(
        'MAX_FILE_UPLOAD_SIZE must be 0 (unlimited) or a positive MiB value yielding a safe integer byte count',
      );
    }

    return bytes;
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
export const supportedOauth: string[] = [
  'github',
  'gitlab',
  'google',
  'okta',
  'oidc'
];
