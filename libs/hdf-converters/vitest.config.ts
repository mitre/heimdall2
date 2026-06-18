import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  test: {
    env: loadEnv(mode, process.cwd(), ''),
    hookTimeout: 60000,
    sequence: { concurrent: true },
    testTimeout: 60000,
  },
}));
