import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    ConfigModule
  ],
})
export class AppModule {}
