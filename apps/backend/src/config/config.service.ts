import type { SequelizeOptions } from 'sequelize-typescript';
import AppConfig from '../../config/app_config';
import { StartupSettingsDto } from './dto/startup-settings.dto';

export class ConfigService {
  private readonly appConfig: AppConfig;

  public defaultGithubAPIURL = 'https://api.github.com/';
  public defaultGithubBaseURL = 'https://github.com/';
  public sensitiveKeys = [
    /cookie/iv,
    /passw(?:or)?d/iv,
    /^pw$/v,
    /^pass$/iv,
    /secret/iv,
    /token/iv,
    /api[\-._]?key/iv,
    /data/iv,
  ];

  constructor() {
    this.appConfig = new AppConfig();
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
      ldap: (this.get('LDAP_ENABLED')?.toLocaleLowerCase() === 'true'),
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

  /**
   * GitLab's client secret accepts two names. GITLAB_CLIENTSECRET is canonical:
   * it matches GITHUB_CLIENTSECRET / GOOGLE_CLIENTSECRET / OKTA_CLIENTSECRET,
   * and it is the name apps/backend/.env-example and the RPM man page have
   * always documented. GITLAB_SECRET is the legacy name this application
   * actually read, so it stays supported — dropping it would break every
   * deployment configured from the code rather than the docs.
   *
   * The canonical name wins when both are set. An empty value counts as unset,
   * matching AppConfig.get's own truthiness fallback.
   */
  getGitlabClientSecret(): string | undefined {
    return this.get('GITLAB_CLIENTSECRET') || this.get('GITLAB_SECRET');
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
