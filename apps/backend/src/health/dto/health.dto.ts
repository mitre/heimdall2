import type {
  IHealth,
  IHealthDetails,
  IHealthTableCounts,
} from '@heimdall/common/interfaces';

export class HealthDetailsDto implements IHealthDetails {
  readonly bcryptRemaining: IHealthTableCounts;
  readonly fips: boolean;
  readonly fipsModeAsserted: boolean;
  readonly oldestUnmigratedLogin: null | string;
  readonly passwordHashWriteEnabled: boolean;
  readonly pbkdf2Migrated: IHealthTableCounts;

  constructor(details: IHealthDetails) {
    this.bcryptRemaining = details.bcryptRemaining;
    this.fips = details.fips;
    this.fipsModeAsserted = details.fipsModeAsserted;
    this.oldestUnmigratedLogin = details.oldestUnmigratedLogin;
    this.passwordHashWriteEnabled = details.passwordHashWriteEnabled;
    this.pbkdf2Migrated = details.pbkdf2Migrated;
  }
}

export class HealthDto implements IHealth {
  readonly status: string;
  readonly version: string;

  constructor(health: IHealth) {
    this.status = health.status;
    this.version = health.version;
  }
}
