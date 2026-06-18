# ESLint Configuration Decisions

This document records every rule override in `eslint.config.mjs` with the reason, evidence, and whether the fix is permanent or interim.

## Background

ESLint 10 with flat config was introduced in PR #7919 (Amndeep, 2026-04-10). The upgrade added strict rules but the codebase was never brought into compliance. `yarn lint:ci` had `|| true` masking all failures. This document tracks the cleanup decisions.

## Rule Overrides

### Rules Disabled (with justification)

| Rule | Status | Reason | Evidence | Permanent? |
|------|--------|--------|----------|------------|
| `perfectionist/sort-modules` | OFF | Reorders type/interface declarations alphabetically. Breaks TypeScript circular type references (e.g., `ContextualizedControl` ↔ `ContextualizedProfile` in `inspecjs/context.ts`). TypeScript resolves circular types by declaration order — sorting destroys that. [perfectionist docs](https://perfectionist.dev/rules/sort-modules) | `TS2456: Type alias circularly references itself` after auto-fix | Yes — no safe way to sort interdependent types |
| `import-x/namespace` | OFF | Cannot resolve CommonJS namespace exports. `import * as _ from 'lodash'` then `_.get()` produces 736 false positives ("'get' not found in imported namespace"). Lodash is CJS; the rule needs ESM exports to validate. [rule docs](https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/namespace.md) | [eslint-plugin-import-x namespace rule](https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/namespace.md) | Interim — fix by migrating to `lodash-es` |
| `n/no-missing-import` | OFF | Cannot resolve TypeScript paths or monorepo workspace imports. Reports false "missing" for `./context`, `./fileparse` etc. in TS libs. [eslint-plugin-n docs](https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-missing-import.md) | All hits are valid TS imports that compile fine | Interim — configure with proper TS resolver |
| `n/no-unpublished-import` | OFF | Same root cause as `n/no-missing-import` — the `n` plugin doesn't understand monorepo workspace links. [eslint-plugin-n docs](https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unpublished-import.md) | Same evidence | Interim — configure with proper TS resolver |
| `n/no-unsupported-features/es-syntax` | OFF | Defaults to Node `>=16.0.0` when lib `package.json` has no `engines` field. Reports regex `v` flag as unsupported. Root `package.json` specifies `>=22.18.0`. [eslint-plugin-n docs](https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unsupported-features/es-syntax.md) | `'regexp-v-flag' is not supported until Node.js >=20.0.0` on valid code | Interim — add `engines` to lib package.json files |
| `unicorn/prefer-spread` | OFF | Auto-fix converts `.concat()` to spread syntax incorrectly. `_.concat([], a, b)` becomes `[..._, a, b]` — spreading the lodash namespace object into an array. Known issue: [unicorn#1147](https://github.com/sindresorhus/eslint-plugin-unicorn/issues/1147), [unicorn#1809](https://github.com/sindresorhus/eslint-plugin-unicorn/issues/1809). | Build failure: `TS2488: Type lodash must have [Symbol.iterator]` | Yes — auto-fix is unsafe for CJS namespaces |
| `e18e/prefer-spread-syntax` | OFF | Same dangerous auto-fix as `unicorn/prefer-spread` — converts `.concat()` to spread. Redundant with `unicorn/prefer-spread`. [e18e docs](https://github.com/nicolo-ribaudo/eslint-plugin-e18e#prefer-spread-syntax) | Same evidence as above | Yes — same root cause |
| `@typescript-eslint/consistent-type-definitions` | OFF | Was `['error', 'type']` — auto-fix converts `interface` to `type`. Breaks circular type references: `interface` is lazily evaluated (supports cycles), `type` is eagerly evaluated (TS2456). [typescript-eslint#10224](https://github.com/typescript-eslint/typescript-eslint/issues/10224), [typescript-eslint#3648](https://github.com/typescript-eslint/typescript-eslint/issues/3648) | `TS2456: Type alias circularly references itself` in `inspecjs/context.ts` after auto-fix | Yes — interfaces needed for circular type patterns |

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
| `security/detect-object-injection` | WARN | False positives on `_.get()` and bracket notation with validated keys. Proper fix per-file: use typed access (card 7ci) or `Map` (as in `source_format_util.ts`). | [rule docs](https://github.com/eslint-community/eslint-plugin-security/blob/main/docs/rules/detect-object-injection.md) |
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

## TSConfig Fixes (related)

| Package | Change | Reason |
|---------|--------|--------|
| `libs/inspecjs/tsconfig.json` | Added `"types": ["node"]`, `include: ["src/**/*.ts", "test/**/*.ts"]` | Spec files use `fs` — needs @types/node. Include both src and test for editor/type-check. |
| `libs/inspecjs/tsconfig.build.json` | Added `rootDir: "src"`, exclude specs | Build output only from src, not test files. |
| `libs/hdf-converters/tsconfig.json` | Added `"types": ["node"]`, `include: ["src/**/*.ts", "test/**/*.ts", "types/**/*.ts"]` | Same @types/node fix. Also includes `types/` directory (Splunk, XCCDF type definitions). |
| `libs/hdf-converters/tsconfig.build.json` | Added `rootDir: "."`, include `types/**/*.ts` | Types dir is outside src but imported by source files. |

## Remaining Work (card 4qm)

- ~405 non-auto-fixable lint errors remain in hdf-converters
- Top categories: `restrict-template-expressions` (81), `prefer-named-capture-group` (16), `no-unsafe-enum-comparison` (14)
- Fix `@eslint/markdown` crash (`getLoc()` method error) — update `@eslint/markdown` package
- Remove `|| true` from `lint:ci` script once errors are at zero
- Write `engines` field in lib package.json files to fix `n/` rules properly
- Consider migrating `lodash` → `lodash-es` to re-enable `import-x/namespace`
