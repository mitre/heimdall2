import { version as HDFConvertersVersion } from '../package.json'
import {
  ExecJSON
} from 'inspecjs';

class HeimdallDataFormat implements ExecJSON.Execution {
  platform: ExecJSON.Platform;
  profiles: ExecJSON.Profile[];
  statistics: ExecJSON.Statistics;
  version: string;

  constructor(
    platform: ExecJSON.Platform,
    profiles: ExecJSON.Profile[],
    statistics: ExecJSON.Statistics,
    version: string
  ) {
    this.platform = platform;
    this.profiles = profiles;
    this.statistics = statistics;
    this.version = HDFConvertersVersion;
  }
}
