import {Pool} from 'pg';
import env from '../env';

export function createTestPool(): Pool {
  return new Pool({
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    user: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
  });
}
