'use strict';
// Shared pieces of the demo-data seed. Mirrors mitre/vulcan's
// `lib/seed_helpers.rb`: one roster, one shared password, and the guard that
// decides whether demo data may be created at all.
//
// This file is CommonJS and lives outside the TS project because sequelize-cli
// owns the seeders directory — the same constraint the administrator seeder
// documents.
const dotenv = require('dotenv');
const fs = require('fs');

/**
 * A shift/unshift keyboard walk: the eight physical keys `1 q a z 2 w s x`
 * typed once unshifted and then again with shift held. Easy to type, hard to
 * mistype, and trivially memorable — which is the point for a credential whose
 * whole purpose is to be publicly documented.
 *
 * NOT Vulcan's `12qwaszx!@QWASZX`, despite this file otherwise mirroring
 * Vulcan's convention. That string groups all six letters of each walk
 * together, which trips heimdall's third validator — "no 4 consecutive
 * characters of the same character class" (libs/password-complexity), a rule
 * Vulcan's policy does not implement. Walking by COLUMN instead puts a digit
 * at the head of each group, so no class ever runs past three:
 *
 *   1 qaz 2 wsx  !  QAZ  @  WSX
 *   d 3low d 3low sp 3up sp 3up
 *
 * The spec asserts this against the real policy module rather than by
 * inspection, because a seeded password the application would reject is a
 * broken seed. (Aaron, 2026-08-15.)
 */
const DEMO_PASSWORD = '1qaz2wsx!QAZ@WSX';

/**
 * Email-as-role, per Vulcan, whose seed calls this out as being for "a
 * 30-second login/logout test loop".
 *
 * The api-* pair is deliberately separate from the human logins, for the
 * reason Vulcan records: one active session per account, so scripted token
 * access never evicts a person's browser session.
 *
 * NOTE: `role` here is Users.role — the APP-WIDE concept (admin|user).
 * GroupUsers.role (owner|member) is a different column and is seeded by
 * heimdall2-sked.2.
 */
const DEMO_USERS = [
  {
    email: 'admin@example.com',
    firstName: 'Demo',
    lastName: 'Admin',
    role: 'admin',
  },
  {
    email: 'user@example.com',
    firstName: 'Demo',
    lastName: 'User',
    role: 'user',
  },
  {
    email: 'api-admin@example.com',
    firstName: 'API',
    lastName: 'Admin',
    role: 'admin',
  },
  {
    email: 'api-user@example.com',
    firstName: 'API',
    lastName: 'User',
    role: 'user',
  },
];

const DEMO_EMAILS = DEMO_USERS.map((user) => user.email);

/**
 * One demo group, so the GROUP-SCOPED authorization paths are reachable.
 * `Groups.name` is NOT NULL and UNIQUE (migration 20230725092535), `desc` is
 * NOT NULL with a '' default (20230712110759), and `public` is NOT NULL — all
 * three are supplied explicitly rather than relying on defaults.
 */
const DEMO_GROUP = {
  desc: 'Seeded demo group. Development and test only — see the seed system docs.',
  name: 'Demo Group',
  public: false
};

/**
 * Memberships REUSE the accounts from the user seeder rather than minting
 * group-specific ones, following Vulcan's `05_memberships.rb`, which assigns
 * memberships to its existing demo users.
 *
 * `role` here is GroupUsers.role — owner|member, scoped to one group. That is
 * a different column from Users.role (admin|user) above, and confusing the two
 * produces a seed that looks correct and exercises nothing.
 */
const DEMO_MEMBERSHIPS = [
  {email: 'admin@example.com', role: 'owner'},
  {email: 'user@example.com', role: 'member'}
];

/**
 * Read `.env` and overlay the real environment, exactly as the administrator
 * seeder does — process.env wins.
 */
function readEnvConfig() {
  let envConfig = {};
  try {
    envConfig = dotenv.parse(fs.readFileSync('.env'));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    // No .env is normal outside development; fall through to process.env.
  }
  return {...envConfig, ...process.env};
}

/**
 * Vulcan's two-concern pattern: production seeds always run, demo data is
 * opt-in. `packaging/rpm/cmd.sh` runs `db:seed:all` on EVERY container start,
 * so without this guard these known-credential accounts would be created in
 * production. That is the whole reason the guard lives in code rather than in
 * operator discipline.
 */
function demoSeedEnabled(envConfig) {
  if (String(envConfig.SEED_DEMO_DATA || '').toLowerCase() === 'true') {
    return true;
  }
  const nodeEnv = envConfig.NODE_ENV || 'development';
  return nodeEnv === 'development' || nodeEnv === 'test';
}

function resolvePassword(envConfig) {
  return envConfig.SEED_PASSWORD || DEMO_PASSWORD;
}

/**
 * Honour the same tuning knob the application uses; when unset, fall through
 * to the crypto module's own default (600000) rather than restating it here.
 */
function hashOptions(envConfig) {
  // Number() rather than parseInt(): unset -> NaN and '' -> 0 both fail the
  // `> 0` test below, so the guard is what makes the coercion safe here.
  const iterations = Number(envConfig.PASSWORD_HASH_ITERATIONS);
  return Number.isFinite(iterations) && iterations > 0 ? {iterations} : undefined;
}

module.exports = {
  DEMO_EMAILS,
  DEMO_GROUP,
  DEMO_MEMBERSHIPS,
  DEMO_PASSWORD,
  DEMO_USERS,
  demoSeedEnabled,
  hashOptions,
  readEnvConfig,
  resolvePassword,
};
