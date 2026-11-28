import {
  AUTH_STRATEGY,
  OAUTH_AUTH_STRATEGIES,
} from '@heimdall/common/interfaces';
import type { AuthStrategy } from '@heimdall/common/interfaces';
import type { SequelizeOptions } from 'sequelize-typescript';
import AppConfig from '../../config/app_config';
import { StartupSettingsDto } from './dto/startup-settings.dto';

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
      enabledAuthStrategies.push(AUTH_STRATEGY.LOCAL);
    }
    if (this.get('LDAP_ENABLED')?.toLocaleLowerCase() === 'true') {
      enabledAuthStrategies.push(AUTH_STRATEGY.LDAP);
    }
    enabledAuthStrategies.push(...this.enabledOauthStrategies());
    if (
      ['SAML_NAME', 'SAML_ENTRY_POINT', 'SAML_ISSUER', 'SAML_IDP_CERT'].every(
        setting => this.get(setting),
      )
    ) {
      enabledAuthStrategies.push(AUTH_STRATEGY.SAML);
    }

    return enabledAuthStrategies;
  }

  enabledOauthStrategies(): AuthStrategy[] {
    return OAUTH_AUTH_STRATEGIES.filter(authStrategy =>
      this.get(`${authStrategy.toUpperCase()}_CLIENTID`),
    );
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
      samlName: this.get('SAML_NAME') || '',
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
    return this.getUploadSizeBytes('MAX_FILE_UPLOAD_SIZE', 50);
  }

  getMaxUploadFieldSizeBytes(): number {
    return this.getUploadSizeBytes('MAX_UPLOAD_FIELD_SIZE', 1);
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

  private getUploadSizeBytes(key: string, defaultMiB: number): number {
    const raw = this.get(key)?.trim() || String(defaultMiB);

    // Only an explicit zero disables the cap; numeric underflow must not.
    if (raw === '0') {
      return Infinity;
    }

    const bytes = Number(raw) * 1024 ** 2;
    if (!Number.isSafeInteger(bytes) || bytes <= 0) {
      throw new Error(
        `${key} must be 0 (unlimited) or a positive MiB value yielding a safe integer byte count`,
      );
    }

    return bytes;
  }
}
