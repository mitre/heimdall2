import * as nodeCrypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { version as backendVersion } from '../../package.json';
import { ConfigService } from '../config/config.service';
import { HashWriteGateService } from '../crypto/hash-write-gate.service';
import { HealthDetailsDto, HealthDto } from './dto/health.dto';

/**
 * ADR-006 §17: the split health surface. The liveness half returns
 * {status, version} ONLY — migration state (fips, write gate, hash counts) is
 * a disclosure decision the Risks table forbids on any unauthenticated
 * surface, and it lives behind auth on /health/details instead.
 *
 * The version is the backend's own package.json version — the backend analog
 * of the frontend's build-time PACKAGE_VERSION (vue.config.js reads the same
 * field from its package.json). resolveJsonModule emits the file into dist/,
 * so the compiled require resolves at runtime.
 *
 * The count queries are §17's single-scan FILTER shape over BOTH credential
 * tables — the prior draft's Users-only query is the documented mistake
 * (bcrypt_remaining could read 0 while every ApiKeys row was still $2b$).
 * Each call runs the full scans: no caching, and never wire these into a
 * readiness probe (§17 — self-inflicted outage).
 */

const USERS_HASH_COUNTS_SQL = `
SELECT count(*) FILTER (WHERE "encryptedPassword" LIKE '$2%')::int       AS "bcryptRemaining",
       count(*) FILTER (WHERE "encryptedPassword" LIKE '$pbkdf2-%')::int AS "pbkdf2Migrated",
       (max(age(now(), "lastLogin"))
          FILTER (WHERE "encryptedPassword" LIKE '$2%'))::text           AS "oldestUnmigratedLogin"
FROM "Users"`;

const API_KEYS_HASH_COUNTS_SQL = `
SELECT count(*) FILTER (WHERE "apiKey" LIKE '$2%')::int       AS "bcryptRemaining",
       count(*) FILTER (WHERE "apiKey" LIKE '$pbkdf2-%')::int AS "pbkdf2Migrated"
FROM "ApiKeys"`;

type ApiKeysHashCountsRow = {
  readonly bcryptRemaining: number;
  readonly pbkdf2Migrated: number;
};

type UsersHashCountsRow = {
  readonly bcryptRemaining: number;
  readonly oldestUnmigratedLogin: null | string;
  readonly pbkdf2Migrated: number;
};

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly hashWriteGate: HashWriteGateService,
    private readonly sequelize: Sequelize,
  ) {}

  async getDetails(): Promise<HealthDetailsDto> {
    const userCounts = await this.sequelize.query<UsersHashCountsRow>(
      USERS_HASH_COUNTS_SQL,
      { plain: true, type: QueryTypes.SELECT },
    );
    const apiKeyCounts = await this.sequelize.query<ApiKeysHashCountsRow>(
      API_KEYS_HASH_COUNTS_SQL,
      { plain: true, type: QueryTypes.SELECT },
    );
    if (userCounts === null || apiKeyCounts === null) {
      // A single-row aggregate cannot return an empty set; a null here means
      // the query itself broke and must never read as "zero remaining".
      throw new Error('hash-count aggregate returned no row');
    }
    return new HealthDetailsDto({
      bcryptRemaining: {
        apiKeys: apiKeyCounts.bcryptRemaining,
        users: userCounts.bcryptRemaining,
      },
      fips: nodeCrypto.getFips() === 1,
      // Exact-match semantics shared with assertFipsMode (§10): only the
      // literal 'true' asserts, anything else reports unasserted here and is
      // warned about or refused at boot.
      fipsModeAsserted: this.configService.get('FIPS_MODE') === 'true',
      oldestUnmigratedLogin: userCounts.oldestUnmigratedLogin,
      passwordHashWriteEnabled: await this.hashWriteGate.writesEnabled(),
      pbkdf2Migrated: {
        apiKeys: apiKeyCounts.pbkdf2Migrated,
        users: userCounts.pbkdf2Migrated,
      },
    });
  }

  getHealth(): HealthDto {
    return new HealthDto({ status: 'ok', version: backendVersion });
  }
}
