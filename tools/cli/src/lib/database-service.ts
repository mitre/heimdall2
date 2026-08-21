import fs from 'fs-extra';
import path from 'path';
import { DockerService, CONTAINER_NAMES } from './docker-service';

export class DatabaseService {
  private docker: DockerService;
  private dataDir: string;
  private dbName = 'heimdall-server-development';
  private dbUser = 'postgres';

  constructor(docker: DockerService) {
    this.docker = docker;
    
    // Set the data directory for backups
    // This should be configurable in a real implementation
    this.dataDir = path.resolve(process.cwd(), '../..', 'data/backups');
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDir(): Promise<void> {
    await fs.ensureDir(this.dataDir);
  }
  
  /**
   * Run a command in the database container using Dockerode
   */
  private async execInDbContainer(command: string[]): Promise<string> {
    const status = await this.docker.getContainerStatus(CONTAINER_NAMES.DB);
    
    if (status !== 'running') {
      throw new Error('Database container is not running. Start it first with "heimdall env start --db-only"');
    }
    
    const result = await this.docker.execCommand(CONTAINER_NAMES.DB, command);
    
    if (result.exitCode !== 0) {
      throw new Error(`Database command failed with exit code ${result.exitCode}: ${result.output}`);
    }
    
    return result.output;
  }
  
  /**
   * Copy a file to or from the container using Dockerode's exec
   * We need to use a helper function because Dockerode doesn't have a direct API for this
   */
  private async copyFileToContainer(localPath: string, containerPath: string): Promise<void> {
    const container = await this.docker.getContainer(CONTAINER_NAMES.DB);
    
    if (!container) {
      throw new Error('Database container not found');
    }
    
    // Read the file content
    const content = await fs.readFile(localPath);
    
    // Use cat and bash to write the file in the container
    // This is a workaround since Dockerode doesn't have a direct file copy method
    await this.docker.execCommand(CONTAINER_NAMES.DB, [
      'bash', 
      '-c', 
      `cat > ${containerPath} << 'EOFMARKER'
${content.toString()}
EOFMARKER`
    ]);
  }
  
  /**
   * Copy a file from the container to the host
   */
  private async copyFileFromContainer(containerPath: string, localPath: string): Promise<void> {
    // Get file content from the container
    const result = await this.docker.execCommand(CONTAINER_NAMES.DB, ['cat', containerPath]);
    
    if (result.exitCode !== 0) {
      throw new Error(`Failed to read file from container: ${result.output}`);
    }
    
    // Write the content to the local file
    await fs.writeFile(localPath, result.output);
  }

  /**
   * Create a database backup
   */
  async createBackup(name?: string): Promise<string> {
    await this.ensureBackupDir();
    
    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = name ? `${timestamp}-${name}` : timestamp;
    const backupFile = path.join(this.dataDir, `heimdall-backup-${backupName}.sql`);
    
    // Run pg_dump inside the container
    await this.execInDbContainer([
      'pg_dump',
      '-U', this.dbUser,
      '-d', this.dbName,
      '-f', '/tmp/backup.sql'
    ]);
    
    // Copy the backup from the container to the host
    await this.copyFileFromContainer('/tmp/backup.sql', backupFile);
    
    return backupFile;
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<string[]> {
    await this.ensureBackupDir();
    
    const files = await fs.readdir(this.dataDir);
    return files
      .filter(file => file.startsWith('heimdall-backup-') && file.endsWith('.sql'))
      .sort()
      .reverse(); // newest first
  }

  /**
   * Restore a database from backup
   */
  async restoreBackup(backupFile: string): Promise<void> {
    // Check if file exists
    const fullPath = path.resolve(this.dataDir, backupFile);
    
    if (!await fs.pathExists(fullPath)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    // Copy backup file to the container
    await this.copyFileToContainer(fullPath, '/tmp/restore.sql');
    
    // Drop existing database
    await this.execInDbContainer([
      'dropdb',
      '-U', this.dbUser,
      '--if-exists',
      this.dbName
    ]);
    
    // Create fresh database
    await this.execInDbContainer([
      'createdb',
      '-U', this.dbUser,
      this.dbName
    ]);
    
    // Restore from backup
    await this.execInDbContainer([
      'psql',
      '-U', this.dbUser,
      '-d', this.dbName,
      '-f', '/tmp/restore.sql'
    ]);
  }

  /**
   * Reset the database to a clean state
   */
  async resetDatabase(): Promise<void> {
    // Drop existing database
    await this.execInDbContainer([
      'dropdb',
      '-U', this.dbUser,
      '--if-exists',
      this.dbName
    ]);
    
    // Create fresh database
    await this.execInDbContainer([
      'createdb',
      '-U', this.dbUser,
      this.dbName
    ]);
    
    // Run migrations and seeds
    // In a real implementation, we'd run specific migration commands
    // For now, we'll restart the app container to trigger automatic migrations
    const appStatus = await this.docker.getContainerStatus(CONTAINER_NAMES.APP);
    if (appStatus !== 'not-found') {
      await this.docker.restartContainer(CONTAINER_NAMES.APP);
    }
  }
}