# PR #8201 September Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address Amndeep7's September 30, 2026 implementation, test, and documentation feedback within the existing PR #8201 on `feat/saml-auth`.

**Architecture:** Update the existing SAML implementation in place. Compile shared runtime values from TypeScript, preserve the existing common import path, and retain the current JWT and OAuth/Tenable session behavior. Keep the icons, auth refactor, SAML fixes, and Cypress documentation together in this PR, using existing tests and tools.

**Tech Stack:** TypeScript, Yarn workspaces, Lerna, NestJS/Passport, Node-SAML 5.1, Lodash, Vue 2/Vuetify, Vitest, Cypress, Docker/PostgreSQL.

**Spec:** `docs/superpowers/specs/2026-10-05-pr-8201-review.md`. Read that file first for the R1–R18 acceptance requirements. Each fix below also links directly to its originating GitHub comment; the specification is not required to follow those links.

**Execution record:** [Implementation, tests, limitations and direct review responses](../reports/2026-10-05-pr-8201-review-fixes.md). Checked implementation steps describe retained review fixes. The restored original baseline passed a frozen install, clean common build/runtime check, full workspace build, focused backend tests and all frontend unit tests. Browser/Docker checks were not repeated; prior merged-branch results remain historical. Keep all work uncommitted. Current setup commands are maintained in `test/README.md`.

**Execution adjustment for [R12](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141511900):** Final review proved that HTTP-POST request binding conflicts with the existing Content Security Policy. Reject that setting clearly at startup and document HTTP-Redirect-only support; retain CSP and add one constructor regression. This replaces the initially planned claim that both bindings work.

## Global Constraints

- Use existing TypeScript, Yarn workspaces, Lerna, Lodash, Vitest, Cypress, and Node assertions; add no dependencies.
- Keep `@heimdall/common/interfaces` as the public import path.
- Generated JavaScript belongs in an ignored build directory, not in tracked TypeScript source directories.
- Keep local/LDAP/SAML application authentication based on the existing JWT flow.
- Preserve required identity-claim validation and configured attribute names.
- Preserve the original `tenableHostUrl: string` contract across config, DTO, shared interface, and frontend store; exclude master-only features and dependency upgrades.
- Keep all fixes on `feat/saml-auth` in PR #8201. Preserve existing user files; keep every review fix uncommitted, and do not create replacement PRs, split branches, push, or close this PR.
- Complete code, local documentation, and verification before requesting any final external publication decision.

---

## Scope and file map

**User override, October 5, 2026:** Keep everything in PR #8201 for now. Defer the PR-splitting portion of [R1](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141045445) and the separate-PR portion of [R4](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141231281). Their common-compilation and Cypress-documentation requirements remain active. The October 6 instruction below defers the [logical-commit guidance (R17)](https://github.com/mitre/heimdall2/pull/8201#pullrequestreview-5361958817).

**User override, October 6, 2026:** Remove the master merge and imported upgrades; apply the same review fixes to original PR head `e1eed0cc221de8d4db96eb43cc2d62012464b832` and keep all work uncommitted. R18 merge completion is deferred. Use the original dependencies, including Lerna 9; common compilation does not require upgrades.

| Area           | Files and responsibility                                                                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Common runtime | `libs/common` TypeScript constants, package build, runtime check, and corresponding Docker/build/development/packaging prerequisites.                                              |
| Login UI       | `apps/frontend/src/views/Login.vue` labels/getter and `test/integration/login-tabs.cy.ts`. Existing provider icon changes stay in this PR.                                         |
| SAML fixes     | Existing strategy/spec, ConfigService tests, original SAML SVG, backend attribution, and session explanation. Keep existing routes, name/config, buttons, dependency, and CI mock. |
| Documentation  | All SAML environment options, prepared wiki text, new `test/README.md`, and root README link.                                                                                      |

### Task 1: Restore the original branch baseline

