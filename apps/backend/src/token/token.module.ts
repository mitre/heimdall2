import {Module} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {tokenProviders} from './token.providers';

@Module({
  imports: [...tokenProviders],
  exports: [JwtModule]
})
export class TokenModule {}
