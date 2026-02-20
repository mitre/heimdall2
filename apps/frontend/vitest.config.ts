import {defineConfig} from 'vitest/config';
import vue2 from '@vitejs/plugin-vue2';
import path from 'path';
import svgLoader from 'vite-svg-loader';

export default defineConfig({
  plugins: [
    vue2(),
    svgLoader()
  ],
  resolve: {
    aliases: [
      {find: '@', replacement: path.resolve(__dirname, 'src')},
      // {find: 'd3', replacement: path.resolve(__dirname, 'tests/util/d3.js')},
      {find: 'axios', replacement: 'axios/dist/node/axios.cjs'},
      {find: 'csv-stringify/sync', replacement: 'csv-stringify/dist/cjs/sync/cjs'}
    ]
  },
  test: {
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, 'tests/setup.ts')],
    include: ['tests/unit/*.spec.ts'],
    exclude: ['src/__mocks__/**', 'node_modules/**', 'dist/**'],
    root: '.'
    // deps: { inline: ['vuetify'] }
  }
});