**Review comment:** [resolve branch conflicts while preserving Tenable changes (R18)](https://github.com/mitre/heimdall2/pull/8201#issuecomment-5905879353). The October 6 user instruction defers this merge request.

- [x] **Step 1: Remove the master merge and imported upgrades while retaining review fixes.**

Use `e1eed0cc2` as the baseline. Preserve the existing `enabledAuthStrategies: AuthStrategy[]`/`samlName: string` fields and original `tenableHostUrl: string` contract. Restore original dependency versions and middleware behavior. Keep the common compilation, SAML, login-tab, documentation and regression fixes as uncommitted changes.

Preserve user changes and untracked `.beads`, `CONTEXT.md`, `docs`, and `packaging` paths. Do not stage or commit the review work.

- [x] **Step 2: Verify the original versions and retained changes.**

```bash
git status --short
git branch --show-current
git diff --check
git diff --stat e1eed0cc2
yarn install --frozen-lockfile
yarn common build
yarn common test:ci
yarn backend test:ci src/config/config.service.spec.ts
```

Expected: branch `feat/saml-auth`, original package versions and Tenable string contract, retained review fixes, and no new commits or staged changes.

### Task 2: Compile common while preserving the complete auth implementation

**Files:**

- Modify: `libs/common/package.json`, `libs/common/tsconfig.json`, `libs/common/index.ts`, `libs/common/interfaces/index.ts`, `libs/common/interfaces/config/auth-strategy.interface.ts`.
- Create: `libs/common/test/auth-strategy.cjs`.
- Delete: `libs/common/interfaces/index.js`, `libs/common/interfaces/config/auth-strategy.json`.
- Modify tests: `apps/backend/src/config/config.service.spec.ts`.
- Verify existing contracts and consumers: `libs/common/interfaces/config/startup-settings.interface.ts`, `libs/common/interfaces/user/create-user.interface.ts`, backend config/startup/user DTOs and auth services, frontend store and login/user components. Keep their existing auth/SAML behavior; change imports only if needed for compiled package resolution.
- Modify build entry points: `package.json`, `apps/frontend/package.json`, `Dockerfile`, `Dockerfile.lite`, `.github/workflows/{backend-tests,frontend-tests,gh-pages,build-prod}.yml`, `.gitignore`, `.dockerignore`; root `README.md` development instructions.

**Interfaces:** Preserves `AUTH_STRATEGY`, `AUTH_STRATEGIES`, `OAUTH_AUTH_STRATEGIES`, `AuthStrategy`, and `ExternalAuthStrategy` at `@heimdall/common/interfaces`. `enabledAuthStrategies(): AuthStrategy[]` continues to include local, LDAP, enabled OAuth and configured SAML; `enabledOauthStrategies(): AuthStrategy[]` remains OAuth-only. Keep the existing startup settings, including `samlName`, and the original Tenable string field.

- [x] **Step 1: Add the compiled-runtime regression check.**

**Review comments:** [compile common instead of maintaining a source JavaScript bridge (R1)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141045445); [move common-data assertions out of ConfigService tests (R11)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141468587).

Create `libs/common/test/auth-strategy.cjs`:

```js
const assert = require('node:assert/strict');
const path = require('node:path');
const resolved = require.resolve('@heimdall/common/interfaces');
assert.equal(resolved, path.resolve(__dirname, '../lib/interfaces/index.js'));
const {AUTH_STRATEGY, AUTH_STRATEGIES, OAUTH_AUTH_STRATEGIES} =
  require('@heimdall/common/interfaces');
assert.deepEqual(AUTH_STRATEGIES, Object.values(AUTH_STRATEGY));
assert.equal(AUTH_STRATEGY.SAML, 'saml');
assert.ok(AUTH_STRATEGIES.includes('saml'));
assert.deepEqual(OAUTH_AUTH_STRATEGIES, ['github', 'gitlab', 'google', 'oidc', 'okta']);
for (const [key, value] of Object.entries(AUTH_STRATEGY)) {
  assert.equal(value, key.toLowerCase());
}
for (const value of OAUTH_AUTH_STRATEGIES) {
  assert.ok(AUTH_STRATEGIES.includes(value));
}
assert.ok(!OAUTH_AUTH_STRATEGIES.includes('local'));
assert.ok(!OAUTH_AUTH_STRATEGIES.includes('ldap'));
assert.ok(!OAUTH_AUTH_STRATEGIES.includes('saml'));
```

Run `node libs/common/test/auth-strategy.cjs` before implementation. Expected: failure because the compiled public entry point/values do not exist. Checking the resolved `.js` path prevents Node's TypeScript stripping from hiding a missing build.

- [x] **Step 2: Define the runtime constants in TypeScript.**

**Review comment:** [define the values inline and remove the JSON file (R2)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141056351).

```ts
export const AUTH_STRATEGY = {
  GITHUB: 'github',
  GITLAB: 'gitlab',
  GOOGLE: 'google',
  LDAP: 'ldap',
  LOCAL: 'local',
  OIDC: 'oidc',
  OKTA: 'okta',
  SAML: 'saml'
} as const;

export type AuthStrategy = (typeof AUTH_STRATEGY)[keyof typeof AUTH_STRATEGY];
export const AUTH_STRATEGIES = Object.values(AUTH_STRATEGY);
export const OAUTH_AUTH_STRATEGIES: AuthStrategy[] = [
  AUTH_STRATEGY.GITHUB,
  AUTH_STRATEGY.GITLAB,
  AUTH_STRATEGY.GOOGLE,
  AUTH_STRATEGY.OIDC,
  AUTH_STRATEGY.OKTA
];
export type ExternalAuthStrategy = Exclude<AuthStrategy, typeof AUTH_STRATEGY.LOCAL>;
```

Keep the existing named value and type re-exports in `interfaces/index.ts`, including SAML. After replacing the JSON-backed constants with this TypeScript source, remove both adapters:

```bash
rm libs/common/interfaces/index.js libs/common/interfaces/config/auth-strategy.json
```

Make the currently empty `libs/common/index.ts` a barrel with `export * from './interfaces';`.

- [x] **Step 3: Configure compilation and package resolution.**

**Review comment:** [make JavaScript a TypeScript build artifact (R1)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141045445). The package exports and compiler settings below implement that request.

Use a common-only compiler configuration; `lib` must be excluded from subsequent compilation:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "lib",
    "incremental": false
  },
  "include": ["index.ts", "interfaces/**/*.ts"],
  "exclude": ["lib", "node_modules", "test"]
}
```

Merge these fields into `libs/common/package.json`, keeping its existing metadata and lint scripts:

```json
{
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "exports": {
    ".": {"types": "./lib/index.d.ts", "default": "./lib/index.js"},
    "./interfaces": {
      "types": "./lib/interfaces/index.d.ts",
      "default": "./lib/interfaces/index.js"
    }
  },
  "typesVersions": {"*": {"interfaces": ["lib/interfaces/index.d.ts"]}},
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test:ci": "node test/auth-strategy.cjs"
  }
}
```

`exports` covers NodeNext/runtime resolution; `typesVersions` covers the frontend's legacy TypeScript module resolution. Add `/libs/common/lib/` to both `.gitignore` and `.dockerignore` so clean images cannot consume local build residue. Do not add an ESM build, bundler, handwritten JS adapter, or new dependency.

- [x] **Step 4: Preserve existing auth consumers and move the misplaced tests.**

**Review comments:** [compile the existing common runtime values (R1)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141045445); [deferred branch-conflict request (R18)](https://github.com/mitre/heimdall2/pull/8201#issuecomment-5905879353).

Keep existing typed membership checks, `@IsIn(AUTH_STRATEGIES)` validation, startup serialization, SAML enablement, provider names and frontend consumers. These are already implemented in this PR; do not remove and reapply them. Check that their existing `@heimdall/common/interfaces` imports resolve through the compiled package.

Retain the ConfigService environment save/restore setup and its exact-list separation test: local disabled, LDAP and OIDC enabled, four SAML settings supplied; expect `['ldap', 'oidc', 'saml']` and OAuth `['oidc']`. [Remove the duplicate OAuth-membership test (R10)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141454521) and [move common-data consistency coverage to common (R11)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141468587); the runtime check now owns the latter.

- [x] **Step 5: Build common at entry points that bypass Lerna's graph.**

**Review comment:** [introduce a real common compilation phase (R1)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141045445). Build entry points and Docker copies are supporting changes needed for compiled runtime imports in this PR.

Keep root `build: lerna run build` and Lerna 9; the apps already declare common as a dependency. Add `yarn common build` before the direct backend build in `backend-tests.yml`, before frontend tests in `frontend-tests.yml`, before frontend build in `gh-pages.yml`, and before frontend build in `Dockerfile.lite`. Prepend `yarn workspace @heimdall/common build &&` to the existing frontend `prepack` command. Change root `start:dev` to:

```json
"start:dev": "yarn common build && lerna run start:dev --parallel --stream"
```

Document `yarn common build` before direct workspace build/test/debug commands, and `yarn common build --watch` in another terminal while editing common. Avoid `postinstall`: the Docker dependency-install layer runs before copying the source.

Copy the generated package into the server image after its existing workspace copies:

```dockerfile
COPY --from=builder --chown=1001 /src/libs/common/package.json libs/common/package.json
COPY --from=builder --chown=1001 /src/libs/common/lib libs/common/lib
```

This repairs the existing backend workspace symlink target in the runtime image. Do not copy the common source tree into the image as a substitute for compilation.

After `yarn build` in `build-prod.yml`, run `yarn common test:ci` so the compiled-runtime check is maintained by CI. Keep existing PR/release/push branch filters unchanged: this PR still targets `master`. Confirm common finishes before both applications in the clean Lerna build log.

- [ ] **Step 6: Verify the complete application from clean build output.**

```bash
yarn common build
yarn common test:ci
yarn build
yarn backend test:ci src/config/config.service.spec.ts
yarn frontend test:ci
docker build -t heimdall-pr8201-common .
docker run --rm --entrypoint node heimdall-pr8201-common -e 'const {createRequire}=require("node:module"); const r=createRequire("/app/apps/backend/package.json"); const p=r.resolve("@heimdall/common/interfaces"); if (!p.endsWith("/lib/interfaces/index.js") || !r("@heimdall/common/interfaces").AUTH_STRATEGY.OIDC) process.exit(1); r("./dist/src/users/dto/create-user.dto.js")'
docker build -f Dockerfile.lite -t heimdall-pr8201-lite .
git diff --check
```

Expected: all pass with the existing SAML runtime constant, button and strategy preserved. Also run the existing isolated backend/frontend CI jobs, since dependency leakage can mask a missing common build.

- [x] **Step 7: Keep the package/auth integration uncommitted.**

Leave the common build and its consumer changes in the working tree. Keep `libs/common/lib` ignored.

### Task 3: Correct login-tab naming and copy

**Files:** Modify `apps/frontend/src/views/Login.vue`; create `test/integration/login-tabs.cy.ts`.

**Interfaces:** Consumes `ServerModule.enabledAuthStrategies: AuthStrategy[]`. Produces getters `anyStandardTabAuthProvidersAvailable: boolean` and `standardTabLabel: string`; keeps existing tab IDs for test/user navigation.

- [x] **Step 1: Add one table-driven UI regression.**

**Review comments:** [vary the standard-tab label with local/SSO availability, independently of LDAP (R14)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141617871); [use the shorter LDAP label (R15)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141622483).

```ts
const cases: [string[], string | null][] = [
  [[], null],
  [['ldap'], null],
  [['local'], 'Local Account Login'],
  [['local', 'ldap'], 'Local Account Login'],
  [['oidc'], 'Organization Login (SSO)'],
  [['oidc', 'ldap'], 'Organization Login (SSO)'],
  [['local', 'oidc'], 'Local Account and Organization Login (SSO)'],
  [['local', 'oidc', 'ldap'], 'Local Account and Organization Login (SSO)']
];

