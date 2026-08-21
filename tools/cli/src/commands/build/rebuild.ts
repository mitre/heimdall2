import * as p from '@clack/prompts';
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command';
import { BuildService } from '../../lib/build-service';

export default class Rebuild extends BaseCommand {
  static description = 'Rebuild the development environment';

  static examples = [
    '$ heimdall build rebuild',
    '$ heimdall build rebuild dev',
    '$ heimdall build rebuild --auto-start',
    '$ heimdall build rebuild --force',
  ];

  static flags = {
    ...BaseCommand.flags,
    'auto-start': Flags.boolean({
      default: false,
      description: 'Automatically start containers after rebuild',
    }),
    force: Flags.boolean({
      char: 'f',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };

  static args = {
    target: Args.string({
      description: 'Target to rebuild (all, dev, proxy)',
      required: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Rebuild);

    this.ui.heading('Rebuilding Development Environment', 'Stopping, rebuilding, and starting containers...');

    // Confirm rebuild if not forced
    if (!flags.force) {
      const confirmed = await p.confirm({
        initialValue: true,
        message: 'This will stop the environment and rebuild containers. Continue?',
      });

      if (p.isCancel(confirmed) || !confirmed) {
        p.cancel('Rebuild cancelled');
        return;
      }
    }

    // Initialize build service
    const buildService = new BuildService(this.docker);

    const s = this.ui.spinner(`Rebuilding environment${args.target ? ` (target: ${args.target})` : ''}...`);

    try {
      await buildService.rebuildContainers(args.target, flags['auto-start']);
      s.stop();

      this.ui.success('Environment rebuilt successfully');

      if (flags['auto-start']) {
        this.log('Containers have been started.');
        this.log('The application will be available shortly at:');
        this.log('  Backend API: http://localhost:3000');
        this.log('  Frontend UI: http://localhost:8080');
      } else {
        this.log('Containers have been rebuilt but not started.');
        this.log('To start the environment, run:');
        this.log('  heimdall env start');
      }
    } catch (error) {
      s.stop();
      this.ui.error(`Failed to rebuild environment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
