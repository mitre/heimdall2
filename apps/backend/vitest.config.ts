import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    swc.vite({ module: { type: 'es6' } }),
  ],
  test: {
    fileParallelism: false,
    hookTimeout: 20_000,
    testTimeout: 20_000,
  },
});
