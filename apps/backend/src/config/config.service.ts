import * as dotenv from 'dotenv';
import * as fs from 'fs';

export class ConfigService {
  private envConfig: {[key: string]: string};

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
        console.log(
          'Does the file exist and is it readable by the current user?'
        );
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

  private parseDatabaseUrl(): boolean {
    if (!this.get('DATABASE_URL')) {
      return false;
    } else {
      const url = this.get('DATABASE_URL');
      const pattern = /^(?:([^:\/?#\s]+):\/{2})?(?:([^@\/?#\s]+)@)?([^\/?#\s]+)?(?:\/([^?#\s]*))?(?:[?]([^#\s]+))?\S*$/;
      const matches = url.match(pattern);

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

  set(key: string, value: string) {
    this.envConfig[key] = value;
  }

  get(key: string): string | undefined {
    return process.env[key] || this.envConfig[key];
  }
}
