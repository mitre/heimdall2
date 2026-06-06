import {defineConfig} from 'drizzle-kit';
import {getDrizzleConnectionConfig} from './src/db/connection';

const config = getDrizzleConnectionConfig();

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/db/auth-schema.generated.ts', './src/db/schema.ts'],
  out: './drizzle',
  dbCredentials: {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl,
  },
});
