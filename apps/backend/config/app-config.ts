import * as fs from 'fs';
import * as dotenv from 'dotenv';

/**
 * Resolves TLS material from a deployer-supplied value that is either inline
 * PEM (contains -BEGIN) or a path to a PEM file. The label names the material
 * in error messages (Key, Cert, CA).
 */
export function resolveSslMaterial(
  value: string,
  label: string,
): Buffer | string {
  if (value.includes('-BEGIN')) {
    return value;
  }
  try {
    /* eslint-disable-next-line security/detect-non-literal-fs-filename -- No
       code fix exists: reading the deployer-specified certificate path is
       this function's purpose. The value comes from the host environment,
       which the process owner controls — it is never request input. */
    return fs.readFileSync(value);
  } catch (error) {
    throw new Error(`SSL ${label} file does not exist or is unreadable`, {
      cause: error,
    });
  }
}

// DATABASE_URL anatomy: scheme://user:password@host:port/name?query
const DATABASE_URL_PATTERN
  = /^(?:[^\s#/:?]+:\/{2})?(?:(?<userinfo>[^\s#/?@]+)@)?(?<hostPort>[^\s#/?]+)?(?:\/(?<name>[^\s#?]*))?(?:\?[^\s#]*)?(?:#\S*)?$/;
// The host:port boundary — the colon directly before a trailing port number.
const HOST_PORT_SEPARATOR = /:(?=\d+$)/v;

export default class AppConfig {
  private envConfig: Map<string, string | undefined>;

  constructor() {
    console.log('Attempting to read configuration file `.env`!');
    try {
      const parsedConfig = dotenv.parse(fs.readFileSync('.env'));
      this.envConfig = new Map(Object.entries(parsedConfig));
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
      sslKey = resolveSslMaterial(this.get('DATABASE_SSL_KEY')!, 'Key');
    }

    if (typeof this.get('DATABASE_SSL_CERT') === 'string') {
      sslCert = resolveSslMaterial(this.get('DATABASE_SSL_CERT')!, 'Cert');
    }

    if (typeof this.get('DATABASE_SSL_CA') === 'string') {
      sslCA = resolveSslMaterial(this.get('DATABASE_SSL_CA')!, 'CA');
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
      const matches = DATABASE_URL_PATTERN.exec(url);

      if (matches === null) {
        return false;
      }
      const {userinfo, hostPort, name} = matches.groups ?? {};

      this.set(
        'DATABASE_USERNAME',
        userinfo === undefined ? undefined : userinfo.split(':', 1)[0],
      );
      this.set(
        'DATABASE_PASSWORD',
        userinfo === undefined ? undefined : userinfo.split(':', 2)[1],
      );
      this.set(
        'DATABASE_HOST',
        hostPort === undefined ? undefined : hostPort.split(HOST_PORT_SEPARATOR, 1)[0],
      );
      this.set(
        'DATABASE_NAME',
        name === undefined ? undefined : name.split('/', 1)[0],
      );
      this.set(
        'DATABASE_PORT',
        hostPort === undefined ? undefined : hostPort.split(HOST_PORT_SEPARATOR, 2)[1],
      );
      return true;
    }
  }

  set(key: string, value: string | undefined): void {
    this.envConfig.set(key, value);
  }
}