describe('Login tabs', () => {
  for (const [strategies, label] of cases) {
    it(`labels providers: ${strategies.join(',') || 'none'}`, () => {
      cy.intercept('GET', '/server', req => {
        req.continue(res => {
          res.body.enabledAuthStrategies = strategies;
        });
      }).as('startup');
      cy.visit('/login');
      cy.wait('@startup');
      if (label === null) {
        cy.get('#select-tab-standard-login').should('not.exist');
      } else {
        cy.get('#select-tab-standard-login').should('contain.text', label);
      }
      if (strategies.includes('ldap')) {
        cy.get('#select-tab-ldap-login')
          .should('contain.text', 'Organization Login (LDAP)');
      } else {
        cy.get('#select-tab-ldap-login').should('not.exist');
      }
    });
  }
});
```

Run `yarn test:ui --spec test/integration/login-tabs.cy.ts` against the test server using Task 6's setup. Expected before the fix: label assertions fail. The global Cypress hook clears the test database; use only the dedicated test database.

- [x] **Step 2: Rename the getter and compute the label in `Login.vue`.**

Replace all three references to `anyAuthProvidersAvailable` (template, initial tab choice, getter), as requested in the [getter-naming comment (R13)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141550061). Keep the LDAP exclusion. Compute the three labels specified in the [conditional-label comment (R14)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141617871):

```ts
get anyStandardTabAuthProvidersAvailable() {
  return ServerModule.enabledAuthStrategies.some(strategy => strategy !== 'ldap');
}

