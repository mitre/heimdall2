import { Module } from '@nestjs/common';
import { tokenProviders } from './token.providers';

@Module({
  imports: [...tokenProviders],
  exports: [...tokenProviders],
})
export class TokenModule {
}
