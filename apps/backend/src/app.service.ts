import os from 'os';
import {
  BeforeApplicationShutdown,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import winston from 'winston';

@Injectable()
export class AppService
implements
    BeforeApplicationShutdown,
    OnApplicationBootstrap,
    OnApplicationShutdown {
  private readonly line = '____________________________________________\n';
  public logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss Z' }),
      winston.format.errors({ stack: true }),
      winston.format.align(),
      winston.format.printf(
        info =>
          `${this.line}[${[info.timestamp]}] (App Service): ${info.message}`,
      ),
    ),
    transports: [new winston.transports.Console()],
  });

  private colors = winston.addColors({
    error: 'red',
    info: 'cyan',
    verbose: 'blue',
    warn: 'yellow',
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
