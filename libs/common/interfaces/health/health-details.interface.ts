export type IHealthDetails = {
  readonly bcryptRemaining: IHealthTableCounts;
  readonly fips: boolean;
  readonly fipsModeAsserted: boolean;
  readonly oldestUnmigratedLogin: null | string;
  readonly passwordHashWriteEnabled: boolean;
  readonly pbkdf2Migrated: IHealthTableCounts;
};

export type IHealthTableCounts = {
  readonly apiKeys: number;
  readonly users: number;
};
