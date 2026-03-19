import {defineConfig} from 'vitest/config';
import vue2 from '@vitejs/plugin-vue2';
import path from 'path';
import svgLoader from 'vite-svg-loader';
import {fileURLToPath} from 'url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    vue2(),
    svgLoader()
  ],
  resolve: {
    alias: [
      {find: /^@\//, replacement: path.resolve(rootDir, 'src') + '/'}
    ]
  },
  test: {
    environment: 'jsdom',
    setupFiles: [path.resolve(rootDir, 'tests/setup.ts')],
    include: ['tests/unit/*.spec.ts'],
    exclude: ['src/__mocks__/**', 'node_modules/**', 'dist/**'],
    testTimeout: 60_000,
    sequence: {
      concurrent: true
    }
  }
});
