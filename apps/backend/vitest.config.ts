import swc from 'unplugin-swc';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    hookTimeout: 20000,
    testTimeout: 20000,
    fileParallelism: true
  },
  plugins: [
    swc.vite({
      module: {type: 'es6'},
    }),
  ],
});
