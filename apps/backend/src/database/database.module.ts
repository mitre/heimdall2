import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { createLogger, format, transports } from 'winston';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from './database.service';

const line = '________________________________________________\n';
const logger = createLogger({
  format: format.combine(
    format.colorize({ all: true }),
    format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss Z' }),
    format.errors({ stack: true }),
    format.align(),
    format.printf(
      info =>
        `${line}[${String(info.timestamp)}] Query(${String(info.queryType)}): ${String(info.message)}`,
    ),
  ),
  transports: [new transports.Console()],
});

const localConfigService = new ConfigService();

function getSynchronize(configService: ConfigService): boolean {
  const nodeEnvironment = configService.get('NODE_ENV');
  if (nodeEnvironment === undefined) {
    throw new TypeError('NODE_ENV is not set and must be provided.');
  }
  return nodeEnvironment === 'test' ? false : true;
}

function logQuery(
  sql: string,
  connection: { bind: string[]; fields: string[]; type: string },
) {
  logger.info({
    message: `${sql} [${sanitize(connection.fields, connection.bind).join(
      ', ',
    )}]`,
    queryType: connection.type,
  });
}

function sanitize(fields: string[], values?: string[]): string[] {
  return (
    values?.map((value, index) => {
      return localConfigService.sensitiveKeys.some(regex =>
        regex.test(fields[index + 1]),
      )
        ? 'REDACTED'
        : value;
    }) || []
  );
}

@Module({
  exports: [DatabaseService],
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.getDbConfig(),
        autoLoadModels: true,
        logging: (sql, connection) => {
          logQuery(
            sql,
            // Connection is incorrectly typed as a number
            connection as unknown as {
              bind: string[];
              fields: string[];
              type: string;
            },
          );
        },
        pool: {
          acquire: 30_000,
          idle: 10_000,
          max: 5,
          min: 0,
        },
        synchronize: getSynchronize(configService),
      }),
    }),
  ],
  providers: [DatabaseService],
})
export class DatabaseModule {}
