import * as p from '@clack/prompts';
import { Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command';
import { BuildService } from '../../lib/build-service';

export default class Reset extends BaseCommand {
  static description = 'Full reset and rebuild of the development environment';

  static examples = [
    '$ heimdall build reset',
    '$ heimdall build reset --force',
  ];

  static flags = {
    ...BaseCommand.flags,
    force: Flags.boolean({
      char: 'f',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Reset);

    this.ui.heading('Full Reset of Development Environment', 'Stopping, removing, and rebuilding everything...');

    // Confirm reset if not forced
    if (!flags.force) {
      this.ui.warning('Warning: This will delete all data, containers, volumes, and node_modules!');
      this.ui.warning('This is a complete reset that will take several minutes to complete.');

      const confirmed = await p.confirm({
        initialValue: false,
        message: 'Are you sure you want to completely reset the environment?',
      });

      if (p.isCancel(confirmed) || !confirmed) {
        p.cancel('Reset cancelled');
        return;
      }
    }

    // Initialize build service
    const buildService = new BuildService(this.docker);

    const s = this.ui.spinner('Performing full reset and rebuild...');

    try {
      await buildService.fullReset();
      s.stop();

      this.ui.success('Environment reset and rebuild complete');
      this.log('The environment has been completely reset and rebuilt.');
      this.log('This includes:');
      this.log('  - Fresh database with seed data');
      this.log('  - Clean node_modules and Yarn dependencies');
      this.log('  - Rebuilt Docker containers');
      this.log('  - Started services');
      this.log('');
      this.log('You can now access the application at:');
      this.log('  Backend API: http://localhost:3000');
      this.log('  Frontend UI: http://localhost:8080');
      this.log('');
      this.log('Admin credentials:');
      this.log('  Email: admin@heimdall.local');
      this.log('  Password: heimdall_admin');
    } catch (error) {
      s.stop();
      this.ui.error(`Failed to reset environment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
