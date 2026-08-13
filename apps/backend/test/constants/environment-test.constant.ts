export const ENV_MOCK_FILE
  = 'PORT=8000\n'
    + 'DATABASE_HOST=localhost\n'
    + 'DATABASE_PORT=5432\n'
    + 'DATABASE_USERNAME=postgres\n'
    + 'DATABASE_PASSWORD=postgres\n'
    + 'DATABASE_NAME=heimdallts_vitest_testing_service_db\n'
    + 'JWT_SECRET=abc123\n'
    + 'NODE_ENV=test\n';

export const SIMPLE_ENV_MOCK_FILE = 'PORT=8001\n';

export const DATABASE_URL_MOCK_ENV
  = 'DATABASE_URL=postgres://abcdefghijk123456:000011112222333344455556666777778889999aaaabbbbccccddddeeeffff@ec2-00-000-11-123.compute-1.amazonaws.com:5432/database01';

// GitLab's client secret has two accepted spellings. GITLAB_CLIENTSECRET is
// canonical — it matches GITHUB_CLIENTSECRET / GOOGLE_CLIENTSECRET /
// OKTA_CLIENTSECRET and is what .env-example and the RPM man page have always
// documented. GITLAB_SECRET is the legacy name the strategy actually read, so
// deployments configured against the code rather than the docs keep working.
export const GITLAB_CANONICAL_SECRET_ENV
  = 'GITLAB_CLIENTSECRET=canonical-secret\n';

export const GITLAB_LEGACY_SECRET_ENV = 'GITLAB_SECRET=legacy-secret\n';

export const GITLAB_BOTH_SECRETS_ENV
  = 'GITLAB_CLIENTSECRET=canonical-secret\nGITLAB_SECRET=legacy-secret\n';

export const GITLAB_EMPTY_CANONICAL_SECRET_ENV
  = 'GITLAB_CLIENTSECRET=\nGITLAB_SECRET=legacy-secret\n';
