import swc from 'unplugin-swc';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    hookTimeout: 20000,
    testTimeout: 20000,
    fileParallelism: false,
    root: '.'
  },
  plugins: [
    swc.vite({
      module: {type: 'es6'},
    }),
  ],
});
