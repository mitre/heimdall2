import * as fs from 'fs';
import env from '../env';

export interface SSLConfig {
  rejectUnauthorized: boolean;
  key?: string | Buffer;
  cert?: string | Buffer;
  ca?: string | Buffer;
}

export function readFileOrValue(
  value: string | undefined
): string | Buffer | undefined {
  if (!value) return undefined;
  if (value.indexOf('-BEGIN') !== -1) return value;
  try {
    if (fs.statSync(value).isFile()) return fs.readFileSync(value);
  } catch {
    // not a file path — treat as raw value
  }
  return value;
}

export interface DrizzleConnectionConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: false | SSLConfig;
  max: number;
}

function parseDatabaseUrl(
  url: string
): Pick<DrizzleConnectionConfig, 'host' | 'port' | 'user' | 'password' | 'database'> | null {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port, 10) || 5432,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ''),
    };
  } catch {
    return null;
  }
}

function getDatabaseName(): string {
  if (env.DATABASE_NAME) return env.DATABASE_NAME;
  return `heimdall-server-${env.NODE_ENV.toLowerCase()}`;
}

function getSSLConfig(): false | SSLConfig {
  if (!env.DATABASE_SSL || env.DATABASE_SSL.toLowerCase() === 'false') {
    return false;
  }

  return {
    rejectUnauthorized: env.DATABASE_SSL_INSECURE?.toLowerCase() !== 'true',
    key: readFileOrValue(env.DATABASE_SSL_KEY),
    cert: readFileOrValue(env.DATABASE_SSL_CERT),
    ca: readFileOrValue(env.DATABASE_SSL_CA),
  };
}

export function getDrizzleConnectionConfig(
  poolSize = 5
): DrizzleConnectionConfig {
  if (env.DATABASE_URL) {
    const fromUrl = parseDatabaseUrl(env.DATABASE_URL);
    if (fromUrl) {
      return {
        ...fromUrl,
        ssl: getSSLConfig(),
        max: poolSize,
      };
    }
  }

  return {
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    user: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD || '',
    database: getDatabaseName(),
    ssl: getSSLConfig(),
    max: poolSize,
  };
}
