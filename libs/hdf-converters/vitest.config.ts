import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    hookTimeout: 60_000,
    testTimeout: 60_000,
    sequence: {
      concurrent: true
    }
  }
});
