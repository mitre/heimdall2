import {resolve} from 'node:path';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@mitre/hdf-converters': resolve(__dirname, '../hdf-converters/index.ts'),
      inspecjs: resolve(__dirname, '../inspecjs/src/index.ts')
    }
  },
  test: {
    hookTimeout: 60000,
    testTimeout: 60000,
    sequence: {
      concurrent: true
    }
  }
});
