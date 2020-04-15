import * as dotenv from 'dotenv';
import * as fs from 'fs';

export class ConfigService {
  private readonly envConfig: { [key: string]: string };

  constructor() {
    console.log('Attempting to read configuration file `.env`!');
    try {
      this.envConfig = dotenv.parse(fs.readFileSync('.env'));
      console.log('Read config!');
    } catch (error) {
      if(error.code === 'ENOENT') {
        // File probably does not exist
        console.log('Unable to read configuration file `.env`!');
        console.log('Does the file exist and is it readable by the current user?');
        console.log('Falling back to default or undefined values!');
      } else {
        throw error;
      }
    }
  }

  get(key: string): string | undefined {
    try {
      return this.envConfig[key];
    } catch (error) {
      if(error instanceof TypeError) {
        return undefined;
      } else {
        throw error;
      }
    }
  }
}
