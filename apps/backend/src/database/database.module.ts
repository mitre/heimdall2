import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import winston from 'winston';
import {ConfigModule} from '../config/config.module';
import {ConfigService} from '../config/config.service';
import {DatabaseService} from './database.service';

const sensitiveKeys = [
  /cookie/i,
  /passw(or)?d/i,
  /^pw$/,
  /^pass$/i,
  /secret/i,
  /token/i,
  /api[-._]?key/i,
  /data/i
];

const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'MMM-DD-YYYY HH:mm:ss Z'
    }),
    winston.format.printf((info) => `[${[info.timestamp]}] ${info.message}`)
  )
});

function getSynchronize(configService: ConfigService): boolean {
  const nodeEnvironment = configService.get('NODE_ENV');
  if (nodeEnvironment === undefined) {
    throw new TypeError('NODE_ENV is not set and must be provided.');
  } else {
    return nodeEnvironment === 'test' ? false : true;
  }
}

function toObject(fields: string[], values?: string[]): Record<number, string> {
  if (values) {
    const result: Record<number, string> = {};
    for (let i = 0; i < values.length; i++) {
      if (!sensitiveKeys.some((regex) => regex.test(fields[i]))) {
        result[i] = values[i];
      } else {
        result[i] = '[REDACTED]';
      }
    }
    return result;
  } else {
    return {};
  }
}

function logQuery(
  sql: string,
  connection: {fields: string[]; bind: string[]; type: string}
) {
  if (connection.type === 'INSERT' || connection.type === 'UPDATE') {
    const matches = sql.match(/\$\d/gm);
    const values = toObject(connection.fields, connection.bind);

    if (matches) {
      matches.forEach((placeholder, index) => {
        sql = sql.replace(placeholder, `"${values[index]}"`);
      });
    }
    logger.info({message: sql});
  } else {
    logger.info({message: sql});
  }
}

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.getDbConfig(),
        autoLoadModels: true,
        synchronize: getSynchronize(configService),
        logging: (sql, connection) => {
          logQuery(
            sql,
            // Connection is incorrectly typed as a number
            connection as unknown as {
              fields: string[];
              bind: string[];
              type: string;
            }
          );
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      })
    })
  ],
  providers: [DatabaseService],
  exports: [DatabaseService]
})
export class DatabaseModule {}
