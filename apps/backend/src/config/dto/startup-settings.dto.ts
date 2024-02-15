import {IStartupSettings} from '@heimdall/interfaces';

export class StartupSettingsDto implements IStartupSettings {
  readonly apiKeysEnabled: boolean;
  readonly banner: string;
  readonly classificationBannerColor: string;
  readonly classificationBannerText: string;
  readonly classificationBannerTextColor: string;
  readonly enabledOAuth: string[];
  readonly oidcName: string;
  readonly projectMode: boolean;
  readonly ldap: boolean;
  readonly registrationEnabled: boolean;
  readonly localLoginEnabled: boolean;

  constructor(settings: IStartupSettings) {
    this.apiKeysEnabled = settings.apiKeysEnabled;
    this.banner = settings.banner;
    this.classificationBannerColor = settings.classificationBannerColor;
    this.classificationBannerText = settings.classificationBannerText;
    this.classificationBannerTextColor = settings.classificationBannerTextColor;
    this.enabledOAuth = settings.enabledOAuth;
    this.oidcName = settings.oidcName;
    this.projectMode = settings.projectMode;
    this.ldap = settings.ldap;
    this.registrationEnabled = settings.registrationEnabled;
    this.localLoginEnabled = settings.localLoginEnabled;
  }
}
