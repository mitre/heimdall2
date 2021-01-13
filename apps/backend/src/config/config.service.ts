import {SequelizeOptions} from 'sequelize-typescript';
import AppConfig from '../../config/app_config';
import {StartupSettingsDto} from './dto/startup-settings.dto';

export class ConfigService {
  private readonly appConfig: AppConfig;

  constructor() {
    this.appConfig = new AppConfig();
  }

  frontendStartupSettings(): StartupSettingsDto {
    return new StartupSettingsDto({banner: this.get('WARNING_BANNER') || ''});
  }

  getDbConfig(): SequelizeOptions {
    return this.appConfig.getDbConfig();
  }

  set(key: string, value: string | undefined): void {
    this.appConfig.set(key, value);
  }

  get(key: string): string | undefined {
    return this.appConfig.get(key);
  }
}
