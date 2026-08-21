import * as fs from 'fs-extra';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { DockerService } from './docker-service';
import { BuildService } from './build-service';
import { DatabaseService } from './database-service';
import { CertificateService } from './certificate-service';

/**
 * Service for setting up the Heimdall development environment
 * Uses ephemeral database approach with migrations/seeders for data initialization
 */
export class SetupService {
  private projectDir: string;
  private envFile: string;
  private logsDir: string;
  private dataDir: string;
  private certificateService: CertificateService;
  private buildService: BuildService;
  private databaseService: DatabaseService;

  /**
   * Create a new SetupService
   * 
   * @param docker Docker service for container operations
   * @param projectDir Optional project directory path (defaults to current directory)
   */
  constructor(
    private docker: DockerService,
    buildService?: BuildService,
    databaseService?: DatabaseService,
    projectDir?: string
  ) {
    this.projectDir = projectDir || process.cwd();
    this.envFile = path.join(this.projectDir, 'apps', 'backend', '.env');
    this.logsDir = path.join(this.projectDir, 'logs');
    this.dataDir = path.join(this.projectDir, 'data');
    this.certificateService = new CertificateService(docker, this.projectDir);
    this.buildService = buildService || new BuildService(docker, this.projectDir);
    this.databaseService = databaseService || new DatabaseService(docker, this.projectDir);
  }

  /**
   * Set up the Heimdall development environment
   * - Creates directory structure
   * - Generates environment configuration
   * - Sets up certificates (optional)
   * - Builds and starts containers
   * 
   * Uses ephemeral database approach - the database is seeded by the application
   * through migrations and seeders, not through direct SQL commands
   * 
   * @param options Setup options
   * @returns Setup result
   */
  async setupEnvironment(options: {
    force?: boolean;
    skipBuild?: boolean;
    skipStart?: boolean;
    skipCerts?: boolean;
  } = {}): Promise<{
    envFileCreated: boolean;
    directoriesCreated: boolean;
    certificatesCreated: boolean;
    built: boolean;
    started: boolean;
  }> {
    const { 
      force = false, 
      skipBuild = false, 
      skipStart = false,
      skipCerts = false
    } = options;
    
    const result = {
      envFileCreated: false,
      directoriesCreated: false,
      certificatesCreated: false,
      built: false,
      started: false
    };
    
    // Create directory structure
    await this.createDirectories();
    result.directoriesCreated = true;
    
    // Create .env file if it doesn't exist or force is true
    if (!fs.existsSync(this.envFile) || force) {
      await this.createEnvFile();
      result.envFileCreated = true;
    }
    
    // Set up certificates (directory structure only)
    if (!skipCerts) {
      await this.certificateService.createProxyCertDirs();
      
      // Generate certificates if they don't exist
      const certStatus = await this.certificateService.checkProxyCertStatus();
      if (!certStatus.hasCerts) {
        await this.certificateService.generateProxyCertificates();
        result.certificatesCreated = true;
      }
    }
    
    // Build containers if not skipped
    if (!skipBuild) {
      await this.buildService.buildAll();
      result.built = true;
    }
    
    // Start containers if not skipped
    if (!skipStart && result.built) {
      await this.docker.startAll();
      result.started = true;
      
      // Note: No need to manually set up admin user as it's handled by the application's
      // migration and seeding process in an ephemeral database approach
    }
    
    return result;
  }
  
  /**
   * Create the required directories for Heimdall
   */
  private async createDirectories(): Promise<void> {
    // Create logs directory
    await fs.ensureDir(this.logsDir);
    await fs.ensureDir(path.join(this.logsDir, 'nginx'));
    await fs.chmod(this.logsDir, 0o750);
    
    // Create data directories
    await fs.ensureDir(this.dataDir);
    await fs.ensureDir(path.join(this.dataDir, 'backups'));
    await fs.ensureDir(path.join(this.dataDir, 'nginx', 'certs'));
    await fs.ensureDir(path.join(this.dataDir, 'nginx', 'conf'));
    
    // Create certs directory
    await fs.ensureDir(path.join(this.projectDir, 'certs'));
    
    // Create env directory
    await fs.ensureDir(path.dirname(this.envFile));
  }
  
  /**
   * Create the environment configuration file
   */
  private async createEnvFile(): Promise<void> {
    // Generate secure tokens
    const jwtSecret = randomBytes(32).toString('hex');
    const apiKeySecret = randomBytes(32).toString('hex');
    
    const envContent = `NODE_ENV=development
DATABASE_HOST=heimdall-db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=heimdall-server-development
DATABASE_PORT=5432
LOG_LEVEL=debug
LOG_FILE=/app/logs/heimdall-dev.log
JWT_SECRET=${jwtSecret}
API_KEY_SECRET=${apiKeySecret}
JWT_EXPIRE_TIME=1d
SSL_CERT_FILE=\${SSL_CERT_FILE:-/etc/ssl/certs/ca-certificates.crt}
NODE_TLS_REJECT_UNAUTHORIZED=0
# Standardized admin credentials for development
ADMIN_EMAIL=admin@heimdall.local
ADMIN_PASSWORD=heimdall_admin
`;
    
    // Write the file with proper permissions
    await fs.writeFile(this.envFile, envContent);
    await fs.chmod(this.envFile, 0o600);
  }
}