import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    hookTimeout: 10000,
    testTimeout: 10000,
    root: '.'
  }
});
