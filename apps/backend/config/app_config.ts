import {Logger} from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

export default class AppConfig {
  private static instance: AppConfig;
  private readonly logger = new Logger(AppConfig.name);
  private envConfig: {[key: string]: string | undefined};

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
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  set(key: string, value: string | undefined): void {
    this.envConfig[key] = value;
  }

  get(key: string): string | undefined {
    return process.env[key] || this.envConfig[key];
  }

  getExternalUrl(): string {
    const external_url = this.get('EXTERNAL_URL');
    if (external_url === undefined) {
      return '';
    } else {
      return external_url;
    }
  }

  getSplunkHostUrl(): string {
    const splunk_host_url = this.get('SPLUNK_HOST_URL');
    if (splunk_host_url !== undefined) {
      return splunk_host_url;
    } else {
      return '';
    }
  }

  getTenableHostUrl(): string {
    const tenable_host_url = this.get('TENABLE_HOST_URL');
    if (tenable_host_url !== undefined) {
      return tenable_host_url;
    } else {
      return '';
    }
  }

  getDatabaseName(): string {
    const databaseName = this.get('DATABASE_NAME');
    const nodeEnvironment = this.get('NODE_ENV');

    if (databaseName !== undefined) {
      return databaseName;
    } else if (nodeEnvironment !== undefined) {
      return `heimdall-server-${nodeEnvironment.toLowerCase()}`;
    } else {
      throw new TypeError(
        'NODE_ENV and DATABASE_NAME are undefined. Unable to set database or use the default based on environment.'
      );
    }
  }

  getSSLConfig() {
    if (
      !this.get('DATABASE_SSL') ||
      this.get('DATABASE_SSL')?.toLowerCase() === 'false'
    ) {
      return false;
    }

    let sslKey, sslCert, sslCA;

    if (typeof this.get('DATABASE_SSL_KEY') === 'string') {
      if (this.get('DATABASE_SSL_KEY')?.indexOf('-BEGIN') !== -1) {
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
      if (this.get('DATABASE_SSL_CERT')?.indexOf('-BEGIN') !== -1) {
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
      if (this.get('DATABASE_SSL_CA')?.indexOf('-BEGIN') !== -1) {
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
      rejectUnauthorized:
        this.get('DATABASE_SSL_INSECURE') &&
        this.get('DATABASE_SSL_INSECURE')?.toLowerCase() !== 'true',
      key: sslKey,
      cert: sslCert,
      ca: sslCA
    };
  }

  getDefaultAdmin() {
    return this.get('ADMIN_EMAIL') || 'admin@heimdall.local';
  }

  getDbConfig() {
    return {
      username: this.get('DATABASE_USERNAME') || 'postgres',
      user: this.get('DATABASE_USERNAME') || 'postgres',
      role: this.get('DATABASE_USERNAME') || 'postgres',
      password: this.get('DATABASE_PASSWORD') || '',
      database: this.getDatabaseName(),
      host: this.get('DATABASE_HOST') || '127.0.0.1',
      port: Number(this.get('DATABASE_PORT')) || 5432,
      dialect: 'postgres' as const,
      dialectOptions: {
        ssl: this.getSSLConfig()
      },
      ssl: Boolean(this.get('DATABASE_SSL')) || false
    };
  }

  parseDatabaseUrl() {
    const url = this.get('DATABASE_URL');
    if (url === undefined) {
      return false;
    } else {
      const pattern =
        /^(?:([^:\/?#\s]+):\/{2})?(?:([^@\/?#\s]+)@)?([^\/?#\s]+)?(?:\/([^?#\s]*))?(?:[?]([^#\s]+))?\S*$/;
      const matches = url.match(pattern);

      if (matches === null) {
        return false;
      }

      this.set(
        'DATABASE_USERNAME',
        matches[2] !== undefined ? matches[2].split(':')[0] : undefined
      );
      this.set(
        'DATABASE_PASSWORD',
        matches[2] !== undefined ? matches[2].split(':')[1] : undefined
      );
      this.set(
        'DATABASE_HOST',
        matches[3] !== undefined ? matches[3].split(/:(?=\d+$)/)[0] : undefined
      );
      this.set(
        'DATABASE_NAME',
        matches[4] !== undefined ? matches[4].split('/')[0] : undefined
      );
      this.set(
        'DATABASE_PORT',
        matches[3] !== undefined ? matches[3].split(/:(?=\d+$)/)[1] : undefined
      );
      return true;
    }
  }
}
