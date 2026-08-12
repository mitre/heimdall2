import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { tokenProviders } from './token.providers';

@Module({
  exports: [JwtModule],
  imports: [...tokenProviders],
})
export class TokenModule {}
