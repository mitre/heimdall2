import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    hookTimeout: 10_000,
    sequence: { concurrent: true },
    testTimeout: 10_000,
  },
});
