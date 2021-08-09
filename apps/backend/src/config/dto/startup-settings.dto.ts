import {IStartupSettings} from '@heimdall/interfaces';

export class StartupSettingsDto implements IStartupSettings {
  readonly banner: string;
  readonly classificationLevel: string;
  readonly enabledOAuth: string[];
  readonly oidcName: string;
  readonly ldap: boolean;
  readonly registrationEnabled: boolean;

  constructor(settings: IStartupSettings) {
    this.banner = settings.banner;
    this.classificationLevel = settings.classificationLevel;
    this.enabledOAuth = settings.enabledOAuth;
    this.oidcName = settings.oidcName;
    this.ldap = settings.ldap;
    this.registrationEnabled = settings.registrationEnabled;
  }
}
