import path from 'node:path';

/**
 * Filesystem roots for the static assets this server mounts.
 *
 * These are resolved here, once, rather than inline at each mount, because the
 * default is anchored on `__dirname` and therefore depends on which runtime is
 * executing: under `nest build` __dirname is `apps/backend/dist/src`, but under
 * vitest it is `apps/backend/src` — one level shallower. The same four `..`
 * segments consequently land INSIDE the repo in production and one level ABOVE
 * it under test, where nothing exists. That is why a spec booting AppModule
 * silently exercised no static mount at all.
 *
 * HEIMDALL_STATIC_ROOT overrides the anchor. The pattern is Grafana's
 * `static_root_path`: where a server finds its static assets is deployment
 * configuration, not something to derive from the location of the code.
 * Unset, the resolved paths are byte-identical to the previous inline
 * expression, so production behaviour is unchanged.
 */

// eslint's prefer-module wants import.meta here, but this package compiles to
// CommonJS (nodenext, no "type": "module") where import.meta is a syntax
// error — resolving the static roots stays on __dirname until an ESM
// migration.
const BUILT_LAYOUT_ANCHOR = path.join(__dirname, '..', '..', '..', '..', 'dist');




export function staticRoot(): string {
  return process.env.HEIMDALL_STATIC_ROOT ?? BUILT_LAYOUT_ANCHOR;
}

/** The compiled Vue SPA — served as the application itself. */
export function frontendRoot(): string {
  return path.join(staticRoot(), 'frontend');
}

/** The built VitePress site — served at /docs for offline and airgapped use. */
export function documentationRoot(): string {
  return path.join(staticRoot(), 'docs');
}
