import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    hookTimeout: 60000,
    testTimeout: 60000,
    sequence: {
      concurrent: true
    }
  }
});