get standardTabLabel() {
  const strategies = ServerModule.enabledAuthStrategies;
  const local = strategies.includes('local');
  const sso = strategies.some(strategy => strategy !== 'local' && strategy !== 'ldap');
  if (local && sso) return 'Local Account and Organization Login (SSO)';
  return local ? 'Local Account Login' : 'Organization Login (SSO)';
}
```

Use “Organization Login (LDAP)” per the [LDAP-label comment (R15)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141622483), and put both labels on their own lines per the [tab-formatting comment (R16)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141643146):

```vue
<v-tab
  v-if="anyStandardTabAuthProvidersAvailable"
  id="select-tab-standard-login"
  href="#login-standard"
>
  {{ standardTabLabel }}
</v-tab>
<v-tab
  v-if="ldapEnabled"
  id="select-tab-ldap-login"
  href="#login-ldap"
>
  Organization Login (LDAP)
</v-tab>
```

- [ ] **Step 3: Rebuild and rerun the matrix.**

```bash
yarn frontend build
yarn test:ui --spec test/integration/login-tabs.cy.ts
yarn eslint apps/frontend/src/views/Login.vue test/integration/login-tabs.cy.ts
```

Expected: the eight cases pass, including LDAP-only and no-provider states. Inspect the longest label at a narrow viewport; keep Vuetify's existing scrolling tabs.

### Task 4: Simplify the existing SAML claims, tests and artwork

**Files:** Modify `apps/backend/src/authn/saml.strategy.ts`, `apps/backend/src/authn/saml.strategy.spec.ts`, `apps/backend/src/config/config.service.spec.ts`, `apps/frontend/src/assets/saml.svg`, and `apps/backend/README.md`. Verify the existing SAML routes, provider registration, configuration, button, mocks and integration tests.

**Interfaces:** Preserves `AUTH_STRATEGY.SAML` without adding it to `OAUTH_AUTH_STRATEGIES`; `SAMLStrategy.validate(profile: Profile): Promise<User>` continues to call `validateOrCreateUser(email, givenName, familyName, 'saml')`.

- [x] **Step 1: Confirm the existing SAML flow remains intact.**

This is a regression check supporting the [claim-lookup fix (R6)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141286173) and [strategy-test cleanup (R8)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141378355).

Keep the existing strategy, routes, module provider, `@node-saml/passport-saml` dependency, button and mock service. Do not restore old file versions or regenerate these features. Common already retains `SAML: 'saml'` after Task 2.

Keep the four-setting SAML enablement requirement (`SAML_NAME`, `SAML_ENTRY_POINT`, `SAML_ISSUER`, `SAML_IDP_CERT`), `samlName` startup/store fields, button verifiers and existing login integration case. Confirm the ConfigService separation test still expects `['ldap', 'oidc', 'saml']` and OAuth `['oidc']`.

```bash
yarn backend test:ci src/authn/saml.strategy.spec.ts src/config/config.service.spec.ts
```

- [x] **Step 2: Condense the strategy test before changing the helper.**

**Review comment:** [retain the concise strategy test and remove other cases unless justified (R8)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141378355). The missing-identity assertion below is the explicitly justified exception.

Delete the exported-helper test block and `expectMissingRequiredClaim` helper. Keep the existing `SAMLStrategy` test and imports needed by it; replace the configured given-name key and matching profile key with `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname`, retaining the value `Mary Anne`.

After its successful `toHaveBeenCalledWith` assertion, add:

```ts
validateOrCreateUser.mockClear();
await expect(strategy.validate({
  customFamilyName: 'Smith',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname': 'Mary Anne'
})).rejects.toThrow('Missing required claim "customEmail".');
expect(validateOrCreateUser).not.toHaveBeenCalled();
```

This is the one justified extra assertion: a missing real identity attribute must not provision an account. Remove speculative object/boolean/number/inheritance test cases; do not duplicate Lodash or Node-SAML tests. Run the focused strategy test before editing as a behavior baseline; this refactor need not manufacture a failing test.

- [x] **Step 3: Simplify flat-attribute lookup and use Lodash's predicate.**

**Review comments:** [simplify/explain claim lookup (R6)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141286173); [use Lodash's `isString` (R7)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141288211).

Add `import _ from 'lodash';` following existing strategy import style. Remove the helper's export and replace it with:

```ts
function getRequiredClaim(
  claims: Record<string, unknown>,
  defaultClaimName: string,
  configuredClaimName?: string
): string {
  const resolvedClaimName = configuredClaimName || defaultClaimName;
  const claimValue = claims[resolvedClaimName];
  if (_.isString(claimValue) && claimValue.length > 0) {
    return String(claimValue);
  }
  throw new UnauthorizedException(`Missing required claim "${resolvedClaimName}".`);
}
```

The bracket lookup treats the configured attribute as one literal key, including URI punctuation. `String` preserves the declared primitive-string result when Lodash accepts a boxed string. Do not add nested-path fallback or choose arbitrary values from arrays.

- [x] **Step 4: Clean ConfigService tests.**

Replace both `Agency SSO` literals with `Internal SSO`, per the [test-name/copy comment (R9)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141436616). Keep `requires a SAML name`, the provider-name test and the exact-list separation test. Do not restore `limits OAuth callbacks to OAuth client strategies`, per the [duplicate-test comment (R10)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141454521), or `keeps auth strategy data internally consistent`, per the [test-ownership comment (R11)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141468587); common owns the latter.

- [x] **Step 5: Restore the requested original SAML logo.**

**Review comment:** [return to the original triangle logo and previous attribution (R3)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141191312).

```bash
git restore --source=0ef729f86 -- apps/frontend/src/assets/saml.svg
```

Restore this attribution under the backend README title:

```markdown
Logos used by this project are sourced from SVG Repo and are covered by the Logo License or MIT License: https://www.svgrepo.com/page/licensing/
```

The original SVG is the red triangle; `6e8a2d9be` contains the later certificate icon and is not the right source. Keep the other provider SVGs already in the PR. No image generation or new asset dependency is needed.

- [x] **Step 6: Record the session evidence without broadening middleware.**

**Review comment:** [research the session questions even though the condition was restored (R5)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141241954). The questions being referenced are in the [original session review thread](https://github.com/mitre/heimdall2/pull/8201#discussion_r3809765268).

Add a short “Authentication transaction sessions” paragraph to the backend README based on the spec's research: local/LDAP/SAML issue application JWTs; OIDC/Okta retain redirect state; Tenable persists its remote credentials; Node-SAML manages its request-ID cache. Link the three historical PRs and pinned Node-SAML source from the spec. Explain that the historical OAuth-wide condition is retained even though every individual OAuth strategy does not currently use session state.

Retain this existing `main.ts` condition and the original branch middleware behavior:

```ts
if (
  configService.enabledOauthStrategies().length ||
  configService.getTenableHostUrl().length
) {
```

- [ ] **Step 7: Verify the SAML implementation.**

```bash
yarn common build
yarn common test:ci
yarn backend test:ci src/authn/saml.strategy.spec.ts src/config/config.service.spec.ts
yarn build
yarn test:ui --spec test/integration/login.cy.ts,test/integration/login-tabs.cy.ts
git diff --check
```

Expected: the retained strategy check covers configured URI keys, multi-word names, and rejection before provisioning; OIDC/SAML buttons and actual login flows pass. Run with Task 6's mocks. Keep these fixes and the Task 5 documentation uncommitted.

### Task 5: Document every implemented SAML environment option

**Review comment:** [document all SAML variables in `.env-example` and the wiki when mergeable (R12)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141511900). This applies to the coverage check, complete option block, and wiki preparation in this task.

**Files:** Modify `apps/backend/.env-example`; create `docs/saml-environment-variables.md` as merge-ready wiki copy and session/setup cross-reference.

**Interfaces:** Documents the 48 `SAML_*` names actually read by ConfigService/SAMLStrategy. No runtime configuration behavior changes.

- [x] **Step 1: Run the coverage check and capture the documentation gap.**

```bash
python3 - <<'PY'
import re
from pathlib import Path
sources = [Path('apps/backend/src/authn/saml.strategy.ts'),
           Path('apps/backend/src/config/config.service.ts')]
used = set(re.findall(r'SAML_[A-Z0-9_]+', '\n'.join(p.read_text() for p in sources)))
documented = set(re.findall(r'^SAML_[A-Z0-9_]+(?==)', Path('apps/backend/.env-example').read_text(), re.M))
assert used == documented, {'missing': sorted(used-documented), 'extra': sorted(documented-used)}
PY
```

Expected before editing: 41 missing names. This check can remain a documented runnable check; do not introduce a documentation-test framework.

- [x] **Step 2: Replace the seven-line SAML section with the complete block below.**

These describe current behavior, including upstream defaults; optional unset values should be removed from a real `.env`, as the existing example instructs. JSON and list formats must stay explicit.

```dotenv
## SAML Service
SAML_NAME=<Frontend provider name; required to enable SAML>
SAML_ENTRY_POINT=<IdP SSO URL; required to enable SAML>
SAML_ISSUER=<Heimdall service-provider entity ID; required to enable SAML>
SAML_IDP_CERT=<IdP signing certificate as PEM or base64 DER; required to enable SAML>
SAML_EMAIL_ATTRIBUTE=<Flat email attribute name; default=email>
SAML_GIVEN_NAME_ATTRIBUTE=<Flat given-name attribute name; default=firstName>
SAML_FAMILY_NAME_ATTRIBUTE=<Flat family-name attribute name; default=lastName>
SAML_CALLBACK_URL=<ACS URL; default=EXTERNAL_URL followed by /authn/saml/callback>
SAML_AUDIENCE=<Expected audience; default=SAML_ISSUER; false disables audience checking>
SAML_ACCEPTED_CLOCK_SKEW_MS=<Allowed clock skew in milliseconds; default=0; -1 disables timestamp checks>
SAML_MAX_ASSERTION_AGE_MS=<Maximum assertion age in milliseconds; default=0, no additional age limit>
SAML_REQUEST_ID_EXPIRATION_PERIOD_MS=<Request-ID cache lifetime in milliseconds; default=28800000>
SAML_VALIDATE_IN_RESPONSE_TO=<never, ifPresent, or always; default=never>
SAML_ADDITIONAL_PARAMS=<JSON object of query parameters for all requests; default={}>
SAML_ADDITIONAL_AUTHORIZE_PARAMS=<JSON object of authorization query parameters; default={}>
SAML_ADDITIONAL_LOGOUT_PARAMS=<JSON object of logout query parameters; default={}>
SAML_ALLOW_CREATE=<Allow creation of a new subject identifier; true or false; default=true>
SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX=<Attribute-consuming service index; optional, omitted by default>
SAML_AUTHN_CONTEXT=<Comma-separated context URIs; default=urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport>
SAML_AUTHN_REQUEST_BINDING=<HTTP-Redirect only; default=HTTP-Redirect; HTTP-POST is rejected because it conflicts with the application Content Security Policy>
SAML_AUTHN_REQUEST_EXTENSIONS=<JSON object of AuthnRequest XML extensions; omitted by default>
SAML_DECRYPTION_PVK=<PEM private-key contents for encrypted assertions; omitted by default>
SAML_DIGEST_ALGORITHM=<sha1, sha256, or sha512; upstream default=sha1>
SAML_DISABLE_REQUEST_ACS_URL=<Omit ACS URL from requests; true or false; default=false>
SAML_DISABLE_REQUESTED_AUTHN_CONTEXT=<Omit requested auth context; true or false; default=false>
SAML_FORCE_AUTHN=<Force IdP reauthentication; true or false; default=false>
SAML_IDENTIFIER_FORMAT=<NameID format URI; default=urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress>
SAML_IDP_ISSUER=<Expected IdP issuer for supported logout validation; optional>
SAML_LOGOUT_CALLBACK_URL=<Single logout callback URL used in metadata; optional>
SAML_LOGOUT_REQUEST_EXTENSIONS=<JSON object of logout XML extensions; omitted by default>
SAML_LOGOUT_URL=<IdP logout URL; default=SAML_ENTRY_POINT>
SAML_METADATA_CONTACT_PERSON=<JSON contact-person array for metadata; optional>
SAML_METADATA_ORGANIZATION=<JSON organization object for metadata; optional>
SAML_PASSIVE=<Request passive authentication; true or false; default=false>
SAML_PRIVATE_KEY=<PEM private-key contents for signing requests; omitted by default>
SAML_PROVIDER_NAME=<ProviderName sent in AuthnRequest; optional; distinct from frontend SAML_NAME>
SAML_PUBLIC_CERT=<PEM public-certificate contents for signed requests/metadata; optional>
SAML_RAC_COMPARISON=<exact, minimum, maximum, or better; default=exact>
SAML_SCOPING_IDP_LIST=<JSON array of IdP lists, e.g. [{"entries":[{"providerId":"https://idp.example"}]}]; optional>
SAML_SCOPING_PROXY_COUNT=<Numeric proxy count; optional>
SAML_SCOPING_REQUESTER_ID=<Single requester ID or comma-separated IDs; optional>
SAML_SIGNATURE_ALGORITHM=<sha1, sha256, or sha512; upstream default=sha1>
SAML_SIGN_METADATA=<Sign generated metadata; true or false; default=false>
SAML_SKIP_REQUEST_COMPRESSION=<Skip request compression; true or false; default=false>
SAML_SP_NAME_QUALIFIER=<NameID service-provider qualifier; optional>
SAML_WANT_ASSERTIONS_SIGNED=<Require signed assertions; true or false; default=true>
SAML_WANT_AUTHN_RESPONSE_SIGNED=<Require signed response messages; true or false; default=true>
SAML_XML_SIGNATURE_TRANSFORMS=<JSON array of signature-transform URIs; upstream defaults are enveloped-signature and exclusive XML canonicalization>
```

Do not claim the exposed logout/metadata options create a Heimdall logout or metadata route; the current controller only supplies the implemented authentication routes. Do not describe private keys as filesystem paths; this strategy passes their contents directly.

- [x] **Step 3: Prepare the wiki content locally.**

Create `docs/saml-environment-variables.md` with the same complete option block, a four-required-settings example, scalar identity-claim mapping example, JSON/comma-separated/PEM format explanation, and a link to [Node-SAML 5.1.0 configuration](https://github.com/node-saml/node-saml/tree/v5.1.0#config-parameter-details). State that no dedicated SAML enablement flag exists: the four required settings enable it. Note which values disable checks so the documentation describes their actual effect.

Use this identity example:

```dotenv
SAML_NAME=Internal SSO
SAML_ENTRY_POINT=https://idp.example.com/saml/sso
SAML_ISSUER=https://heimdall.example.com
SAML_EMAIL_ATTRIBUTE=email
SAML_GIVEN_NAME_ATTRIBUTE=http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname
SAML_FAMILY_NAME_ATTRIBUTE=lastName
```

Explain immediately below it that `SAML_IDP_CERT` must contain the matching IdP signing certificate; do not paste a fabricated or production credential. Include the session explanation from Task 4 and link to `test/README.md`, added by Task 6 in this same PR.

- [ ] **Step 4: Re-run the coverage check and compare defaults to installed Node-SAML.**

Run the Step 1 check: expected success, 48 names. Verify the documentation against the lockfile-resolved Node-SAML source, especially crypto/default and scoping formats. Keep both documentation files uncommitted.

### Task 6: Add Cypress setup documentation to this PR

**Review comment:** [add the missing Cypress documentation (R4)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141231281). The user deferred its separate-PR requirement; include the content here. The [original setup-documentation request](https://github.com/mitre/heimdall2/pull/8201#discussion_r3809730835) specifically calls for mock startup instructions and matching certificate formats. The local setup, certificate, and test commands below implement those requests.

**Files:** Create `test/README.md`; modify root `README.md` around its existing Cypress section.

**Interfaces:** Consumes the built application, existing `test/support/server/{json-server,oidc-server}.js`, `.env-ci`, and `.github/workflows/e2e-ui-tests.yml`. Produces reproducible test instructions, not a second mock-server framework.

- [x] **Step 1: Create `test/README.md` on `feat/saml-auth`.**

The README must explain Node 22/Yarn, Docker, OpenSSL, the test database, and these existing endpoints: Heimdall `127.0.0.1:3000`, JSON mock `127.0.0.1:3001`, OIDC `localhost:8082`, MockSAML `localhost:4000`, PostgreSQL `5432`, LDAP `10389`, and Splunk `8089` for the full suite. Keep `EXTERNAL_URL=http://127.0.0.1:3000`, matching `.env-ci`, Cypress's base URL and the JSON mock's GitHub callback.

- [x] **Step 2: Document disposable local SAML key generation and matched certificate formats.**

```bash
SAML_TEST_DIR=$(mktemp -d)
export SAML_TEST_DIR
openssl req -x509 -newkey rsa:2048 -nodes -days 2 \
  -subj /CN=heimdall-local-test \
  -keyout "$SAML_TEST_DIR/idp.key" -out "$SAML_TEST_DIR/idp.crt"
```

Use one generated pair for both sides. MockSAML's `PUBLIC_KEY` and `PRIVATE_KEY` are base64-encoded PEM files; Heimdall's `SAML_IDP_CERT` may be PEM or the base64 certificate body. They are different encodings of the same certificate, not interchangeable environment-variable formats. Do not overwrite `apps/backend/.env` or commit generated private keys.

Document these shell commands in the same terminal as certificate generation. Use a clean disposable checkout without an existing backend `.env`: injection preserves that file, but AppConfig can still read unoverridden settings from it.

```bash
export PUBLIC_KEY=$(openssl base64 -A -in "$SAML_TEST_DIR/idp.crt")
export PRIVATE_KEY=$(openssl base64 -A -in "$SAML_TEST_DIR/idp.key")
SAML_TEST_CERT=$(openssl x509 -in "$SAML_TEST_DIR/idp.crt" -outform DER | openssl base64 -A)

docker run --rm -d --name heimdall-e2e-postgres -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres postgres:latest
docker run --rm -d --name heimdall-e2e-ldap -p 10389:10389 rroemhild/test-openldap
docker run --rm -d --name heimdall-e2e-mocksaml -p 4000:4000 \
  -e APP_URL=http://localhost:4000 -e ENTITY_ID=http://localhost:4000/heimdall-local \
  -e PUBLIC_KEY -e PRIVATE_KEY boxyhq/mock-saml

e2e() {
  ./node_modules/.bin/dotenv --override --no-expand -e "$PWD/apps/backend/test/.env-ci" \
    -v NODE_ENV=test -v CYPRESS_TESTING=true \
    -v DATABASE_USERNAME=postgres -v DATABASE_SSL=false \
    -v LOCAL_LOGIN_DISABLED=false -v REGISTRATION_DISABLED=false \
    -v GITHUB_CLIENTID=test -v GITHUB_CLIENTSECRET=test \
    -v "SAML_IDP_CERT=$SAML_TEST_CERT" -- "$@"
}

docker exec heimdall-e2e-postgres pg_isready -U postgres
e2e yarn backend sequelize db:create
e2e yarn backend sequelize db:migrate
e2e yarn backend sequelize db:seed:all
e2e yarn start
```

Wait for PostgreSQL readiness before creating the database. Explicit `-v` values win over the CI file; `--override` prevents unrelated shell variables replacing its database name. Dummy GitHub client values enable the button expected by the existing login spec. Do not infer that CI's certificate is mismatched merely because it cannot be inspected locally.

- [x] **Step 3: Document build/database startup and separate mock terminals.**

Run the existing Yarn scripts for JSON/OIDC. Build with `NODE_ENV=production yarn build` but run the test server with `NODE_ENV=test` and `CYPRESS_TESTING=true`; the latter must be in the process environment for the test-only database-clear endpoint. Point all Sequelize commands at the dedicated test database through the same environment wrapper as the server.

```bash
yarn install --frozen-lockfile
NODE_ENV=production yarn build
yarn cypress-test mock-json
```

In another terminal:

```bash
yarn cypress-test mock-openid
```

Explain that the OIDC mock changes its email-verification response during a run; restart it before rerunning the login spec or starting a new full-suite run.

- [x] **Step 4: Include focused, full-suite, and SAML-only commands.**

```bash
yarn test:ui --spec test/integration/login.cy.ts,test/integration/login-tabs.cy.ts
yarn test:ui
```

For the SAML-only check, stop the backend and run this in the terminal that defines `e2e`:

```bash
e2e env LOCAL_LOGIN_DISABLED=true LDAP_ENABLED=false \
  GITHUB_CLIENTID= GITLAB_CLIENTID= GOOGLE_CLIENTID= \
  OIDC_CLIENTID= OKTA_CLIENTID= TENABLE_HOST_URL= yarn start
```

From another terminal, verify the advertised providers:

```bash
curl --fail --silent http://127.0.0.1:3000/server | python3 -c 'import json,sys; assert json.load(sys.stdin)["enabledAuthStrategies"] == ["saml"]'
```

In a fresh browser session, open `http://127.0.0.1:3000/login`, choose “Login with MockSAML”, enter username `saml` in the IdP and select “Sign In”. Confirm the return to Heimdall and the user fields `saml@example.com`, `saml`, `saml`. This manual smoke run is deliberately separate from the mixed-provider login suite, which needs the other providers enabled.

For the full suite, restore the ordinary `e2e yarn start` invocation and start the existing Splunk mock service:

```bash
docker run --rm -d --name heimdall-e2e-splunk -p 8089:8089 \
  -e SPLUNK_START_ARGS=--accept-license \
  -e SPLUNK_GENERAL_TERMS=--accept-sgt-current-at-splunk-com \
  -e 'SPLUNK_PASSWORD=Valid_password!' \
  -v "$PWD/test/configs/splunk/server.conf:/opt/splunk/etc/system/local/server.conf" \
  splunk/splunk
```

Confirm readiness before Cypress:

```bash
curl --fail http://127.0.0.1:3000
curl --fail http://127.0.0.1:3001/user
curl --fail http://localhost:8082/.well-known/openid-configuration
curl --fail http://localhost:4000
curl --fail --insecure --user 'admin:Valid_password!' https://localhost:8089/services/server/info
```

The local Splunk path follows the image's documented `/opt/splunk` installation. Verify it against the actual image; do not expand this docs task into unrelated CI mount changes. Stop the Yarn processes and only the containers created by this recipe when finished:

```bash
docker stop heimdall-e2e-postgres heimdall-e2e-ldap heimdall-e2e-mocksaml heimdall-e2e-splunk
rm "$SAML_TEST_DIR/idp.key" "$SAML_TEST_DIR/idp.crt"
rmdir "$SAML_TEST_DIR"
unset PUBLIC_KEY PRIVATE_KEY SAML_TEST_CERT SAML_TEST_DIR
```

If the Splunk container was not started, omit its name from cleanup.

Document the CI relationship: `MOCKSAML_PUBLIC_KEY` and `MOCKSAML_PRIVATE_KEY` must form a matching pair, and the certificate must match `.env-ci`'s `SAML_IDP_CERT`. Repository inspection cannot verify secret values. Do not rotate or print CI secrets as part of this task.

- [ ] **Step 5: Verify the recipe and its root README link.**

Follow the README from a fresh local test environment; confirm the focused login spec passes and record any unavailable external mocks separately. Replace the old root README's incomplete startup paragraph with a link to `test/README.md`. Keep the documentation uncommitted.

### Task 7: Verify the complete PR and prepare its update

**Review comments:** [keep commits logically separated within this PR (R17)](https://github.com/mitre/heimdall2/pull/8201#pullrequestreview-5361958817); [resolve branch conflicts (R18)](https://github.com/mitre/heimdall2/pull/8201#issuecomment-5905879353); [publish the environment-variable wiki updates once mergeable (R12)](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141511900).

**Files:** No new production files. Inspect only the changes introduced above and their build outputs.

**Interfaces:** Review fixes in the working-tree diff against `e1eed0cc2`, retaining the original feature and direct fix-to-comment links.

- [x] **Step 1: Verify the original branch and uncommitted scope.**

```bash
git branch --show-current
git diff --check
git diff --stat e1eed0cc2
git diff --cached --stat
git log --oneline e1eed0cc2..HEAD
```

Expected: the branch remains `feat/saml-auth` at `e1eed0cc2`; review fixes remain uncommitted and unstaged, with no imported master changes. No replacement branches or PRs are required. Verify substantive requests against their direct links and record the deferred PR-organization requests accurately.

- [ ] **Step 2: Run the final focused checks and production-image proof.**

```bash
yarn common build
yarn common test:ci
yarn backend test:ci src/config/config.service.spec.ts src/authn/saml.strategy.spec.ts
yarn frontend test:ci
yarn build
yarn test:ui --spec test/integration/login.cy.ts,test/integration/login-tabs.cy.ts
docker build -t heimdall-pr8201-final .
docker run --rm --entrypoint node heimdall-pr8201-final -e 'const {createRequire}=require("node:module"); const r=createRequire("/app/apps/backend/package.json"); if(r("@heimdall/common/interfaces").AUTH_STRATEGY.SAML!=="saml")process.exit(1)'
```

Run the repository's existing lint checks on the changed paths and check the relevant CI jobs. Recheck local/LDAP login, OIDC redirect state, SAML-only login, and Tenable login followed by a proxy request in its existing mock environment. Report unavailable integration services as unverified; do not substitute a source grep for an integration result.

- [x] **Step 3: Prepare the existing PR description update and review-response summary.**

Describe the resulting behavior and actual test results for PR #8201. Include the R1–R18 coverage mapping and session-history explanation. State that PR splitting in R1/R4, commits in R17, and merge completion in R18 are deferred by the user; do not mark those portions resolved. Explain the single retained missing-identity assertion in response to the test-pruning comment. Do not send comments or update the wiki during this planning task.

- [ ] **Step 4: Leave publication deferred.**

Keep every review fix uncommitted and local under the October 6 instruction. Retain the draft PR response and wiki copy without posting them. Do not create additional PRs or retarget this PR.

## Self-review record

- R1 common compilation and R2/R10/R11: Task 2; R13–R16: Task 3; R3/R5–R9: Task 4; R12: Task 5; R4 documentation: Task 6. R1/R4 PR splitting is deferred by the October 5 override; R17 commits and R18 merge completion are deferred by the October 6 override in Tasks 1 and 7.
- Public names are consistent across tasks; the existing SAML feature remains present throughout, including the compiled common constants.
- Every R1–R18 requirement retains its direct GitHub comment/review link beside its fix or explicit deferral; no fix depends solely on a link through the separate specification.
- This plan was revised for the October 6 instruction. The execution record separates historical merged-branch results from current original-baseline verification; no push, PR comment, wiki publication or new PR was performed.
