import path from 'path';
import { fileURLToPath } from 'url';
import vue2 from '@vitejs/plugin-vue2';
import svgLoader from 'vite-svg-loader';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    vue2(),
    svgLoader(),
  ],
  resolve: {
    alias: [
      { find: /^@\//v, replacement: path.resolve(rootDir, 'src') + '/' },
    ],
  },
  test: {
    environment: 'jsdom',
    exclude: ['src/__mocks__/**', 'node_modules/**', 'dist/**'],
    include: ['tests/unit/*.spec.ts'],
    sequence: { concurrent: true },
    setupFiles: [path.resolve(rootDir, 'tests/setup.ts')],
    testTimeout: 60_000,
  },
});
