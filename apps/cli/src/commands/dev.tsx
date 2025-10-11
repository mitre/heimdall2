import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function devCommand(options: any) {
  console.log('🚀 Starting Heimdall development servers...\n');

  if (options.compare) {
    console.log('📊 Starting backend + old frontend + new frontend for comparison\n');
    // Will use concurrently in root package.json
    const { spawn } = await import('child_process');
    const proc = spawn('yarn', ['dev:compare'], {
      stdio: 'inherit',
      shell: true
    });

    proc.on('exit', (code) => process.exit(code || 0));
  } else if (options.backendOnly) {
    console.log('⚙️  Starting backend only\n');
    const { spawn } = await import('child_process');
    const proc = spawn('yarn', ['dev:backend'], {
      stdio: 'inherit',
      shell: true
    });

    proc.on('exit', (code) => process.exit(code || 0));
  } else if (options.frontendOnly) {
    console.log('🎨 Starting new frontend only\n');
    const { spawn } = await import('child_process');
    const proc = spawn('yarn', ['dev:frontend-v3'], {
      stdio: 'inherit',
      shell: true
    });

    proc.on('exit', (code) => process.exit(code || 0));
  } else {
    console.log('🎯 Starting backend + new frontend (default)\n');
    const { spawn } = await import('child_process');
    const proc = spawn('yarn', ['dev'], {
      stdio: 'inherit',
      shell: true
    });

    proc.on('exit', (code) => process.exit(code || 0));
  }
}
