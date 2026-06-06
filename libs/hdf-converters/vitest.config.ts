import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    root: __dirname,
    hookTimeout: 60000,
    testTimeout: 60000,
    setupFiles: ['./test/mocks/setup.ts'],
    sequence: {
      concurrent: true
    }
  }
});
