import { Command, Flags } from '@oclif/core';
import { DockerService, EnvConfig } from './docker-service';
import { UIService } from './ui-service';

export abstract class BaseCommand extends Command {
  static flags = {
    verbose: Flags.boolean({
      char: 'v',
      description: 'Enable verbose logging',
      default: false,
    }),
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
    env: Flags.string({
      char: 'e',
      description: 'Environment (development, production, test)',
      default: 'development',
      options: ['development', 'production', 'test'],
    }),
  };

  protected docker!: DockerService;
  protected ui!: typeof UIService;
  protected envConfig!: EnvConfig; // Renamed from config to avoid conflict with Oclif's config

  async init(): Promise<void> {
    await super.init();
    
    // Need to cast to any to avoid TypeScript error with static method inheritance
    // This is a workaround for the Oclif Command class type limitations
    const { flags } = await this.parse(this.constructor as any);
    
    this.envConfig = {
      NODE_ENV: flags.env as EnvConfig['NODE_ENV'],
      // Add more configuration as needed
    } as EnvConfig;
    
    this.docker = new DockerService(this.envConfig);
    this.ui = UIService;
  }

  // Helper to log verbose information
  protected logVerbose(...args: any[]): void {
    try {
      // Need to cast to any to avoid TypeScript error with static method inheritance
      // Convert Promise<ParserOutput> to actual value using await
      const result = this.parse(this.constructor as any) as any;
      
      // Check if verbose flag is set
      if (result && result.flags && result.flags.verbose) {
        this.log(...args);
      }
    } catch (error) {
      // If parsing fails, still log in verbose mode 
      // This can happen during command initialization
      this.log(...args);
    }
  }
}