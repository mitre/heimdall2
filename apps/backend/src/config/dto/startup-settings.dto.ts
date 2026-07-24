import type {AuthStrategy, IStartupSettings} from '@heimdall/common/interfaces';

export class StartupSettingsDto implements IStartupSettings {
  readonly apiKeysEnabled: boolean;
  readonly banner: string;
  readonly classificationBannerColor: string;
  readonly classificationBannerText: string;
  readonly classificationBannerTextColor: string;
  readonly enabledAuthStrategies: AuthStrategy[];
  readonly externalUrl: string;
  readonly forceTenableFrontend: boolean;
  readonly oidcName: string;
  readonly registrationEnabled: boolean;
  readonly splunkHostUrl: string;
  readonly tenableHostUrl: string;

  constructor(settings: IStartupSettings) {
    this.apiKeysEnabled = settings.apiKeysEnabled;
    this.banner = settings.banner;
    this.classificationBannerColor = settings.classificationBannerColor;
    this.classificationBannerText = settings.classificationBannerText;
    this.classificationBannerTextColor = settings.classificationBannerTextColor;
    this.enabledAuthStrategies = settings.enabledAuthStrategies;
    this.externalUrl = settings.externalUrl;
    this.oidcName = settings.oidcName;
    this.registrationEnabled = settings.registrationEnabled;
    this.tenableHostUrl = settings.tenableHostUrl;
    this.forceTenableFrontend = settings.forceTenableFrontend;
    this.splunkHostUrl = settings.splunkHostUrl;
  }
}
