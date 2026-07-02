import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const PROJECT_DIR = join(__dirname, '..');
const EMBEDDED_ASSETS = join(
  PROJECT_DIR,
  'src/converters-from-hdf/html/embedded-assets.ts',
);

export function setup(): void {
  if (!existsSync(EMBEDDED_ASSETS)) {
    execSync('yarn generate:assets', {
      cwd: PROJECT_DIR,
      stdio: 'inherit',
    });
  }
}
