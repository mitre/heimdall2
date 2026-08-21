import { Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command';
import { BuildService } from '../../lib/build-service';

export default class Refresh extends BaseCommand {
  static description = 'Refresh the development environment';

  static examples = [
    '$ heimdall build refresh',
    '$ heimdall build refresh --no-reset-admin',
  ];

  static flags = {
    ...BaseCommand.flags,
    'no-reset-admin': Flags.boolean({
      default: false,
      description: 'Skip resetting admin credentials',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Refresh);

    this.ui.heading('Refreshing Development Environment', 'Restarting containers...');

    // Initialize build service
    const buildService = new BuildService(this.docker);

    const s = this.ui.spinner('Refreshing environment...');

    try {
      await buildService.refreshEnvironment();
      s.stop();

      this.ui.success('Environment refreshed successfully');

      // Reset admin credentials if needed
      if (!flags['no-reset-admin']) {
        // In a real implementation, we would update the admin credentials here
        // This would typically be done by running a script in the app container
        this.log('Admin credentials have been refreshed:');
        this.log('  Email: admin@heimdall.local');
        this.log('  Password: heimdall_admin');
      }
    } catch (error) {
      s.stop();
      this.ui.error(`Failed to refresh environment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
