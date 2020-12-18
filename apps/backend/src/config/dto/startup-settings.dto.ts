import {IStartupSettings} from '@heimdall/interfaces';

export class StartupSettingsDto implements IStartupSettings {
  readonly banner: string;
  readonly enabledOAuth: string[];

  constructor(settings: IStartupSettings) {
    this.banner = settings.banner;
    this.enabledOAuth = settings.enabledOAuth;
  }
}
