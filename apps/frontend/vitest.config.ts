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
    aliases: [
      {find: '@', replacement: path.resolve(rootDir, 'src')},
      // {find: 'd3', replacement: path.resolve(rootDir, 'tests/util/d3.js')},
      {find: 'axios', replacement: 'axios/dist/node/axios.cjs'},
      {find: 'csv-stringify/sync', replacement: 'csv-stringify/dist/cjs/sync/cjs'}
    ]
  },
  test: {
    environment: 'jsdom',
    setupFiles: [path.resolve(rootDir, 'tests/setup.ts')],
    include: ['tests/unit/*.spec.ts'],
    exclude: ['src/__mocks__/**', 'node_modules/**', 'dist/**'],
    // deps: { inline: ['vuetify'] }
  }
});
