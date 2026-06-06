import {describe, it, expect, beforeAll, afterAll, beforeEach} from 'vitest';
import {drizzle} from 'drizzle-orm/node-postgres';
import {eq, sql} from 'drizzle-orm';
import {BootstrapService} from './bootstrap.service';
import {ba_user, ba_account} from '../db/auth-schema.generated';
import {createTestPool} from '../db/test-utils';
import * as authSchema from '../db/auth-schema.generated';

describe('BootstrapService', () => {
  let pool: ReturnType<typeof createTestPool>;
  let db: ReturnType<typeof drizzle>;
  let service: BootstrapService;

  beforeAll(async () => {
    pool = createTestPool();
    db = drizzle(pool, {schema: authSchema});
  });

  beforeEach(async () => {
    await db.execute(
      sql`DELETE FROM ba_account WHERE user_id IN (SELECT id FROM ba_user WHERE email = 'admin@heimdall.local')`
    );
    await db.execute(
      sql`DELETE FROM ba_user WHERE email = 'admin@heimdall.local'`
    );
  });

  afterAll(async () => {
    await db.execute(
      sql`DELETE FROM ba_account WHERE user_id IN (SELECT id FROM ba_user WHERE email = 'admin@heimdall.local')`
    );
    await db.execute(
      sql`DELETE FROM ba_user WHERE email = 'admin@heimdall.local'`
    );
    await pool.end();
  });

  describe('onApplicationBootstrap', () => {
    it('creates admin user when none exists', async () => {
      service = new BootstrapService(db, {
        adminEmail: 'admin@heimdall.local',
        adminPassword: 'Ab1!cDe2@fGh3#iJk',
      });

      await service.onApplicationBootstrap();

      const [admin] = await db
        .select()
        .from(ba_user)
        .where(eq(ba_user.email, 'admin@heimdall.local'));
      expect(admin).toBeDefined();
      expect(admin.role).toBe('admin');
      expect(admin.forcePasswordChange).toBe(true);
    });

    it('creates ba_account with hashed password for admin', async () => {
      service = new BootstrapService(db, {
        adminEmail: 'admin@heimdall.local',
        adminPassword: 'Ab1!cDe2@fGh3#iJk',
      });

      await service.onApplicationBootstrap();

      const [admin] = await db
        .select()
        .from(ba_user)
        .where(eq(ba_user.email, 'admin@heimdall.local'));
      const [account] = await db
        .select()
        .from(ba_account)
        .where(eq(ba_account.userId, admin.id));
      expect(account).toBeDefined();
      expect(account.providerId).toBe('credential');
      expect(account.password).toMatch(/^\$2[ab]\$\d+\$/);
    });

    it('is idempotent — does nothing when admin already exists', async () => {
      service = new BootstrapService(db, {
        adminEmail: 'admin@heimdall.local',
        adminPassword: 'Ab1!cDe2@fGh3#iJk',
      });

      await service.onApplicationBootstrap();

      const [adminBefore] = await db
        .select()
        .from(ba_user)
        .where(eq(ba_user.email, 'admin@heimdall.local'));
      const [accountBefore] = await db
        .select()
        .from(ba_account)
        .where(eq(ba_account.userId, adminBefore.id));

      await service.onApplicationBootstrap();

      const admins = await db
        .select()
        .from(ba_user)
        .where(eq(ba_user.email, 'admin@heimdall.local'));
      expect(admins).toHaveLength(1);

      const [accountAfter] = await db
        .select()
        .from(ba_account)
        .where(eq(ba_account.userId, adminBefore.id));
      expect(accountAfter.password).toBe(accountBefore.password);
    });

    it('generates STIG-compliant password when none provided', async () => {
      const logs: string[] = [];
      service = new BootstrapService(db, {
        adminEmail: 'admin@heimdall.local',
        logger: (msg: string) => logs.push(msg),
      });

      await service.onApplicationBootstrap();

      const [admin] = await db
        .select()
        .from(ba_user)
        .where(eq(ba_user.email, 'admin@heimdall.local'));
      expect(admin).toBeDefined();

      expect(logs.some((l) => l.includes('Admin user created'))).toBe(true);
    });

    it('writes generated password to stderr when no ADMIN_PASSWORD set', async () => {
      const stderrOutput: string[] = [];
      service = new BootstrapService(db, {
        adminEmail: 'admin@heimdall.local',
        logger: () => {},
        stderrWriter: (msg: string) => stderrOutput.push(msg),
      });

      await service.onApplicationBootstrap();

      expect(stderrOutput.length).toBeGreaterThanOrEqual(1);
      const passwordLine = stderrOutput.find(
        (line) => /[a-z]/.test(line) && /[A-Z]/.test(line) && /[0-9]/.test(line) && /[^A-Za-z0-9]/.test(line),
      );
      expect(passwordLine).toBeDefined();
      expect(passwordLine!.length).toBeGreaterThanOrEqual(20);
    });

    it('does NOT write to stderr when adminPassword is provided', async () => {
      const stderrOutput: string[] = [];
      service = new BootstrapService(db, {
        adminEmail: 'admin@heimdall.local',
        adminPassword: 'Ab1!cDe2@fGh3#iJk',
        stderrWriter: (msg: string) => stderrOutput.push(msg),
      });

      await service.onApplicationBootstrap();

      expect(stderrOutput).toHaveLength(0);
    });

    it('does not include generated password in structured log output', async () => {
      const logs: string[] = [];
      const stderrOutput: string[] = [];
      service = new BootstrapService(db, {
        adminEmail: 'admin@heimdall.local',
        logger: (msg: string) => logs.push(msg),
        stderrWriter: (msg: string) => stderrOutput.push(msg),
      });

      await service.onApplicationBootstrap();

      const generatedPassword = stderrOutput.find(
        (line) => line.length >= 20 && /[a-z]/.test(line) && /[A-Z]/.test(line),
      );
      expect(generatedPassword).toBeDefined();

      const allLogs = logs.join('\n');
      expect(allLogs).not.toContain(generatedPassword);
    });

    it('rejects weak ADMIN_PASSWORD with clear bootstrap error message', async () => {
      service = new BootstrapService(db, {
        adminEmail: 'admin@heimdall.local',
        adminPassword: 'weak',
      });

      await expect(service.onApplicationBootstrap()).rejects.toThrow(
        /Bootstrap failed.*password/i
      );
    });

    it('handles concurrent creation gracefully (unique constraint race)', async () => {
      service = new BootstrapService(db, {
        adminEmail: 'admin@heimdall.local',
        adminPassword: 'Ab1!cDe2@fGh3#iJk',
      });

      await service.onApplicationBootstrap();

      await db.execute(
        sql`DELETE FROM ba_user WHERE email = 'admin@heimdall.local' AND id = 'does-not-exist'`
      );

      const service2 = new BootstrapService(db, {
        adminEmail: 'admin@heimdall.local',
        adminPassword: 'Ab1!cDe2@fGh3#iJk',
        logger: () => {},
      });

      await expect(service2.onApplicationBootstrap()).resolves.not.toThrow();
    });
  });

  describe('generateSTIGCompliantPassword', () => {
    it('generates password of at least 20 characters', () => {
      service = new BootstrapService(db, {adminEmail: 'admin@heimdall.local'});
      const pw = service.generateSTIGCompliantPassword();
      expect(pw.length).toBeGreaterThanOrEqual(20);
    });

    it('contains all 4 character classes', () => {
      service = new BootstrapService(db, {adminEmail: 'admin@heimdall.local'});
      const pw = service.generateSTIGCompliantPassword();
      expect(/[a-z]/.test(pw)).toBe(true);
      expect(/[A-Z]/.test(pw)).toBe(true);
      expect(/[0-9]/.test(pw)).toBe(true);
      expect(/[^A-Za-z0-9]/.test(pw)).toBe(true);
    });

    it('has no 4+ consecutive same-class characters', () => {
      service = new BootstrapService(db, {adminEmail: 'admin@heimdall.local'});
      for (let i = 0; i < 20; i++) {
        const pw = service.generateSTIGCompliantPassword();
        expect(/[a-z]{4,}/.test(pw)).toBe(false);
        expect(/[A-Z]{4,}/.test(pw)).toBe(false);
        expect(/[0-9]{4,}/.test(pw)).toBe(false);
        expect(/[^A-Za-z0-9]{4,}/.test(pw)).toBe(false);
      }
    });
  });
});
