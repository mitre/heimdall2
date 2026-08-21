# ESLint Configuration Decisions

This document records every rule override in `eslint.config.mjs` with the reason, evidence, and whether the fix is permanent or interim.

## Background

ESLint 10 with flat config was introduced in PR #7919 (Amndeep, 2026-04-10). The upgrade added strict rules but the codebase was never brought into compliance. `yarn lint:ci` had `|| true` masking all failures. This document tracks the cleanup decisions.

## Rule Overrides

### Rules Disabled (with justification)

| Rule | Status | Reason | Evidence | Permanent? |
|------|--------|--------|----------|------------|
| `perfectionist/sort-classes` | OFF | Conflicts with `unicorn/consistent-class-member-order`. Perfectionist's default orders public methods before private methods; unicorn orders by access level (private before public). Both rules in `recommended` presets — fixing one triggers the other (7 oscillating errors across 5 files). Decision: keep unicorn's structural ordering (access-level grouping) as authoritative for class members. Perfectionist's value-add is alphabetical sorting within groups, which is less important for mapper classes with well-known method patterns (`toHdf()`, `createMapper()`, private helpers). [perfectionist docs](https://perfectionist.dev/rules/sort-classes), [unicorn docs](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-class-member-order.md) | `Expected private method 'delay' to come before public method 'toHdf'` (unicorn) vs `Expected 'trackJob' to come before 'delay'` (perfectionist) — fixing either triggers the other | Yes — fundamental ordering conflict between the two plugins' defaults |
| `perfectionist/sort-modules` | OFF | Reorders type/interface declarations alphabetically. Breaks TypeScript circular type references (e.g., `ContextualizedControl` ↔ `ContextualizedProfile` in `inspecjs/context.ts`). TypeScript resolves circular types by declaration order — sorting destroys that. [perfectionist docs](https://perfectionist.dev/rules/sort-modules) | `TS2456: Type alias circularly references itself` after auto-fix | Yes — no safe way to sort interdependent types |
| `import-x/namespace` | OFF | Cannot resolve CommonJS namespace exports. `import * as _ from 'lodash'` then `_.get()` produces 736 false positives ("'get' not found in imported namespace"). Lodash is CJS; the rule needs ESM exports to validate. [rule docs](https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/namespace.md) | [eslint-plugin-import-x namespace rule](https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/namespace.md) | Interim — fix by migrating to `lodash-es` |
| `n/no-missing-import` | OFF | Cannot resolve TypeScript paths or monorepo workspace imports. Reports false "missing" for `./context`, `./fileparse` etc. in TS libs. [eslint-plugin-n docs](https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-missing-import.md) | All hits are valid TS imports that compile fine | Interim — configure with proper TS resolver |
| `n/no-unpublished-import` | OFF | Same root cause as `n/no-missing-import` — the `n` plugin doesn't understand monorepo workspace links. [eslint-plugin-n docs](https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unpublished-import.md) | Same evidence | Interim — configure with proper TS resolver |
| `n/no-unsupported-features/es-syntax` | OFF | Defaults to Node `>=16.0.0` when lib `package.json` has no `engines` field. Reports regex `v` flag as unsupported. Root `package.json` specifies `>=22.18.0`. [eslint-plugin-n docs](https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unsupported-features/es-syntax.md) | `'regexp-v-flag' is not supported until Node.js >=20.0.0` on valid code | Interim — add `engines` to lib package.json files |
| `unicorn/prefer-spread` | OFF | Auto-fix converts `.concat()` to spread syntax incorrectly. `_.concat([], a, b)` becomes `[..._, a, b]` — spreading the lodash namespace object into an array. Known issue: [unicorn#1147](https://github.com/sindresorhus/eslint-plugin-unicorn/issues/1147), [unicorn#1809](https://github.com/sindresorhus/eslint-plugin-unicorn/issues/1809). | Build failure: `TS2488: Type lodash must have [Symbol.iterator]` | Yes — auto-fix is unsafe for CJS namespaces |
| `e18e/prefer-spread-syntax` | OFF | Same dangerous auto-fix as `unicorn/prefer-spread` — converts `.concat()` to spread. Redundant with `unicorn/prefer-spread`. [e18e docs](https://github.com/nicolo-ribaudo/eslint-plugin-e18e#prefer-spread-syntax) | Same evidence as above | Yes — same root cause |
| `@typescript-eslint/consistent-type-definitions` | OFF | Was `['error', 'type']` — auto-fix converts `interface` to `type`. Breaks circular type references: `interface` is lazily evaluated (supports cycles), `type` is eagerly evaluated (TS2456). [typescript-eslint#10224](https://github.com/typescript-eslint/typescript-eslint/issues/10224), [typescript-eslint#3648](https://github.com/typescript-eslint/typescript-eslint/issues/3648) | `TS2456: Type alias circularly references itself` in `inspecjs/context.ts` after auto-fix | Yes — interfaces needed for circular type patterns |
| `import-x/no-named-as-default-member` | OFF | Same root cause as `import-x/namespace`. Cannot resolve CJS namespace exports. `import * as _ from 'lodash'` then `_.get()` produces 71 false positives ("'get' is also a named export — did you mean import {get}?"). Lodash is CJS; named exports don't exist. [rule docs](https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-named-as-default-member.md) | 71 false positives on lodash member access | Interim — fix by migrating to `lodash-es` |
| `security/detect-object-injection` | OFF | Previously WARN — 61 warnings across the codebase, nearly all false positives on internal iteration (`Object.keys()` → `obj[key]`, lodash `_.get()` patterns). With `--max-warnings 0`, every warning fails CI. Proper fix per-file: convert Record bracket access to `Map.get()` where key source is external input. Most instances are internal-only iteration with no user input path. [rule docs](https://github.com/eslint-community/eslint-plugin-security/blob/main/docs/rules/detect-object-injection.md) | 61 warnings, all on internal iteration patterns | Interim — evaluate each instance individually; convert to Map.get() at trust boundaries |
| `unicorn/no-useless-else` | OFF | **DANGEROUS AUTO-FIX.** Converts `if (cond) { continue; } else { ... }` to `if (cond) {} ...` — silently removes the `continue` statement and the `else` block. Code that was guarded by the `continue` now runs unconditionally. Caused stack overflow in `inspecjs/context.ts` (circular `extendedBy`/`extendsFrom` references). Found and fixed in 4 files across the project (context.ts, compat_inspec_1_0.ts, ExportCSVModal.vue, Compare.spec.ts). [Track upstream](https://github.com/sindresorhus/eslint-plugin-unicorn/issues) | `RangeError: Maximum call stack size exceeded` in ContextualizedControlImp.get root after auto-fix | Yes — auto-fix is destructive; removes control flow statements |
| `vitest/expect-expect` | OFF | Test helper functions wrap `expect()` calls (e.g., `loadAndConvert()` runs assertions internally). The rule only looks for `expect` in the immediate test body, not in called functions. `assertFunctionNames` config option doesn't support the variety of helper patterns in this codebase. [rule docs](https://github.com/veritem/eslint-plugin-vitest/blob/main/docs/rules/expect-expect.md) | 25 false positives across test files using helper functions | Interim — configure `assertFunctionNames` when helper names are standardized |
| `n/no-unsupported-features/es-builtins` | OFF | Same root cause as `n/no-unsupported-features/es-syntax` — defaults to Node `>=16.0.0` when lib `package.json` has no `engines` field. | Reports modern builtins as unsupported | Interim — add `engines` to lib package.json files |
| `n/no-unsupported-features/node-builtins` | OFF | Same root cause as above. | Reports modern Node APIs as unsupported | Interim — add `engines` to lib package.json files |
| `@eslint/markdown` config block | COMMENTED OUT | `@eslint/markdown` v8.0.2 crashes ESLint with `Custom getLoc() method must be implemented in the subclass` due to incompatibility with `@eslint/plugin-kit` 0.7.2. Both packages are on latest versions — no upstream fix available. Markdown linting was never enforced (crash was masked by `|| true` in `lint:ci`). Imports removed (re-add when re-enabling). [Track upstream](https://github.com/eslint/markdown/issues) | `Error: Custom getLoc() method must be implemented in the subclass` on any `.md` file | Interim — re-enable when upstream fixes the crash |

### Resolver Configuration

| Setting | Value | Reason | Docs |
|---------|-------|--------|------|
| `import-x/resolver-next` (global) | `createTypeScriptImportResolver({alwaysTryTypes: true, project: ['tsconfig.json', 'apps/*/tsconfig.json', 'libs/*/tsconfig.json'], noWarnOnMultipleProjects: true})` | The `eslint-import-resolver-typescript` package (v4.4.4) was installed but never wired into the config. Without it, `import-x/no-unresolved` could not resolve TypeScript paths, monorepo cross-package imports, or `.vue` file imports — producing 374 false positives. | [eslint-import-resolver-typescript docs](https://github.com/import-js/eslint-import-resolver-typescript#readme), [import-x resolver-next docs](https://github.com/un-ts/eslint-plugin-import-x#resolver-next) |
| `import-x/resolver-next` (frontend override) | `createTypeScriptImportResolver({alwaysTryTypes: true, project: 'apps/frontend/tsconfig.json'})` scoped to `apps/frontend/**/*.{ts,vue}` | When linting all packages together, the `projectService` assigns `.vue` files to the root tsconfig (which has no `@/` path alias) instead of the frontend tsconfig. A frontend-specific override ensures `@/*` imports resolve correctly. | [TypeScript path mapping](https://www.typescriptlang.org/tsconfig#paths) |

### Scoped Overrides (directory-level)

| Scope | Rule | Status | Reason | Permanent? |
|-------|------|--------|--------|------------|
| `**/scripts/**/*.ts` | `security/detect-non-literal-fs-filename` | OFF | Developer tools (fixture regeneration, data converters) use dynamic file paths from hardcoded registries — not user input. The rule is designed for user-facing code where untrusted input reaches `fs` operations ([rule docs](https://github.com/eslint-community/eslint-plugin-security/blob/main/docs/rules/detect-non-literal-fs-filename.md)). Scripts with controlled registries are categorically different. Paths are validated via `validateFixturePath()` to only allow `sample_jsons/` prefix. | Yes — scripts are not user-facing |
| `**/scripts/**/*.ts` | `security/detect-object-injection` | OFF | Developer tools iterate over object keys from parsed JSON fixtures and mapper registries — not user input. The `diffProfiles()` validation function uses `baseline[key]` and `current[key]` where keys come from `Object.keys()` of parsed fixture data, not external input. ([rule docs](https://github.com/eslint-community/eslint-plugin-security/blob/main/docs/rules/detect-object-injection.md)) | Yes — scripts are not user-facing |
| `libs/inspecjs/**/*.ts` | `unicorn/consistent-boolean-name` | OFF | InSpec schema uses domain-specific boolean property names (`waived`, `attested`, `keepErrors`) that are part of the public API consumed across the monorepo. Renaming would be a cross-package breaking change. | Yes — InSpec schema terms |
| `libs/inspecjs/**/*.ts` | `unicorn/consistent-class-member-order` | OFF | Abstract class hierarchy (`HDFControl10` → `ExecControl`/`ProfileControl`) has getters before constructors for readability. Unicorn's ordering conflicts with the inheritance pattern. | Yes — abstract class hierarchy pattern |
| `libs/inspecjs/**/*.ts` | `unicorn/no-break-in-nested-loop` | OFF | `break` in nested loop in `context.ts` (line 222) is clearer than extracting to a separate function. The loop logic is tightly coupled to the surrounding context. | Yes — code clarity |
| `libs/inspecjs/**/*.ts` | `security/detect-non-literal-fs-filename` | OFF | Test fixture loading uses dynamic paths from `parse_testbed/` directory. Same pattern as hdf-converters test utils. | Yes — test fixtures |
| `libs/password-complexity/**/*.js` | `unicorn/prefer-module` | OFF | CJS module consumed by both frontend (webpack) and backend (Jest) with different module systems. Converting to ESM risks breaking the build pipeline. [rule docs](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-module.md) | Interim — convert to ESM when monorepo module strategy is unified |
| `test/**/*.ts`, `cypress.config.ts` | `n/no-extraneous-import` | OFF | Cypress and test support files import from packages (`cypress`, `cypress-terminal-report`) that are devDependencies in the root package.json. The `n` plugin can't resolve monorepo workspace hoisting. | Yes — monorepo dev deps |
| `test/**/*.ts`, `cypress.config.ts` | `vitest/no-standalone-expect` | OFF | Cypress tests use `expect()` inside `.then()` callbacks and Cypress command chains, not inside vitest `it()` blocks. The vitest plugin doesn't understand Cypress test structure. | Yes — Cypress test pattern |
| `test/**/*.ts`, `cypress.config.ts` | `vitest/valid-expect` | OFF | Cypress uses Chai assertions (`expect(...).to.exist`, `expect(...).to.be.oneOf(...)`) that vitest doesn't recognize as valid matchers. | Yes — Chai assertion syntax |
| `test/**/*.ts`, `cypress.config.ts` | `@typescript-eslint/no-unused-expressions` | OFF | Chai property assertions (`expect(x).to.exist`) are expressions, not function calls. TypeScript's `no-unused-expressions` flags them as unused. This is standard Chai syntax. | Yes — Chai assertion pattern |
| `test/**/*.ts`, `cypress.config.ts` | `promise/always-return`, `promise/catch-or-return` | OFF | Cypress `.then()` callbacks don't follow standard Promise semantics — Cypress manages the chain internally. Returns are not required. | Yes — Cypress chain pattern |
| `test/**/*.ts`, `cypress.config.ts` | `unicorn/prefer-dom-node-text-content` | OFF | Cypress tests use `innerText` which returns rendered text (respects CSS visibility). `textContent` returns all text including hidden elements. For UI verification tests, `innerText` is the correct property. | Yes — UI test semantics |
| `tools/**/*.ts` | `n/no-extraneous-import` | OFF | Tools/cli imports from workspace packages (`@oclif/core`, `@clack/prompts`) that are in the tools/cli package.json but not in the root. The `n` plugin can't resolve workspace-local dependencies. | Yes — monorepo workspace deps |
| `**/vitest.config.ts` | `n/no-extraneous-import` | Configured with `allowModules: ['vite']` | `vite` is a peer dependency of `vitest`, not a direct dependency. The `n` plugin reports it as extraneous because it's not in `dependencies` or `devDependencies` of the package consuming it. | Yes — peer dep pattern |

### Rules Reconfigured (not disabled)

| Rule | Change | Reason | Permanent? |
|------|--------|--------|------------|
| `unicorn/filename-case` | `snakeCase` → `{cases: {kebabCase: true, snakeCase: true, camelCase: true, pascalCase: true}}` | Codebase has mixed conventions: kebab (`asff-mapper.ts`), camel (`CCI_List.ts`), pascal (`CweNistMapping.ts`), snake (`exec_json.ts`). All four cases allowed. [rule docs](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/filename-case.md) | Yes |
| `@typescript-eslint/consistent-type-imports` | Added `{fixStyle: 'inline-type-imports'}` | Default fix splits `import {X} from 'y'` into separate `import type {X}` + `import {Y}` statements. Breaks when `X` is used as both type and value (e.g., enums). Inline style keeps one import statement. [rule docs](https://typescript-eslint.io/rules/consistent-type-imports/#fixstyle) | Yes |
| `@typescript-eslint/restrict-template-expressions` | Added `{allowNumber: true, allowBoolean: true, allowNullish: true}` | Default config errors on `${number}` and `${boolean}` in template literals. Numbers and booleans have predictable string coercion — `String(42)` is busywork. [rule docs](https://typescript-eslint.io/rules/restrict-template-expressions/) | Yes |
| `@typescript-eslint/no-unused-vars` | Added `{argsIgnorePattern: '^_', varsIgnorePattern: '^_'}` | Standard pattern — prefix unused vars with `_` to signal intent. [rule docs](https://typescript-eslint.io/rules/no-unused-vars/#argsignorepattern) | Yes |

### Rules Kept As-Is (notable)

| Rule | Status | Notes | Docs |
|------|--------|-------|------|
| `security/detect-object-injection` | OFF (was WARN) | Moved to OFF globally — see "Rules Disabled" table. 61 warnings were all false positives on internal iteration. With `--max-warnings 0`, every warning fails CI. | [rule docs](https://github.com/eslint-community/eslint-plugin-security/blob/main/docs/rules/detect-object-injection.md) |
| `@typescript-eslint/restrict-template-expressions` | ERROR | Legitimate — catches `unknown` type values in template literals. Each instance needs `String()` wrapper or type narrowing. | [rule docs](https://typescript-eslint.io/rules/restrict-template-expressions/) |
| `regexp/prefer-named-capture-group` | ERROR | Legitimate — named groups (`(?<name>...)`) improve readability and prevent index-based access bugs (e.g., `match[1]` breaks when `(?:)` is used). Manual fix per regex. | [rule docs](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/docs/rules/prefer-named-capture-group.md) |
| `e18e/prefer-static-regex` | ERROR | Legitimate — moves regex construction to module scope for performance (avoids recompilation per call). Manual fix: create `const MY_RE = /.../v` at top of file. | [e18e docs](https://github.com/nicolo-ribaudo/eslint-plugin-e18e#prefer-static-regex) |
| `unicorn/consistent-boolean-name` | ERROR | Legitimate — boolean variables must start with `is`, `has`, `can`, `should`, `was`, `did`, `will`. Improves readability. May cascade to other files when renaming class properties. | [rule docs](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-boolean-name.md) |

## Auto-Fix Safety

**Safe to run `eslint --fix` on:**
- All frontend files (`apps/frontend/src/**/*.ts`, `*.vue`)
- All lib files AFTER the above rules are disabled

**Known auto-fix hazards (now disabled):**
1. `unicorn/prefer-spread` — breaks `.concat()` calls on CJS namespaces
2. `e18e/prefer-spread-syntax` — same
3. `perfectionist/sort-modules` — breaks circular type declarations by reordering
4. `@typescript-eslint/consistent-type-definitions` — converts `interface` to `type`, breaks circular references (interfaces are lazy, types are eager)
5. `@typescript-eslint/consistent-type-imports` (without `inline-type-imports`) — splits imports unsafely
6. `unicorn/no-useless-else` — **CRITICAL.** Converts `if (cond) { continue; } else { ... }` to `if (cond) {} ...`. Silently removes `continue` statements. Caused stack overflow in `inspecjs/context.ts` when control binding code ran unconditionally instead of being skipped. Found and manually restored in 4 files (context.ts, compat_inspec_1_0.ts, ExportCSVModal.vue, Compare.spec.ts). Discovered 2026-06-26.

## TSConfig Fixes (related)

| Package | Change | Reason |
|---------|--------|--------|
| `libs/inspecjs/tsconfig.json` | Added `"types": ["node"]`, `include: ["src/**/*.ts", "test/**/*.ts"]` | Spec files use `fs` — needs @types/node. Include both src and test for editor/type-check. |
| `libs/inspecjs/tsconfig.build.json` | Added `rootDir: "src"`, exclude specs | Build output only from src, not test files. |
| `libs/hdf-converters/tsconfig.json` | Added `"types": ["node"]`, `include: ["src/**/*.ts", "test/**/*.ts", "types/**/*.ts"]` | Same @types/node fix. Also includes `types/` directory (Splunk, XCCDF type definitions). |
| `libs/hdf-converters/tsconfig.build.json` | Added `rootDir: "."`, include `types/**/*.ts` | Types dir is outside src but imported by source files. |

### Global Ignores

Files excluded from linting entirely via the `ignores` array in eslint.config.mjs:

| Pattern | Reason |
|---------|--------|
| `**/dist`, `**/lib`, `**/node_modules` | Build output and dependencies (standard) |
| `libs/inspecjs/src/generated_parsers/**` | Auto-generated parser code from InSpec JSON schema |
| `libs/hdf-converters/types/**/*.js`, `libs/hdf-converters/types/**/*.d.ts` | Compiled output from TypeScript source files in types/ — not in tsconfig's project service |
| `libs/hdf-converters/data/reverse-html-mapper/tw-elements.min.js` | Vendored minified library — not our code |
| `libs/hdf-converters/schemas/checklist/**/jsonix-compiler-output/**` | JSONIX-generated CKL schema code |
| `libs/hdf-converters/sample_jsons/**/*.js` | Test fixture data (ScoutSuite sample JS) |
| `apps/backend/migrations/**` | Sequelize migration JS files — legacy CJS, not in tsconfig |
| `apps/backend/seeders/**` | Sequelize seeder JS files — same |
| `apps/frontend/src/server.js` | Legacy dev server script — CJS, not in tsconfig |
| `test/support/server/**` | JSON server + OIDC mock server for integration tests — CJS |
| `.vscode/**` | Editor config (launch.json) — not code |
| `postcss.config.js` | PostCSS config — CJS, not in tsconfig |

### Package.json Config

| Setting | Value | Reason |
|---------|-------|--------|
| `e18e/ban-dependencies` allowed list | `['axios', 'lodash', 'moment']` | These are core dependencies of hdf-converters. The `e18e` plugin recommends replacements (fetch, native JS, dayjs) but migration is out of scope for lint cleanup. Allowed to prevent CI failures on dependency presence. |

## Remaining Work (card 4qm)

- hdf-converters: **0 errors** (complete)
- inspecjs: **0 errors** (complete)
- libs/common + password-complexity: **0 errors** (complete)
- test/root/tools: **0 errors** (complete)
- **apps/frontend: ~670 errors** (card 4qm.63) — top rules: unicorn/prefer-await (122), no-floating-promises (72), promise/always-return (57), require-await (37)
- **apps/backend: ~236 errors** (card 4qm.64) — top rules: require-await (37), restrict-template-expressions (27), no-await-expression-member (18)
- `@eslint/markdown` crash — disabled, awaiting upstream fix
- Remove `|| true` from `lint:ci` script once ALL packages are at zero (card 4qm.62, blocked by 4qm.63 + 4qm.64)
- Write `engines` field in lib package.json files to fix `n/` rules properly
- Consider migrating `lodash` → `lodash-es` to re-enable `import-x/namespace`
- Consider migrating `moment` → `dayjs` to remove `e18e/ban-dependencies` allowed entry
