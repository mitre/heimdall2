// Run only against the disposable database created by test-container.sh.
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const {randomInt} = require('node:crypto');
const {setTimeout: delay} = require('node:timers/promises');
const {test} = require('node:test');
const {brotliCompressSync, constants, deflateSync, gzipSync} = require('node:zlib');

const baseUrl = process.env.HEIMDALL_TEST_URL;
assert.ok(baseUrl, 'HEIMDALL_TEST_URL must point at a disposable test instance');

async function request(path, options = {}) {
  return fetch(new URL(path, baseUrl), {
    ...options,
    signal: AbortSignal.timeout(5000)
  });
}

test('production image', async (t) => {
  await t.test('runs the patched Node 22 runtime as a non-root user', () => {
    const [major, minor, patch] = process.versions.node.split('.').map(Number);
    assert.equal(major, 22);
    assert.ok(minor > 23 || (minor === 23 && patch >= 4), process.version);
    assert.notEqual(process.getuid(), 0);
    for (const command of ['npm', 'npx', 'yarn', 'php']) {
      assert.equal(spawnSync('/bin/sh', ['-c', `command -v ${command}`]).status, 1,
        `${command} should not be installed in the runtime image`);
    }
  });

  await t.test('starts through database migrations and serves configuration', async () => {
    for (let attempt = 0; attempt < 120; attempt++) {
      try {
        const response = await request('/server');
        if (response.ok) {
          const settings = await response.json();
          assert.equal(settings.localLoginEnabled, true);
          assert.equal(settings.registrationEnabled, true);
          return;
        }
      } catch (error) {
        if (error.name === 'AssertionError') throw error;
      }
      await delay(500);
    }
    assert.fail('Heimdall did not become ready');
  });

  await t.test('serves the built frontend and its JavaScript', async () => {
    const response = await request('/');
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<div[^>]+id=["']app["']/);
    const script = html.match(/<script[^>]+src=["']([^"']+\.js)["']/);
    assert.ok(script, 'expected a built JavaScript bundle');
    const bundle = await request(script[1]);
    assert.equal(bundle.status, 200);
    assert.match(bundle.headers.get('content-type'), /javascript/);
    await bundle.arrayBuffer();
  });

  const email = `container-smoke-${Date.now()}@example.test`;
  const password = Array.from({length: 20}, (_, index) => {
    // Alternate character classes to satisfy Heimdall's password rules.
    const characters = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz',
      '0123456789', '!@#$%^&*'][index % 4];
    return characters[randomInt(characters.length)];
  }).join('');
  let user;
  let token;
  await t.test('registers a user and persists it in PostgreSQL', async () => {
    const response = await request('/users', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({email, password, passwordConfirmation: password,
        role: 'user', creationMethod: 'local'})
    });
    assert.equal(response.status, 201, await response.clone().text());
    user = await response.json();
    assert.equal(user.email, email);
    assert.ok(user.id);
  });

  const login = Buffer.from(JSON.stringify({email, password}));
  for (const [encoding, compress] of [
    ['identity', (body) => body],
    ['gzip', gzipSync],
    ['deflate', deflateSync],
    ['br', brotliCompressSync]
  ]) {
    await t.test(`accepts ${encoding} JSON requests and authenticates`, async () => {
      const response = await request('/authn/login', {
        method: 'POST',
        headers: {'content-type': 'application/json', 'content-encoding': encoding},
        body: compress(login)
      });
      assert.equal(response.status, 201, await response.clone().text());
      const session = await response.json();
      assert.equal(session.userID, user.id);
      assert.ok(session.accessToken);
      token = session.accessToken;
    });
  }

  await t.test('supports URL-encoded login', async () => {
    const response = await request('/authn/login', {
      method: 'POST',
      body: new URLSearchParams({email, password})
    });
    assert.equal(response.status, 201, await response.clone().text());
    assert.equal((await response.json()).userID, user.id);
  });

  await t.test('preserves the JSON upload limit above Express defaults', async () => {
    const response = await request('/authn/login', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({email, password, padding: 'x'.repeat(128 * 1024)})
    });
    assert.equal(response.status, 201, await response.clone().text());
    assert.equal((await response.json()).userID, user.id);
  });

  await t.test('enforces the 50 MB limit after Brotli decompression', async () => {
    const response = await request('/authn/login', {
      method: 'POST',
      headers: {'content-type': 'application/json', 'content-encoding': 'br'},
      body: brotliCompressSync(Buffer.from(JSON.stringify({padding: 'x'.repeat(51 * 1024 * 1024)})),
        {params: {[constants.BROTLI_PARAM_QUALITY]: 0}})
    });
    assert.equal(response.status, 413, await response.clone().text());
    assert.equal((await request('/server')).status, 200);
  });

  await t.test('reads the authenticated user', async () => {
    const response = await request(`/users/${user.id}`, {
      headers: {authorization: `Bearer ${token}`}
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).email, email);
  });

  await t.test('uploads and retrieves evaluation data', async () => {
    const data = {platform: {name: 'container-smoke'}, profiles: []};
    const form = new FormData();
    form.set('filename', 'container-smoke.json');
    form.set('public', 'false');
    form.set('file', new Blob([JSON.stringify(data)], {type: 'application/json'}),
      'container-smoke.json');
    const uploaded = await request('/evaluations', {
      method: 'POST', headers: {authorization: `Bearer ${token}`}, body: form
    });
    assert.equal(uploaded.status, 201, await uploaded.clone().text());
    const evaluation = await uploaded.json();
    const retrieved = await request(`/evaluations/${evaluation.id}`, {
      headers: {authorization: `Bearer ${token}`}
    });
    assert.equal(retrieved.status, 200);
    assert.deepEqual((await retrieved.json()).data, data);
  });

  for (const contentType of ['application/json', 'application/x-www-form-urlencoded']) {
    await t.test(`rejects malformed Brotli ${contentType} and stays alive`, async () => {
      const response = await request('/authn/login', {
        method: 'POST',
        headers: {'content-type': contentType, 'content-encoding': 'br'},
        body: Buffer.from('not a Brotli stream')
      });
      assert.equal(response.status, 400, await response.clone().text());
      assert.equal((await request('/server')).status, 200);
    });
  }

  await t.test('rejects unsupported Content-Encoding and stays alive', async () => {
    const response = await request('/authn/login', {
      method: 'POST',
      headers: {'content-type': 'application/json', 'content-encoding': 'br, gzip'},
      body: login
    });
    assert.equal(response.status, 415);
    assert.equal((await request('/server')).status, 200);
  });
});
