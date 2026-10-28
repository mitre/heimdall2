import {resolve} from 'node:path';
import swc from 'unplugin-swc';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@mitre/hdf-converters': resolve(__dirname, '../../libs/hdf-converters/index.ts'),
      inspecjs: resolve(__dirname, '../../libs/inspecjs/src/index.ts')
    }
  },
  test: {
    hookTimeout: 20000,
    testTimeout: 20000,
    fileParallelism: false,
    unstubEnvs: true
  },
  plugins: [
    swc.vite({
      module: {type: 'es6'}
    })
  ]
});
