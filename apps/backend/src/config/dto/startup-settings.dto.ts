import {IStartupSettings} from '@heimdall/interfaces';

export class StartupSettingsDto implements IStartupSettings {
  readonly banner: string;
  readonly enabledOAuth: string[];
  readonly OIDCName: string;
  readonly ldap: boolean;

  constructor(settings: IStartupSettings) {
    this.banner = settings.banner;
    this.enabledOAuth = settings.enabledOAuth;
    this.OIDCName = settings.OIDCName;
    this.ldap = settings.ldap;
  }
}
