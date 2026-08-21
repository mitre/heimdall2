import execa from 'execa';
import { DockerService, CONTAINER_NAMES } from './docker-service';
import path from 'path';
import fs from 'fs-extra';

export class BuildService {
  private docker: DockerService;
  private projectDir: string;

  constructor(docker: DockerService) {
    this.docker = docker;
    // Assume the project dir is two levels up from current dir
    this.projectDir = path.resolve(process.cwd(), '../..');
  }

  /**
   * Get the docker-compose file path
   */
  private get composeFile(): string {
    return path.join(this.projectDir, 'docker-compose.dev.yml');
  }

  /**
   * Run a docker-compose command
   * We use docker CLI for compose operations since Dockerode doesn't have direct compose support
   */
  private async runComposeCommand(args: string[], options: Record<string, any> = {}): Promise<void> {
    await execa('docker', ['compose', '-f', this.composeFile, ...args], {
      stdio: 'inherit',
      env: {
        ...process.env,
        COMPOSE_DOCKER_CLI_BUILD: '1',
        DOCKER_BUILDKIT: '1',
        ...options.env,
      },
    });
  }

  /**
   * Execute a command in a container
   * Uses Dockerode API from DockerService
   */
  private async execInContainer(containerName: string, command: string[]): Promise<string> {
    const result = await this.docker.execCommand(containerName, command);
    if (result.exitCode !== 0) {
      throw new Error(`Command failed with exit code ${result.exitCode}: ${result.output}`);
    }
    return result.output;
  }

  /**
   * Build containers without starting them
   */
  async buildContainers(target?: string): Promise<void> {
    const args = ['build'];
    if (target) {
      args.push(target);
    }
    await this.runComposeCommand(args);
  }

  /**
   * Rebuild containers
   * This stops containers, rebuilds them, and optionally starts them again
   */
  async rebuildContainers(target?: string, autoStart = false): Promise<void> {
    // Get current container status to determine which were running
    const statusBefore = await this.docker.getAllContainersStatus();
    const wasRunning = Object.values(statusBefore).some(status => status === 'running');

    // Stop containers using Dockerode
    if (Object.values(statusBefore).some(status => status === 'running')) {
      if (statusBefore.app === 'running') {
        await this.docker.stopContainer(CONTAINER_NAMES.APP);
      }
      if (statusBefore.proxy === 'running') {
        await this.docker.stopContainer(CONTAINER_NAMES.PROXY);
      }
      if (statusBefore.db === 'running') {
        await this.docker.stopContainer(CONTAINER_NAMES.DB);
      }
    }

    // Use docker-compose down to ensure proper cleanup
    await this.runComposeCommand(['down']);

    // Build containers
    await this.buildContainers(target);

    // Start containers if they were running before or autoStart is true
    if (wasRunning || autoStart) {
      await this.runComposeCommand(['up', '-d']);
      
      // Wait for containers to be ready
      let retries = 0;
      const maxRetries = 10;
      while (retries < maxRetries) {
        const appStatus = await this.docker.getContainerStatus(CONTAINER_NAMES.APP);
        if (appStatus === 'running') {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
      }
      
      // Run yarn commands in container if it's running
      const appStatus = await this.docker.getContainerStatus(CONTAINER_NAMES.APP);
      if (appStatus === 'running') {
        try {
          await this.execInContainer(CONTAINER_NAMES.APP, ['bash', '-c', 'cd /app && yarn build']);
        } catch (error) {
          console.error('Warning: Failed to run yarn build in container:', error);
        }
      }
    }
  }

  /**
   * Refresh the environment - restart containers without rebuilding
   * We use Dockerode's restart method for each container
   */
  async refreshEnvironment(): Promise<void> {
    // Check each container and restart if it exists
    const appStatus = await this.docker.getContainerStatus(CONTAINER_NAMES.APP);
    if (appStatus !== 'not-found') {
      await this.docker.restartContainer(CONTAINER_NAMES.APP);
    }
    
    const dbStatus = await this.docker.getContainerStatus(CONTAINER_NAMES.DB);
    if (dbStatus !== 'not-found') {
      await this.docker.restartContainer(CONTAINER_NAMES.DB);
    }
    
    const proxyStatus = await this.docker.getContainerStatus(CONTAINER_NAMES.PROXY);
    if (proxyStatus !== 'not-found') {
      await this.docker.restartContainer(CONTAINER_NAMES.PROXY);
    }
  }

  /**
   * Full reset and rebuild of environment
   * This is the most comprehensive refresh - stops everything, removes volumes, rebuilds, and starts fresh
   */
  async fullReset(): Promise<void> {
    // Stop and remove containers with volumes
    await this.runComposeCommand(['down', '-v']);

    // Remove node_modules to force clean install with Yarn
    const nodeModulesPaths = [
      path.join(this.projectDir, 'node_modules'),
      path.join(this.projectDir, 'apps/frontend/node_modules'),
      path.join(this.projectDir, 'apps/backend/node_modules'),
    ];

    for (const modulesPath of nodeModulesPaths) {
      if (await fs.pathExists(modulesPath)) {
        await fs.remove(modulesPath);
      }
    }

    // Build containers
    await this.buildContainers();

    // Start containers
    await this.runComposeCommand(['up', '-d']);
    
    // Wait for containers to be ready
    let retries = 0;
    const maxRetries = 20;
    while (retries < maxRetries) {
      const appStatus = await this.docker.getContainerStatus(CONTAINER_NAMES.APP);
      if (appStatus === 'running') {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries++;
    }
    
    // Run yarn install and build in the container
    try {
      const appStatus = await this.docker.getContainerStatus(CONTAINER_NAMES.APP);
      if (appStatus === 'running') {
        await this.execInContainer(
          CONTAINER_NAMES.APP, 
          ['bash', '-c', 'cd /app && yarn install && yarn build']
        );
      }
    } catch (error) {
      console.error('Warning: Failed to run yarn commands in container:', error);
    }
  }
}