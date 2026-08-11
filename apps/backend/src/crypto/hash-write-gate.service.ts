import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { createLogger, format, transports } from 'winston';
import { ConfigService } from '../config/config.service';
import { User } from '../users/user.model';
import { HashMigrationMarker } from './hash-migration-marker.model';
import {
  assertValidHashWriteSetting,
  deriveHashWriteState,
  HashWriteDecision,
  SUPPORTED_HASH_MARKER_VERSION,
} from './hash-write-decision';

export { SUPPORTED_HASH_MARKER_VERSION } from './hash-write-decision';

/**
 * ADR-006 §12: the rollout write gate. One question — may this process write
 * PBKDF2 credentials? — answered once per boot, plus the durable marker's
 * planting and the mechanism-3 startup refusal.
 *
 * The gate covers ALL PBKDF2 writes (sites 1, 2, 7, 8 and both rehash
 * paths): PasswordService.hash consults it for new-credential writes
 * (falling back to bcrypt when off, so a pre-N pod can still read the row),
 * and the rehash call sites consult writesEnabled() to skip persistence.
 */
@Injectable()
export class HashWriteGateService {
  public logger = createLogger({
    format: format.printf(info => `[Hash Write Gate]: ${String(info.message)}`),
    transports: [new transports.Console()],
  });

  private derivation?: HashWriteDecision;
  private markerPlanted = false;

  constructor(
    @InjectModel(HashMigrationMarker)
    private readonly markerModel: typeof HashMigrationMarker,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly configService: ConfigService,
  ) {
    // §9: out-of-range configuration throws at startup, never clamps.
    assertValidHashWriteSetting(
      this.configService.get('PASSWORD_HASH_WRITE_ENABLED'),
    );
  }

  /**
   * §12 mechanism 3 — the downgrade refusal, in the application because RPM
   * %pre cannot fire on the downgrades it targets (on downgrade the OLDER
   * package's %pre runs, built before the guard existed) and because this
   * path also catches the pg_dump-restore hazard. Called from bootstrap()
   * before the app starts listening.
   */
  async assertMarkerCompatible(): Promise<void> {
    const newest = await this.markerModel.max<null | number, HashMigrationMarker>('markerVersion');
    if (typeof newest === 'number' && newest > SUPPORTED_HASH_MARKER_VERSION) {
      throw new Error(
        `REFUSING TO START: this database records credential write epoch ${newest}, but this build understands only epoch ${SUPPORTED_HASH_MARKER_VERSION} — it was written to by a NEWER Heimdall release, and credentials written under epoch ${newest} would silently fail to verify here. Remedy: reinstall the newer release (or, after an accidental restore, restore a database backup taken under this release). Do not delete the HashMigrationMarkers row to force startup — that trades this loud refusal for silent authentication failures.`,
      );
    }
  }

  /**
   * §12 planting trigger (settled 2026-08-05): the marker is planted on the
   * FIRST PBKDF2 write — never at install or migration time, which would
   * record something untrue. findOrCreate keyed on the epoch makes planting
   * idempotent across pods. A planting failure is loud but must never fail
   * the credential write it accompanies: the write itself goes to the same
   * database, so a real outage surfaces there with its own error, while the
   * marker's protection is only needed on a LATER downgrade.
   */
  async plantMarker(): Promise<void> {
    if (this.markerPlanted) {
      return;
    }
    try {
      await this.markerModel.findOrCreate({ defaults: { pbkdf2WritesBeganAt: new Date() }, where: { markerVersion: SUPPORTED_HASH_MARKER_VERSION } });
      this.markerPlanted = true;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const message = `failed to plant the §12 hash-migration marker (epoch ${SUPPORTED_HASH_MARKER_VERSION}); downgrade protection is NOT recorded for this write: ${reason}`;
      this.logger.error({ message });
    }
  }

  /**
   * §12 derivation (settled 2026-08-05): an explicit env value wins;
   * otherwise the gate is ON when PBKDF2 writes have already begun on this
   * database (marker present — sticky across restarts) or on a fresh install
   * (empty Users table at first boot — no pre-N peer can exist), and OFF
   * only on an upgrade, where a rolling window with pre-N pods is possible.
   *
   * Boot-scoped: derived once per service instance and cached — the §12
   * rolling-window question is about this process's release, which does not
   * change while it runs.
   */
  async writesEnabled(): Promise<boolean> {
    if (this.derivation === undefined) {
      this.derivation = await this.derive();
      this.logger.info({
        message: `PBKDF2 writes ${
          this.derivation.enabled ? 'ENABLED' : 'DISABLED'
        } — ${this.derivation.reason}`,
      });
    }
    return this.derivation.enabled;
  }

  private async derive(): Promise<HashWriteDecision> {
    const explicitSetting = this.configService.get(
      'PASSWORD_HASH_WRITE_ENABLED',
    );
    if (explicitSetting === 'true' || explicitSetting === 'false') {
      // An explicit setting decides alone — no DB probes (the manual test
      // constructions with unregistered model classes rely on this).
      return deriveHashWriteState({
        explicitSetting,
        markerPresent: false,
        usersPresent: false,
      });
    }
    const hasMarker = (await this.markerModel.count()) > 0;
    const hasUsers = (await this.userModel.count()) > 0;
    return deriveHashWriteState({
      explicitSetting,
      markerPresent: hasMarker,
      usersPresent: hasUsers,
    });
  }
}
