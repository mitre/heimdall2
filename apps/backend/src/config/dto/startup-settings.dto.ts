import {IStartupSettings} from '@heimdall/interfaces';

export class StartupSettingsDto implements IStartupSettings {
  readonly banner: string;

  constructor(settings: IStartupSettings) {
    this.banner = settings.banner;
  }
}
