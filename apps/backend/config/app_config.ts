import * as fs from 'fs';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

export default class AppConfig {
  private static instance: AppConfig;
  private readonly logger = new Logger(AppConfig.name);
  private envConfig: Record<string, string | undefined>;

  private constructor() {
    try {
      this.envConfig = dotenv.parse(fs.readFileSync('.env'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.envConfig = {};
        this.logger.warn('.env not found, using environment variables only');
      } else {
        throw error;
      }
    }
    this.parseDatabaseUrl();
  }

  static getInstance(): AppConfig {
    if (!this.instance) {
      this.instance = new AppConfig();
    }
    return this.instance;
  }

  set(key: string, value: string | undefined): void {
    this.envConfig[key] = value;
  }

  get(key: string): string | undefined {
    return process.env[key] || this.envConfig[key];
  }

  getExternalUrl(): string {
    const external_url = this.get('EXTERNAL_URL');
    return external_url === undefined ? '' : external_url;
  }

  getSplunkHostUrl(): string {
    const splunk_host_url = this.get('SPLUNK_HOST_URL');
    return splunk_host_url === undefined ? '' : splunk_host_url;
  }

  getTenableHostUrl(): string {
    const tenable_host_url = this.get('TENABLE_HOST_URL');
    return tenable_host_url === undefined ? '' : tenable_host_url;
  }

  getDatabaseName(): string {
    const databaseName = this.get('DATABASE_NAME');
    if (databaseName !== undefined) {
      return databaseName;
    }
    const nodeEnvironment = this.get('NODE_ENV');
    if (nodeEnvironment === undefined) {
      throw new TypeError(
        'NODE_ENV and DATABASE_NAME are undefined. Unable to set database or use the default based on environment.',
      );
    }
    return `heimdall-server-${nodeEnvironment.toLowerCase()}`;
  }

  getSSLConfig() {
    if (
      !this.get('DATABASE_SSL')
      || this.get('DATABASE_SSL')?.toLowerCase() === 'false'
    ) {
      return false;
    }

    let sslCA, sslCert, sslKey;

    if (typeof this.get('DATABASE_SSL_KEY') === 'string') {
      if (this.get('DATABASE_SSL_KEY')?.includes('-BEGIN') === true) {
        sslKey = this.get('DATABASE_SSL_KEY');
      } else {
        // Verify file exists
        if (fs.statSync(this.get('DATABASE_SSL_KEY')!).isFile()) {
          sslKey = fs.readFileSync(this.get('DATABASE_SSL_KEY')!);
        } else {
          throw new Error('SSL Key file does not exist');
        }
      }
    }

    if (typeof this.get('DATABASE_SSL_CERT') === 'string') {
      if (this.get('DATABASE_SSL_CERT')?.includes('-BEGIN') === true) {
        sslCert = this.get('DATABASE_SSL_CERT');
      } else {
        // Verify file exists
        if (fs.statSync(this.get('DATABASE_SSL_CERT')!).isFile()) {
          sslCert = fs.readFileSync(this.get('DATABASE_SSL_CERT')!);
        } else {
          throw new Error('SSL Cert file does not exist');
        }
      }
    }

    if (typeof this.get('DATABASE_SSL_CA') === 'string') {
      if (this.get('DATABASE_SSL_CA')?.includes('-BEGIN') === true) {
        sslCA = this.get('DATABASE_SSL_CA');
      } else {
        // Verify file exists
        if (fs.statSync(this.get('DATABASE_SSL_CA')!).isFile()) {
          sslCA = fs.readFileSync(this.get('DATABASE_SSL_CA')!);
        } else {
          throw new Error('SSL CA file does not exist');
        }
      }
    }

    return {
      ca: sslCA,
      cert: sslCert,
      key: sslKey,
      rejectUnauthorized:
        this.get('DATABASE_SSL_INSECURE')
        && this.get('DATABASE_SSL_INSECURE')?.toLowerCase() !== 'true',
    };
  }

  getDefaultAdmin() {
    return this.get('ADMIN_EMAIL') || 'admin@heimdall.local';
  }

  getDbConfig() {
    return {
      database: this.getDatabaseName(),
      dialect: 'postgres' as const,
      dialectOptions: { ssl: this.getSSLConfig() },
      host: this.get('DATABASE_HOST') || '127.0.0.1',
      password: this.get('DATABASE_PASSWORD') || '',
      port: Number(this.get('DATABASE_PORT')) || 5432,
      role: this.get('DATABASE_USERNAME') || 'postgres',
      ssl: Boolean(this.get('DATABASE_SSL')) || false,
      user: this.get('DATABASE_USERNAME') || 'postgres',
      username: this.get('DATABASE_USERNAME') || 'postgres',
    };
  }

  parseDatabaseUrl() {
    const url = this.get('DATABASE_URL');
    if (url === undefined) {
      return false;
    }

    try {
      const parsed = new URL(url);
      this.set('DATABASE_USERNAME', parsed.username || undefined);
      this.set('DATABASE_PASSWORD', parsed.password || undefined);
      this.set('DATABASE_HOST', parsed.hostname || undefined);
      this.set('DATABASE_NAME', parsed.pathname.slice(1).split('/', 1)[0] || undefined);
      this.set('DATABASE_PORT', parsed.port || undefined);
      return true;
    } catch {
      return false;
    }
  }
}
