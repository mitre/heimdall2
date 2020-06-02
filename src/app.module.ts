import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from './config/config.module';
import { AuthzModule } from './authz/authz.module';

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    ConfigModule,
    AuthzModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
