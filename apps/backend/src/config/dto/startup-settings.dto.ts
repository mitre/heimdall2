import {IStartupSettings} from '@heimdall/interfaces';

export class StartupSettingsDto implements IStartupSettings {
  readonly banner: string;
  readonly ldap: boolean;

  constructor(settings: IStartupSettings) {
    this.banner = settings.banner;
    this.ldap = settings.ldap;
  }
}
