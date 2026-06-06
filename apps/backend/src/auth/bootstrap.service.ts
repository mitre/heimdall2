import {randomInt} from 'node:crypto';
import {Injectable, OnApplicationBootstrap, Logger} from '@nestjs/common';
import {eq} from 'drizzle-orm';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';
import {userFactory} from '../db/factories/user.factory';
import {ba_user} from '../db/auth-schema.generated';

export interface BootstrapConfig {
  adminEmail: string;
  adminPassword?: string;
  logger?: (msg: string) => void;
  stderrWriter?: (msg: string) => void;
}

@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private readonly db: NodePgDatabase<Record<string, unknown>>;
  private readonly config: BootstrapConfig;
  private readonly logger: Logger;
  private readonly log: (msg: string) => void;
  private readonly writeStderr: (msg: string) => void;

  constructor(
    db: NodePgDatabase<Record<string, unknown>>,
    config: BootstrapConfig
  ) {
    this.db = db;
    this.config = config;
    this.logger = new Logger(BootstrapService.name);
    this.log = config.logger ?? this.logger.log.bind(this.logger);
    this.writeStderr = config.stderrWriter ?? ((msg) => process.stderr.write(`${msg}\n`));
  }

  async onApplicationBootstrap(): Promise<void> {
    const existing = await this.db
      .select({id: ba_user.id})
      .from(ba_user)
      .where(eq(ba_user.email, this.config.adminEmail));

    if (existing.length > 0) {
      this.log(`Admin user ${this.config.adminEmail} already exists — skipping bootstrap`);
      return;
    }

    const password =
      this.config.adminPassword ?? this.generateSTIGCompliantPassword();

    if (!this.config.adminPassword) {
      this.writeStderr(`Generated admin password for ${this.config.adminEmail} — change on first login.`);
      this.writeStderr(password);
    }

    try {
      await userFactory.create(this.db, {
        email: this.config.adminEmail,
        name: 'Admin',
        role: 'admin',
        forcePasswordChange: true,
        password,
      });
      this.log(`Admin user created: ${this.config.adminEmail}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('unique') || message.includes('duplicate')) {
        this.log(`Admin user ${this.config.adminEmail} created by another instance — skipping`);
        return;
      }
      throw new Error(`Bootstrap failed: admin password rejected — ${message}`);
    }
  }

  generateSTIGCompliantPassword(): string {
    const classes = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '0123456789',
      '!@#$%^&*()-_=+',
    ];
    const chars: string[] = [];
    for (let i = 0; i < 20; i++) {
      const cls = classes[i % 4];
      chars.push(cls[randomInt(cls.length)]);
    }
    return chars.join('');
  }
}
