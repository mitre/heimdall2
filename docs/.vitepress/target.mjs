// What differs between builds of this documentation, in one place.
//
// Adapted from vulcan's docs/.vitepress/target.mjs (the ADR-005 §5.1 reference
// implementation). Shaped after VitePress's own `locales` table: shared
// configuration stays in config.mjs and each entry here declares ONLY what that
// target overrides. If a value is the same everywhere it does not belong here —
// the moment an entry looks like a whole configuration it has become a second
// source of truth.
//
// Targets are selected at BUILD time and are mutually exclusive, because `base`
// is baked into the generated asset URLs: a site built for GitHub Pages cannot
// be served from the application's /docs/ path, and vice versa. Offline/in-app
// docs therefore require their own build, not a copy of the published one.

const TARGETS = {
  // Published to GitHub Pages alongside Heimdall Lite: one deploy-pages artifact
  // carries the Lite SPA at the site root and this site under /docs/
  // (ADR-005 §2.2.1). Same base as the in-app target — the documentation lives
  // at /docs/ whether it is served by Pages or by the application itself.
  pages: {
    base: '/docs/',
    inApp: false,
    // Outbound chrome — the GitHub edit link and the social icons — is
    // meaningful only where the internet is. Served in-app (and the driving
    // case is a disconnected lab running the RPM install) every one of those
    // links is dead, so the in-app target turns them off.
    outboundChrome: true
  },

  // Local developer preview, served from the site root.
  local: {
    base: '/',
    inApp: false,
    outboundChrome: true
  },

  // Served by the Heimdall application itself, for offline/airgapped installs.
  // The mount path is the application's fact — it is what defines the route —
  // so it is passed in rather than restated here.
  //
  // HOW the application serves this build is deliberately NOT decided here:
  // heimdall2 is NestJS + a Vue SPA whose ServeStaticModule answers 200 for any
  // unmatched route, so the mount has to be researched before it is wired
  // (Aaron, 2026-08-11). This target exists so the build is ready when that
  // decision lands; nothing outside docs/ depends on it yet.
  app: {
    base: process.env.HEIMDALL_DOCS_BASE || '/docs/',
    inApp: true,
    outboundChrome: false
  }
};

export const TARGET_NAMES = Object.keys(TARGETS);

export function resolveTarget(name = process.env.HEIMDALL_DOCS_TARGET) {
  const key = name || 'local';

  // Object.hasOwn, not a truthiness check on TARGETS[key]: a plain object
  // inherits from Object.prototype, so `constructor`, `toString` and friends
  // resolve to inherited functions and would slip past the guard, yielding a
  // target with base === undefined and a build with broken asset URLs.
  if (!Object.hasOwn(TARGETS, key)) {
    throw new Error(
      `Unknown documentation target ${JSON.stringify(name)}. Expected one of: ${TARGET_NAMES.join(', ')}`
    );
  }

  return {name: key, ...TARGETS[key]};
}

export const target = resolveTarget();
