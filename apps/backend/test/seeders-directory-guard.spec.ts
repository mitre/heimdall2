import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * sequelize-cli loads EVERY file matching its pattern from the seeders
 * directory and calls `up` on it. A support module parked there — a shared
 * helper, a constants file — is therefore not inert: umzug throws
 * "Could not find migration method: up", sequelize-cli's seedAll catch calls
 * process.exit(1), and `cmd.sh` runs `db:seed:all` under `set -e` on line 8
 * BEFORE `yarn backend start` on line 9. The container never boots.
 *
 * That shipped once (demo-seed-helpers.js, caught by AC review on
 * heimdall2-sked.2, confirmed by running db:seed:all and reading exit 1), so it
 * is guarded here rather than left to reviewer vigilance. This is an
 * executable guard over the real directory, not a grep: it scans what
 * sequelize-cli will actually load.
 *
 * Matches sequelize-cli's own pattern, node_modules/sequelize-cli/lib/core/
 * migrator.js:52 — every .js/.cjs/.ts/.cts except .d.ts.
 */
// fileURLToPath rather than import.meta.dirname: the latter is only backported
// to ^22.16.0 and this repo's engines floor is >=22.18.0, a range that also
// admits Node 23, where it does not exist.
const SEEDERS_DIRECTORY = fileURLToPath(new URL('../seeders', import.meta.url));
const SEQUELIZE_CLI_PATTERN = /^(?!.*\.d\.ts$).*\.(?:cjs|cts|js|ts)$/;

function filesSequelizeWillLoad(): string[] {
  return readdirSync(SEEDERS_DIRECTORY)
    .filter((name) => SEQUELIZE_CLI_PATTERN.test(name))
    .toSorted((a, b) => a.localeCompare(b));
}

describe('seeders directory', () => {
  it('is not empty — a guard over an empty list would pass vacuously', () => {
    expect(filesSequelizeWillLoad().length).toBeGreaterThan(0);
  });

  it.each(filesSequelizeWillLoad())(
    '%s exports both up and down, so db:seed:all can run it',
    async (name) => {
      const loaded = (await import(path.join(SEEDERS_DIRECTORY, name))) as {
        down?: unknown;
        up?: unknown;
      };

      // `up` is what umzug calls and what its absence kills the run over.
      // `down` is required for the seeder to be reversible.
      expect(typeof loaded.up).toBe('function');
      expect(typeof loaded.down).toBe('function');
    },
  );
});
