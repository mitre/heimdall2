#!/usr/bin/env node
import { Command } from 'commander';
import { setupCommand } from './commands/setup.js';
import { devCommand } from './commands/dev.js';

const program = new Command();

program
  .name('heimdall')
  .description('Heimdall CLI - Development and deployment tools')
  .version('3.0.0');

program
  .command('setup')
  .description('Interactive setup for development environment')
  .option('--password <password>', 'database password', 'postgres')
  .option('--port <port>', 'database port', '5433')
  .option('--host <host>', 'database host', 'localhost')
  .option('--non-interactive', 'skip prompts, use defaults')
  .action(setupCommand);

program
  .command('dev')
  .description('Start development servers')
  .option('--compare', 'start both old and new frontends for comparison')
  .option('--backend-only', 'start only backend')
  .option('--frontend-only', 'start only new frontend')
  .action(devCommand);

program.parse();
