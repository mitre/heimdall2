import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from './config/config.module';
import { AuthzModule } from './authz/authz.module';
import { AuthnModule } from './authn/authn.module';

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    ConfigModule,
    AuthzModule,
    AuthnModule
  ]
})
export class AppModule {}
