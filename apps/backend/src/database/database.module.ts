import {Module} from '@nestjs/common';
import {DatabaseService} from './database.service';
import {SequelizeModule} from '@nestjs/sequelize';
import {ConfigModule} from '../config/config.module';
import {ConfigService} from '../config/config.service';

function getDatabaseName(configService: ConfigService): string {
  if (
    configService.get('DATABASE_NAME') === undefined &&
    configService.get('NODE_ENV') === undefined
  ) {
    throw new TypeError(
      'NODE_ENV and DATABASE_NAME are undefined. Unable to set database or use the default based on environment.'
    );
  } else if (
    configService.get('DATABASE_NAME') === undefined &&
    configService.get('NODE_ENV') !== undefined
  ) {
    return `heimdall-server-${configService.get('NODE_ENV').toLowerCase()}`;
  } else {
    return configService.get('DATABASE_NAME');
  }
}

function getSynchronize(configService: ConfigService): boolean {
  if (configService.get('NODE_ENV') === undefined) {
    throw new TypeError('NODE_ENV is not set and must be provided.');
  } else {
    return configService.get('NODE_ENV').toLowerCase() === 'test'
      ? false
      : true;
  }
}

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get('DATABASE_HOST') || '127.0.0.1',
        port: Number(configService.get('DATABASE_PORT')) || 5432,
        username: configService.get('DATABASE_USERNAME') || 'postgres',
        password: configService.get('DATABASE_PASSWORD') || '',
        database: getDatabaseName(configService),
        autoLoadModels: true,
        synchronize: getSynchronize(configService),
        logging: false,
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
