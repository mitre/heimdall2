import {
  BeforeApplicationShutdown,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown
} from '@nestjs/common';
import os from 'os';
import winston from 'winston';

@Injectable()
export class AppService
  implements
    OnApplicationBootstrap,
    BeforeApplicationShutdown,
    OnApplicationShutdown
{
  private readonly line = '____________________________________________\n';
  private colors = winston.addColors({
    info: 'cyan',
    warn: 'yellow',
    error: 'red',
    verbose: 'blue'
  });

  public logger = winston.createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({
        format: 'MMM-DD-YYYY HH:mm:ss Z'
      }),
      winston.format.errors({ stack: true }),
      winston.format.align(),
      winston.format.printf((info) => `${this.line}[${[info.timestamp]}] (App Service): ${info.message}`)
    )
  });


  onApplicationBootstrap(): void {
    this.logger.info({
      message: `Started Heimdall Enterprise Server on ${os.hostname()} (${os.platform()} ${os.release()}) with PID ${
        process.pid
      } and UID ${process.getuid?.()}`
    });
  }

  beforeApplicationShutdown(signal: string): void {
    this.logger.info({
      message: `Received ${signal}, starting shutdown for PID ${process.pid}`
    });
  }
  onApplicationShutdown(signal: string): void {
    this.logger.info({
      message: `Finished shutdown for ${signal} for PID ${process.pid}`
    });
  }
}
