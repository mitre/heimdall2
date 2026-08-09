import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { PasswordService } from './password.service';

/**
 * ADR-006 §5. PasswordService needs ConfigService, and ConfigModule is NOT
 * @Global() in this app, so the import is required — not optional. Exported so
 * the call-site cards can inject PasswordService.
 */
@Module({
  exports: [PasswordService],
  imports: [ConfigModule],
  providers: [PasswordService],
})
export class CryptoModule {}
