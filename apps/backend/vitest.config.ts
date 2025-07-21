import swc from 'unplugin-swc';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    hookTimeout: 20000,
    testTimeout: 20000,
    root: '.'
  },
  plugins: [
    swc.vite({
      module: {type: 'es6'},
    }),
  ],
  // resolve: {
  //   alias: {
  //     'src': resolve(__dirname, './src')
  //   }
  // }
});
