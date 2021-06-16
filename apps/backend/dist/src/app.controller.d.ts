import { ConfigService } from './config/config.service';
import { StartupSettingsDto } from './config/dto/startup-settings.dto';
export declare class AppController {
    private readonly configService;
    constructor(configService: ConfigService);
    server(): StartupSettingsDto;
}
