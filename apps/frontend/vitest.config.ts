import {defineConfig} from 'vitest/config';
import vue2 from '@vitejs/plugin-vue2';
import path from 'path';
import svgLoader from 'vite-svg-loader';
import {fileURLToPath} from 'url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: rootDir,
  plugins: [
    vue2(),
    svgLoader()
  ],
  resolve: {
    alias: [
      {find: /^@\//, replacement: path.resolve(rootDir, 'src') + '/'},
      {find: '@mitre/hdf-converters', replacement: path.resolve(rootDir, '..', '..', 'libs/hdf-converters/index.ts')},
      // {find: 'd3', replacement: path.resolve(rootDir, 'tests/util/d3.js')},
      {find: 'apexcharts/dist/apexcharts.min', replacement: 'apexcharts/dist/apexcharts.min.js'},
      {find: 'axios', replacement: 'axios/dist/node/axios.cjs'},
      {find: 'csv-stringify/sync', replacement: 'csv-stringify/dist/cjs/sync.cjs'}
    ]
  },
  test: {
    environment: 'jsdom',
    setupFiles: [path.resolve(rootDir, 'tests/setup.ts')],
    include: ['tests/unit/*.spec.ts'],
    exclude: ['src/__mocks__/**', 'node_modules/**', 'dist/**'],
    testTimeout: 15_000,
    deps: { inline: ['apexcharts'] }
  }
});
