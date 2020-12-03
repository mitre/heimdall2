import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {UsersModule} from 'src/users/users.module';
import {ConfigModule} from '../config/config.module';
import {ConfigService} from '../config/config.service';
import {DatabaseController} from './database.controller';
import {DatabaseService} from './database.service';

function getDatabaseName(configService: ConfigService): string {
  const databaseName = configService.get('DATABASE_NAME');
  const nodeEnvironment = configService.get('NODE_ENV');

  if (databaseName !== undefined) {
    return databaseName;
  } else if (nodeEnvironment !== undefined) {
    return `heimdall-server-${nodeEnvironment.toLowerCase()}`;
  } else {
    throw new TypeError(
      'NODE_ENV and DATABASE_NAME are undefined. Unable to set database or use the default based on environment.'
    );
  }
}

function getSynchronize(configService: ConfigService): boolean {
  const nodeEnvironment = configService.get('NODE_ENV');
  if (nodeEnvironment === undefined) {
    throw new TypeError('NODE_ENV is not set and must be provided.');
  } else {
    return nodeEnvironment === 'test' ? false : true;
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
    }),
    UsersModule,
    ConfigModule
  ],
  controllers: [DatabaseController],
  providers: [DatabaseService],
  exports: [DatabaseService]
})
export class DatabaseModule {}
