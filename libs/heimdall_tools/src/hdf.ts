import { version as HeimdallToolsVersion } from '../package.json'
import {
  ExecJSON,
  ExecJSONProfile,
  Platform,
  Statistics
} from 'inspecjs/dist/generated_parsers/v_1_0/exec-json';

class HeimdallDataFormat implements ExecJSON {
  platform: Platform;
  profiles: ExecJSONProfile[];
  statistics: Statistics;
  version: string;

  constructor(
    platform: Platform,
    profiles: ExecJSONProfile[],
    statistics: Statistics,
    version: string
  ) {
    this.platform = platform;
    this.profiles = profiles;
    this.statistics = statistics;
    this.version = HeimdallToolsVersion;
  }
}
