import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  test: {
    env: loadEnv(mode, process.cwd(), ''),
    globalSetup: './test/global-setup.ts',
    hookTimeout: 60_000,
    sequence: { concurrent: true },
    testTimeout: 60_000,
  },
}));
