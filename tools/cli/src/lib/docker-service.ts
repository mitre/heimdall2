import Dockerode from 'dockerode';
import fs from 'fs-extra';
import path from 'path';
import { z } from 'zod';

// Container name constants - these should match the actual container names from docker ps
export const CONTAINER_NAMES = {
  APP: 'heimdall-app',
  DB: 'heimdall-db',
  PROXY: 'heimdall-proxy'
};

// Environment schema
export const EnvConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_CONTAINER_NAME: z.string().default(CONTAINER_NAMES.DB),
  APP_CONTAINER_NAME: z.string().default(CONTAINER_NAMES.APP),
  PROXY_CONTAINER_NAME: z.string().default(CONTAINER_NAMES.PROXY),
  POSTGRES_DB: z.string().default('heimdall'),
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string().default('postgres'),
  // Add more environment variables as needed
});

export type EnvConfig = z.infer<typeof EnvConfigSchema>;

export class DockerService {
  private docker: Dockerode;
  private config: EnvConfig;

  constructor(config?: Partial<EnvConfig>) {
    this.docker = new Dockerode();
    this.config = EnvConfigSchema.parse(config || {});
  }

  async getContainer(name: string) {
    const containers = await this.docker.listContainers({
      all: true,
      filters: {
        name: [name]
      }
    });

    if (containers.length === 0) {
      return null;
    }

    const container = this.docker.getContainer(containers[0].Id);
    // Add the container ID to the container object for convenience
    (container as any).id = containers[0].Id;
    
    return container;
  }

  async getContainerStatus(name: string): Promise<'running' | 'stopped' | 'not-found'> {
    const container = await this.getContainer(name);
    
    if (!container) {
      return 'not-found';
    }

    const info = await container.inspect();
    return info.State.Running ? 'running' : 'stopped';
  }

  async getAllContainersStatus() {
    console.log("Getting container names from config:", {
      app: this.config.APP_CONTAINER_NAME,
      db: this.config.DB_CONTAINER_NAME, 
      proxy: this.config.PROXY_CONTAINER_NAME
    });
    
    try {
      const appStatus = await this.getContainerStatus(this.config.APP_CONTAINER_NAME);
      console.log("App status:", appStatus);
      
      const dbStatus = await this.getContainerStatus(this.config.DB_CONTAINER_NAME);
      console.log("DB status:", dbStatus);
      
      const proxyStatus = await this.getContainerStatus(this.config.PROXY_CONTAINER_NAME);
      console.log("Proxy status:", proxyStatus);
      
      return {
        app: appStatus,
        db: dbStatus,
        proxy: proxyStatus
      };
    } catch (error) {
      console.error("Error getting container status:", error);
      throw error;
    }
  }

  async startContainer(name: string) {
    const container = await this.getContainer(name);
    
    if (!container) {
      throw new Error(`Container ${name} not found`);
    }

    const info = await container.inspect();
    
    if (!info.State.Running) {
      await container.start();
    }
  }

  async stopContainer(name: string) {
    const container = await this.getContainer(name);
    
    if (!container) {
      throw new Error(`Container ${name} not found`);
    }

    const info = await container.inspect();
    
    if (info.State.Running) {
      await container.stop();
    }
  }

  async getContainerLogs(name: string, tail = 100): Promise<string> {
    const container = await this.getContainer(name);
    
    if (!container) {
      throw new Error(`Container ${name} not found`);
    }

    const logStream = await container.logs({
      follow: false,
      stdout: true,
      stderr: true,
      tail
    });

    return logStream.toString();
  }
  
  async restartContainer(name: string): Promise<void> {
    const container = await this.getContainer(name);
    
    if (!container) {
      throw new Error(`Container ${name} not found`);
    }

    await container.restart();
  }
  
  async execCommand(containerName: string, command: string[]): Promise<{ output: string; exitCode: number }> {
    const container = await this.getContainer(containerName);
    
    if (!container) {
      throw new Error(`Container ${containerName} not found`);
    }
    
    const exec = await container.exec({
      Cmd: command,
      AttachStdout: true,
      AttachStderr: true,
    });
    
    const stream = await exec.start({});
    
    let output = '';
    let exitCode = 0;
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        output += chunk.toString();
      });
      
      stream.on('end', async () => {
        const info = await exec.inspect();
        exitCode = info.ExitCode || 0;
        resolve({
          output,
          exitCode
        });
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    });
  }
}