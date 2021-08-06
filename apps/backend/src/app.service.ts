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
  public logger = winston.createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'MMM-DD-YYYY HH:mm:ss Z'
      }),
      winston.format.printf((info) => `[${[info.timestamp]}] ${info.message}`)
    )
  });

  onApplicationBootstrap(): void {
    this.logger.info({
      message: `Started Heimdall Enterprise Server 2.0 on ${os.hostname()} (${os.platform()} ${os.release()}) with PID ${
        process.pid
      } and UID ${process.getuid()}`
    });
  }

  beforeApplicationShutdown(signal: string): void {
    this.logger.info({
      message: `Recieved ${signal}, starting shutdown for PID ${process.pid}`
    });
  }
  onApplicationShutdown(signal: string): void {
    this.logger.info({
      message: `Finished shutdown for ${signal} for PID ${process.pid}`
    });
  }
}
