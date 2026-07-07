import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import winston from 'winston';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from './database.service';

const line = '________________________________________________\n';
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss Z' }),
    winston.format.errors({ stack: true }),
    winston.format.align(),
    winston.format.printf(
      info =>
        `${line}[${info.timestamp}] Query(${info.queryType}): ${info.message}`,
    ),
  ),
  transports: [new winston.transports.Console()],
});

const localConfigService = new ConfigService();

function getSynchronize(configService: ConfigService): boolean {
  const nodeEnvironment = configService.get('NODE_ENV');
  if (nodeEnvironment === undefined) {
    throw new TypeError('NODE_ENV is not set and must be provided.');
  } else {
    return nodeEnvironment === 'test' ? false : true;
  }
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
