import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * Side-effect fixture for documentation-mount.spec.ts — MUST stay its first
 * import. app.module resolves the static roots inside its @Module decorator
 * at import time, so the override has to exist before that module evaluates.
 * Module evaluation order follows import declaration order in ESM and CJS
 * alike, which makes first-import the one placement no build pipeline can
 * reorder. (vi.hoisted cannot do this job here: the swc plugin emits CJS
 * requires ahead of hoisted blocks. And a dynamic import('../app.module.js')
 * — the previous approach — resolved to the stale nest-build copy under
 * dist/ whenever another spec had already run in the same fork.)
 */
export const staticRootFixture = mkdtempSync(
  path.join(tmpdir(), 'heimdall-static-'),
);

process.env.HEIMDALL_STATIC_ROOT = staticRootFixture;

