import * as p from '@clack/prompts';
import chalk from 'chalk';

export class UIService {
  /**
   * Display a heading with a title and optional subtitle
   */
  static heading(title: string, subtitle?: string) {
    console.log('\n' + chalk.bold(title));
    if (subtitle) {
      console.log(chalk.dim(subtitle));
    }
    console.log();
  }

  /**
   * Start a spinner with a message
   */
  static spinner(message: string) {
    const s = p.spinner();
    s.start(message);
    return s;
  }

  /**
   * Display a success message
   */
  static success(message: string) {
    p.log.success(message);
  }

  /**
   * Display an error message
   */
  static error(message: string) {
    p.log.error(message);
  }

  /**
   * Display a warning message
   */
  static warning(message: string) {
    p.log.warning(message);
  }

  /**
   * Display an information message
   */
  static info(message: string) {
    p.log.info(message);
  }

  /**
   * Show a confirmation prompt
   */
  static async confirm(message: string, defaultValue = true) {
    const response = await p.confirm({
      message,
      initialValue: defaultValue,
    });

    return response === true;
  }

  /**
   * Show a select prompt
   */
  static async select<T extends string>(
    message: string, 
    options: Array<{ value: T; label: string; hint?: string }>
  ): Promise<T | symbol> {
    return p.select({
      message,
      options: options as any,
    });
  }

  /**
   * Show an input prompt
   */
  static async text(message: string, defaultValue?: string) {
    return p.text({
      message,
      initialValue: defaultValue,
    });
  }

  /**
   * Format container status for display
   */
  static formatStatus(status: 'running' | 'stopped' | 'not-found'): string {
    switch (status) {
      case 'running':
        return chalk.green('Running');
      case 'stopped':
        return chalk.yellow('Stopped');
      case 'not-found':
        return chalk.red('Not Found');
      default:
        return chalk.gray('Unknown');
    }
  }
}