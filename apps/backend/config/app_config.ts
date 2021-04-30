import * as dotenv from 'dotenv';
import * as fs from 'fs';
import {Dialect} from 'sequelize/types';

export default class AppConfig {
  private envConfig: {[key: string]: string | undefined};

  constructor() {
    console.log('Attempting to read configuration file `.env`!');
    try {
      this.envConfig = dotenv.parse(fs.readFileSync('.env'));
      console.log('Read config!');
    } catch (error) {
      if (error.code === 'ENOENT') {
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

  getDbConfig() {
    return {
      username: this.get('DATABASE_USERNAME') || 'postgres',
      user: this.get('DATABASE_USERNAME') || 'postgres',
      role: this.get('DATABASE_USERNAME') || 'postgres',
      password: this.get('DATABASE_PASSWORD') || '',
      database: this.getDatabaseName(),
      host: this.get('DATABASE_HOST') || '127.0.0.1',
      port: Number(this.get('DATABASE_PORT')) || 5432,
      dialect: 'postgres' as Dialect,
      dialectOptions: {
        ssl: Boolean(this.get('DATABASE_SSL'))
          ? {
              rejectUnauthorized: false
            }
          : false
      },
      ssl: Boolean(this.get('DATABASE_SSL')) || false
    };
  }

  getDbURL() {
    let url = this.get('DATABASE_URL');
    if (url === undefined) {
      const dbConfig = this.getDbConfig();
      url = `pg://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
    }
    return url
  }

  parseDatabaseUrl() {
    const url = this.get('DATABASE_URL');
    if (url === undefined) {
      return false;
    } else {
      const pattern = /^(?:([^:\/?#\s]+):\/{2})?(?:([^@\/?#\s]+)@)?([^\/?#\s]+)?(?:\/([^?#\s]*))?(?:[?]([^#\s]+))?\S*$/;
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
