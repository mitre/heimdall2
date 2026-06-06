import {describe, expect, it} from 'vitest';
import {createAuth} from '../../auth.config';
import {authenticate} from 'ldap-authentication';
import {ldap} from './index';
import {LDAP_ERROR_CODES} from './error';

const LDAP_TEST_ENV = {
  LDAP_ENABLED: 'true',
  LDAP_HOST: 'ldap://localhost:10389',
  LDAP_BINDDN: 'cn=admin,dc=planetexpress,dc=com',
  LDAP_PASSWORD: 'GoodNewsEveryone',
  LDAP_SEARCHBASE: 'ou=people,dc=planetexpress,dc=com',
  LDAP_SEARCHFILTER: '(uid={{username}})',
  LDAP_NAMEFIELD: 'cn',
  LDAP_MAILFIELD: 'mail',
};

describe('LDAP provider config', () => {
  it('includes LDAP plugin when LDAP_ENABLED is true', () => {
    const auth = createAuth({envOverrides: LDAP_TEST_ENV});
    const plugins = auth.options.plugins || [];
    const ldapPlugin = plugins.find((p: {id?: string}) => p.id === 'ldap');
    expect(ldapPlugin).toBeDefined();
  });

  it('excludes LDAP plugin when LDAP_ENABLED is not set', () => {
    const auth = createAuth({envOverrides: {LDAP_ENABLED: undefined}});
    const plugins = auth.options.plugins || [];
    const ldapPlugin = plugins.find((p: {id?: string}) => p.id === 'ldap');
    expect(ldapPlugin).toBeUndefined();
  });

  it('excludes LDAP plugin when LDAP_ENABLED is false', () => {
    const auth = createAuth({envOverrides: {LDAP_ENABLED: 'false'}});
    const plugins = auth.options.plugins || [];
    const ldapPlugin = plugins.find((p: {id?: string}) => p.id === 'ldap');
    expect(ldapPlugin).toBeUndefined();
  });

  it('configures TLS with rejectUnauthorized true by default when LDAP_SSL is set', () => {
    const auth = createAuth({
      envOverrides: {...LDAP_TEST_ENV, LDAP_SSL: 'true'},
    });
    const plugins = auth.options.plugins || [];
    const ldapPlugin = plugins.find((p: {id?: string}) => p.id === 'ldap') as
      {options: {config: Array<{ldap: {ldapOpts: {tlsOptions?: {rejectUnauthorized: boolean}}}}>}};
    const tlsOpts = ldapPlugin.options.config[0].ldap.ldapOpts.tlsOptions;
    expect(tlsOpts).toBeDefined();
    expect(tlsOpts!.rejectUnauthorized).toBe(true);
  });

  it('sets rejectUnauthorized false when LDAP_SSL_INSECURE is true', () => {
    const auth = createAuth({
      envOverrides: {...LDAP_TEST_ENV, LDAP_SSL: 'true', LDAP_SSL_INSECURE: 'true'},
    });
    const plugins = auth.options.plugins || [];
    const ldapPlugin = plugins.find((p: {id?: string}) => p.id === 'ldap') as
      {options: {config: Array<{ldap: {ldapOpts: {tlsOptions?: {rejectUnauthorized: boolean}}}}>}};
    const tlsOpts = ldapPlugin.options.config[0].ldap.ldapOpts.tlsOptions;
    expect(tlsOpts!.rejectUnauthorized).toBe(false);
  });

  it('passes inline PEM for LDAP_SSL_CA directly', () => {
    const pemValue = '-----BEGIN CERTIFICATE-----\nMIIBtest\n-----END CERTIFICATE-----';
    const auth = createAuth({
      envOverrides: {...LDAP_TEST_ENV, LDAP_SSL: 'true', LDAP_SSL_CA: pemValue},
    });
    const plugins = auth.options.plugins || [];
    const ldapPlugin = plugins.find((p: {id?: string}) => p.id === 'ldap') as
      {options: {config: Array<{ldap: {ldapOpts: {tlsOptions?: {ca?: string | Buffer}}}}>}};
    const tlsOpts = ldapPlugin.options.config[0].ldap.ldapOpts.tlsOptions;
    expect(tlsOpts!.ca).toBe(pemValue);
  });

  it('reads LDAP_SSL_CA as file path when value does not contain BEGIN', () => {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const tmpFile = path.join(os.tmpdir(), 'test-ldap-ca.pem');
    const pemContent = '-----BEGIN CERTIFICATE-----\nFILECONTENT\n-----END CERTIFICATE-----';
    fs.writeFileSync(tmpFile, pemContent);
    try {
      const auth = createAuth({
        envOverrides: {...LDAP_TEST_ENV, LDAP_SSL: 'true', LDAP_SSL_CA: tmpFile},
      });
      const plugins = auth.options.plugins || [];
      const ldapPlugin = plugins.find((p: {id?: string}) => p.id === 'ldap') as
        {options: {config: Array<{ldap: {ldapOpts: {tlsOptions?: {ca?: string | Buffer}}}}>}};
      const tlsOpts = ldapPlugin.options.config[0].ldap.ldapOpts.tlsOptions;
      const caValue = tlsOpts!.ca;
      expect(caValue).toBeDefined();
      expect(caValue!.toString()).toContain('FILECONTENT');
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });
});

describe('LDAP mapProfileToUser callback', () => {
  it('maps Hermes profile to correct user info via buildLdapConfig', async () => {
    const auth = createAuth({envOverrides: LDAP_TEST_ENV});
    const plugins = auth.options.plugins || [];
    const ldapPlugin = plugins.find(
      (p: {id?: string; options?: {config?: Array<{mapProfileToUser?: Function}>}}) => p.id === 'ldap'
    ) as {options: {config: Array<{mapProfileToUser: Function}>}};

    const mapper = ldapPlugin.options.config[0].mapProfileToUser;
    const result = await mapper({
      providerId: 'ldap',
      username: 'hermes',
      profile: {
        uid: 'hermes',
        cn: 'Hermes Conrad',
        mail: 'hermes@planetexpress.com',
        dn: 'cn=Hermes Conrad,ou=people,dc=planetexpress,dc=com',
      },
      ctx: {},
    });

    expect(result.id).toBe('hermes');
    expect(result.email).toBe('hermes@planetexpress.com');
    expect(result.name).toBe('Hermes Conrad');
    expect(result.emailVerified).toBe(true);
  });

  it('handles multi-value mail attribute via normalizeString', async () => {
    const auth = createAuth({envOverrides: LDAP_TEST_ENV});
    const plugins = auth.options.plugins || [];
    const ldapPlugin = plugins.find(
      (p: {id?: string; options?: unknown}) => p.id === 'ldap'
    ) as {options: {config: Array<{mapProfileToUser: Function}>}};

    const mapper = ldapPlugin.options.config[0].mapProfileToUser;
    const result = await mapper({
      providerId: 'ldap',
      username: 'professor',
      profile: {
        uid: 'professor',
        cn: 'Hubert J. Farnsworth',
        mail: ['professor@planetexpress.com', 'hubert@planetexpress.com'],
        dn: 'cn=Hubert J. Farnsworth,ou=people,dc=planetexpress,dc=com',
      },
      ctx: {},
    });

    expect(result.email).toBe('professor@planetexpress.com');
  });

  it('falls back to username when uid is missing', async () => {
    const auth = createAuth({envOverrides: LDAP_TEST_ENV});
    const plugins = auth.options.plugins || [];
    const ldapPlugin = plugins.find(
      (p: {id?: string; options?: unknown}) => p.id === 'ldap'
    ) as {options: {config: Array<{mapProfileToUser: Function}>}};

    const mapper = ldapPlugin.options.config[0].mapProfileToUser;
    const result = await mapper({
      providerId: 'ldap',
      username: 'fallback-user',
      profile: {
        cn: 'Fallback User',
        mail: 'fallback@example.com',
      },
      ctx: {},
    });

    expect(result.id).toBe('fallback-user');
    expect(result.name).toBe('Fallback User');
  });

  it('uses custom LDAP_NAMEFIELD for name extraction', async () => {
    const auth = createAuth({
      envOverrides: {...LDAP_TEST_ENV, LDAP_NAMEFIELD: 'displayName'},
    });
    const plugins = auth.options.plugins || [];
    const ldapPlugin = plugins.find(
      (p: {id?: string; options?: unknown}) => p.id === 'ldap'
    ) as {options: {config: Array<{mapProfileToUser: Function}>}};

    const mapper = ldapPlugin.options.config[0].mapProfileToUser;
    const result = await mapper({
      providerId: 'ldap',
      username: 'hermes',
      profile: {
        uid: 'hermes',
        cn: 'H. Conrad',
        displayName: 'Hermes Conrad (Full Name)',
        mail: 'hermes@planetexpress.com',
      },
      ctx: {},
    });

    expect(result.name).toBe('Hermes Conrad (Full Name)');
  });
});

describe('LDAP plugin object (best practices from izw.16.11)', () => {
  const plugin = ldap({
    config: [{
      providerId: 'ldap',
      ldap: {
        ldapOpts: {url: 'ldap://localhost:10389'},
        adminDn: 'cn=admin,dc=planetexpress,dc=com',
        adminPassword: 'GoodNewsEveryone',
        userSearchBase: 'ou=people,dc=planetexpress,dc=com',
        usernameAttribute: 'uid',
      },
    }],
  });

  it('exports $ERROR_CODES on the plugin object', () => {
    expect(plugin.$ERROR_CODES).toBeDefined();
    expect(plugin.$ERROR_CODES).toBe(LDAP_ERROR_CODES);
  });

  it('includes a version string', () => {
    expect(plugin.version).toBeTypeOf('string');
    expect(plugin.version!.length).toBeGreaterThan(0);
  });

  it('includes rate limit rule for /sign-in/ldap', () => {
    expect(plugin.rateLimit).toBeDefined();
    expect(plugin.rateLimit!.length).toBeGreaterThan(0);
    const rule = plugin.rateLimit![0];
    expect(rule.pathMatcher('/sign-in/ldap')).toBe(true);
    expect(rule.pathMatcher('/sign-up/email')).toBe(false);
    expect(rule.max).toBeTypeOf('number');
    expect(rule.window).toBeTypeOf('number');
  });

  it('error codes have code and message properties (defineErrorCodes format)', () => {
    const firstCode = Object.values(LDAP_ERROR_CODES)[0];
    expect(firstCode).toHaveProperty('code');
    expect(firstCode).toHaveProperty('message');
    expect(firstCode.code).toBeTypeOf('string');
    expect(firstCode.message).toBeTypeOf('string');
  });

  it('AUTHENTICATION_FAILED error code has descriptive message', () => {
    expect(LDAP_ERROR_CODES.AUTHENTICATION_FAILED.code).toBe('AUTHENTICATION_FAILED');
    expect(LDAP_ERROR_CODES.AUTHENTICATION_FAILED.message).toBe('LDAP authentication failed');
  });
});

describe('LDAP integration (requires docker compose up -d ldap)', () => {
  it('authenticates Hermes Conrad against Planet Express LDAP', async () => {
    const user = await authenticate({
      ldapOpts: {url: 'ldap://localhost:10389'},
      adminDn: 'cn=admin,dc=planetexpress,dc=com',
      adminPassword: 'GoodNewsEveryone',
      userSearchBase: 'ou=people,dc=planetexpress,dc=com',
      usernameAttribute: 'uid',
      username: 'hermes',
      userPassword: 'hermes',
    });
    expect(user).toBeDefined();
    expect(user.cn).toBe('Hermes Conrad');
    expect(user.mail).toBe('hermes@planetexpress.com');
  });

  it('rejects invalid LDAP password', async () => {
    await expect(
      authenticate({
        ldapOpts: {url: 'ldap://localhost:10389'},
        adminDn: 'cn=admin,dc=planetexpress,dc=com',
        adminPassword: 'GoodNewsEveryone',
        userSearchBase: 'ou=people,dc=planetexpress,dc=com',
        usernameAttribute: 'uid',
        username: 'hermes',
        userPassword: 'wrongpassword',
      })
    ).rejects.toThrow();
  });

  it('rejects nonexistent LDAP user', async () => {
    await expect(
      authenticate({
        ldapOpts: {url: 'ldap://localhost:10389'},
        adminDn: 'cn=admin,dc=planetexpress,dc=com',
        adminPassword: 'GoodNewsEveryone',
        userSearchBase: 'ou=people,dc=planetexpress,dc=com',
        usernameAttribute: 'uid',
        username: 'nonexistent',
        userPassword: 'anything',
      })
    ).rejects.toThrow();
  });

  it('authenticates Professor Farnsworth', async () => {
    const user = await authenticate({
      ldapOpts: {url: 'ldap://localhost:10389'},
      adminDn: 'cn=admin,dc=planetexpress,dc=com',
      adminPassword: 'GoodNewsEveryone',
      userSearchBase: 'ou=people,dc=planetexpress,dc=com',
      usernameAttribute: 'uid',
      username: 'professor',
      userPassword: 'professor',
    });
    expect(user).toBeDefined();
    expect(user.cn).toBe('Hubert J. Farnsworth');
    const emails = Array.isArray(user.mail) ? user.mail : [user.mail];
    expect(emails).toContain('professor@planetexpress.com');
  });
});
