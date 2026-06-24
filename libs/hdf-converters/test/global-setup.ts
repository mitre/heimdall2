import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const PROJECT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const EMBEDDED_ASSETS = path.join(
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
