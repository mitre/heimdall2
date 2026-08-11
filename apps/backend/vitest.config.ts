import swc from 'unplugin-swc';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    // ADR-006 §12: the write gate's no-env derivation probes live DB state
    // (marker row, Users count), which would make every suite's hashing
    // behavior depend on truncation order. Tests therefore run with writes
    // explicitly enabled; hash-write-gate.service.spec.ts manipulates
    // process.env per case to exercise the derivation itself.
    env: { PASSWORD_HASH_WRITE_ENABLED: 'true' },
    hookTimeout: 20000,
    testTimeout: 20000,
    fileParallelism: false
  },
  plugins: [
    swc.vite({
      module: {type: 'es6'},
    }),
  ],
});
