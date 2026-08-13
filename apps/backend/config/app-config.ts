import * as fs from 'fs';
import * as dotenv from 'dotenv';

export default class AppConfig {
  private envConfig: Map<string, string | undefined>;

  constructor() {
    console.log('Attempting to read configuration file `.env`!');
    try {
      this.envConfig = new Map(Object.entries(dotenv.parse(fs.readFileSync('.env'))));
      console.log('Read config!');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.envConfig = new Map();
        // File probably does not exist
        console.log('Unable to read configuration file `.env`!');
        console.log('Falling back to environment or undefined values!');
      } else {
        throw error;
      }
    }
    if (this.parseDatabaseUrl()) {
      console.log(
        'DATABASE_URL parsed into smaller components (i.e. DATABASE_USER)',
      );
    }
  }

  get(key: string): string | undefined {
    /* eslint-disable-next-line security/detect-object-injection --
       No code fix exists: process.env is the platform's exotic object with no
       .get(), and reading a dynamically named variable requires bracket
       access. Every caller passes a compile-time constant name; values are
       operator-set. */
    return process.env[key] || this.envConfig.get(key);
  }

  getDatabaseName(): string {
    const databaseName = this.get('DATABASE_NAME');
    const nodeEnvironment = this.get('NODE_ENV');

    if (databaseName !== undefined) {
      return databaseName;
    }
    if (nodeEnvironment === undefined) {
      throw new TypeError(
        'NODE_ENV and DATABASE_NAME are undefined. Unable to set database or use the default based on environment.',
      );
    }
    return `heimdall-server-${nodeEnvironment.toLowerCase()}`;
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
      ssl: Boolean(this.get('DATABASE_SSL')),
      user: this.get('DATABASE_USERNAME') || 'postgres',
      username: this.get('DATABASE_USERNAME') || 'postgres',
    };
  }

  getDefaultAdmin() {
    return this.get('ADMIN_EMAIL') || 'admin@heimdall.local';
  }

  getExternalUrl(): string {
    const external_url = this.get('EXTERNAL_URL');
    return external_url === undefined ? '' : external_url;
  }

  getSplunkHostUrl(): string {
    const splunk_host_url = this.get('SPLUNK_HOST_URL');
    return splunk_host_url === undefined ? '' : splunk_host_url;
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
      if (this.get('DATABASE_SSL_KEY')?.indexOf('-BEGIN') === -1) {
        // Verify file exists
        if (fs.statSync(this.get('DATABASE_SSL_KEY')!).isFile()) {
          sslKey = fs.readFileSync(this.get('DATABASE_SSL_KEY')!);
        } else {
          throw new Error('SSL Key file does not exist');
        }
      } else {
        sslKey = this.get('DATABASE_SSL_KEY');
      }
    }

    if (typeof this.get('DATABASE_SSL_CERT') === 'string') {
      if (this.get('DATABASE_SSL_CERT')?.indexOf('-BEGIN') === -1) {
        // Verify file exists
        if (fs.statSync(this.get('DATABASE_SSL_CERT')!).isFile()) {
          sslCert = fs.readFileSync(this.get('DATABASE_SSL_CERT')!);
        } else {
          throw new Error('SSL Cert file does not exist');
        }
      } else {
        sslCert = this.get('DATABASE_SSL_CERT');
      }
    }

    if (typeof this.get('DATABASE_SSL_CA') === 'string') {
      if (this.get('DATABASE_SSL_CA')?.indexOf('-BEGIN') === -1) {
        // Verify file exists
        if (fs.statSync(this.get('DATABASE_SSL_CA')!).isFile()) {
          sslCA = fs.readFileSync(this.get('DATABASE_SSL_CA')!);
        } else {
          throw new Error('SSL CA file does not exist');
        }
      } else {
        sslCA = this.get('DATABASE_SSL_CA');
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

  getTenableHostUrl(): string {
    const tenable_host_url = this.get('TENABLE_HOST_URL');
    return tenable_host_url === undefined ? '' : tenable_host_url;
  }

  parseDatabaseUrl() {
    const url = this.get('DATABASE_URL');
    if (url === undefined) {
      return false;
    } else {
      const pattern
        = /^(?:([^\s#/:?]+):\/{2})?(?:([^\s#/?@]+)@)?([^\s#/?]+)?(?:\/([^\s#?]*))?(?:\?([^\s#]+))?\S*$/;
      const matches = pattern.exec(url);

      if (matches === null) {
        return false;
      }

      this.set(
        'DATABASE_USERNAME',
        matches[2] === undefined ? undefined : matches[2].split(':', 1)[0],
      );
      this.set(
        'DATABASE_PASSWORD',
        matches[2] === undefined ? undefined : matches[2].split(':', 2)[1],
      );
      this.set(
        'DATABASE_HOST',
        matches[3] === undefined ? undefined : matches[3].split(/:(?=\d+$)/v, 1)[0],
      );
      this.set(
        'DATABASE_NAME',
        matches[4] === undefined ? undefined : matches[4].split('/', 1)[0],
      );
      this.set(
        'DATABASE_PORT',
        matches[3] === undefined ? undefined : matches[3].split(/:(?=\d+$)/v, 2)[1],
      );
      return true;
    }
  }

  set(key: string, value: string | undefined): void {
    this.envConfig.set(key, value);
  }
}
