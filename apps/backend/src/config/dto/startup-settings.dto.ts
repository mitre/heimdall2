import {IStartupSettings} from '@heimdall/interfaces';

export class StartupSettingsDto implements IStartupSettings {
  readonly banner: string;
  readonly enabledOAuth: string[];
  readonly oidcName: string;
  readonly ldap: boolean;

  constructor(settings: IStartupSettings) {
    this.banner = settings.banner;
    this.enabledOAuth = settings.enabledOAuth;
    this.oidcName = settings.oidcName;
    this.ldap = settings.ldap;
  }
}
