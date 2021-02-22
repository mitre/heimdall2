import {Module} from '@nestjs/common';
import {PassportModule} from '@nestjs/passport';
import {ConfigModule} from '../config/config.module';
import {TokenModule} from '../token/token.module';
import {UsersModule} from '../users/users.module';
import {ShareController} from './share.controller';

@Module({
  imports: [UsersModule, PassportModule, TokenModule, ConfigModule],
  providers: [],
  controllers: [ShareController]
})
export class ShareModule {}
