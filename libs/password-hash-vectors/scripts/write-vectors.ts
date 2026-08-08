/**
 * Writes src/vectors.ts from the pure generator. Run:
 *
 *   yarn workspace @heimdall/password-hash-vectors gen:vectors
 *
 * This file is only ever executed, never imported, so it needs no main-guard.
 * The output path is a literal relative to the package root (yarn runs the
 * script with cwd = the package dir), which keeps it lint-clean and avoids
 * __dirname (the package is CJS but the lint config assumes ESM).
 */
import { writeFileSync } from 'node:fs';
import { renderVectorsModule } from './generate-vectors';

writeFileSync('src/vectors.ts', renderVectorsModule(), 'utf8');
process.stdout.write('wrote src/vectors.ts\n');
