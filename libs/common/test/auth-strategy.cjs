const assert = require('node:assert/strict');
const path = require('node:path');
const resolved = require.resolve('@heimdall/common/interfaces');
assert.equal(resolved, path.resolve(__dirname, '../lib/interfaces/index.js'));
const { AUTH_STRATEGIES, AUTH_STRATEGY, OAUTH_AUTH_STRATEGIES }
  = require('@heimdall/common/interfaces');
assert.deepEqual(AUTH_STRATEGIES, Object.values(AUTH_STRATEGY));
assert.equal(AUTH_STRATEGY.SAML, 'saml');
assert.ok(AUTH_STRATEGIES.includes('saml'));
assert.deepEqual(OAUTH_AUTH_STRATEGIES, ['github', 'gitlab', 'google', 'oidc', 'okta']);
for (const [key, value] of Object.entries(AUTH_STRATEGY)) {
  assert.equal(value, key.toLowerCase());
}
for (const value of OAUTH_AUTH_STRATEGIES) {
  assert.ok(AUTH_STRATEGIES.includes(value));
}
assert.ok(!OAUTH_AUTH_STRATEGIES.includes('local'));
assert.ok(!OAUTH_AUTH_STRATEGIES.includes('ldap'));
assert.ok(!OAUTH_AUTH_STRATEGIES.includes('saml'));
