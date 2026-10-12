import os from 'os';
import {
  BeforeApplicationShutdown,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { addColors, createLogger, format, transports } from 'winston';

@Injectable()
export class AppService
implements
    BeforeApplicationShutdown,
    OnApplicationBootstrap,
    OnApplicationShutdown {
  private colors = addColors({
    error: 'red',
    info: 'cyan',
    verbose: 'blue',
    warn: 'yellow',
  });

  private readonly line = '____________________________________________\n';

  public logger = createLogger({
    format: format.combine(
      format.colorize({ all: true }),
      format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss Z' }),
      format.errors({ stack: true }),
      format.align(),
      format.printf(
        info =>
          `${this.line}[${String([info.timestamp])}] (App Service): ${String(info.message)}`,
      ),
    ),
    transports: [new transports.Console()],
  });

  beforeApplicationShutdown(signal: string): void {
    this.logger.info({ message: `Received ${signal}, starting shutdown for PID ${process.pid}` });
  }

  onApplicationBootstrap(): void {
    this.logger.info({
      message: `Started Heimdall Enterprise Server on ${os.hostname()} (${os.platform()} ${os.release()}) with PID ${
        process.pid
      } and UID ${process.getuid?.()}`,
    });
  }

  onApplicationShutdown(signal: string): void {
    this.logger.info({ message: `Finished shutdown for ${signal} for PID ${process.pid}` });
  }
}
