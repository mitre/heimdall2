import * as dotenv from 'dotenv';
import * as fs from 'fs';

export default class AppConfig {
  private envConfig: {[key: string]: string | undefined};

  constructor() {
    console.log('Attempting to read configuration file `.env`!');
    try {
      this.envConfig = dotenv.parse(fs.readFileSync('.env'));
      console.log('Read config!');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.envConfig = {};
        // File probably does not exist
        console.log('Unable to read configuration file `.env`!');
        console.log('Falling back to environment or undefined values!');
      } else {
        throw error;
      }
    }
    if (this.parseDatabaseUrl()) {
      console.log(
        'DATABASE_URL parsed into smaller components (i.e. DATABASE_USER)'
      );
    }
  }

  set(key: string, value: string | undefined): void {
    this.envConfig[key] = value;
  }

  get(key: string): string | undefined {
    return process.env[key] || this.envConfig[key];
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
