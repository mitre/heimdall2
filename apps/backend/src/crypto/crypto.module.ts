import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '../config/config.module';
import { User } from '../users/user.model';
import { HashMigrationMarker } from './hash-migration-marker.model';
import { HashWriteGateService } from './hash-write-gate.service';
import { PasswordService } from './password.service';

/**
 * ADR-006 §5. PasswordService needs ConfigService, and ConfigModule is NOT
 * @Global() in this app, so the import is required — not optional. Exported so
 * the call-site cards can inject PasswordService.
 *
 * §12: HashWriteGateService needs the durable-marker table and the Users
 * table (the fresh-install probe), so this module registers both models —
 * making CryptoModule self-contained: importing it is all a consumer (or a
 * test module) needs.
 */
@Module({
  exports: [HashWriteGateService, PasswordService],
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([HashMigrationMarker, User]),
  ],
  providers: [HashWriteGateService, PasswordService],
})
export class CryptoModule {}
