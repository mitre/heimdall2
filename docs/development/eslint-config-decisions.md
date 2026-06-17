# ESLint Configuration Decisions

This document records every rule override in `eslint.config.mjs` with the reason, evidence, and whether the fix is permanent or interim.

## Background

ESLint 10 with flat config was introduced in PR #7919 (Amndeep, 2026-04-10). The upgrade added strict rules but the codebase was never brought into compliance. `yarn lint:ci` had `|| true` masking all failures. This document tracks the cleanup decisions.

## Rule Overrides

### Rules Disabled (with justification)

| Rule | Status | Reason | Evidence | Permanent? |
|------|--------|--------|----------|------------|
| `perfectionist/sort-modules` | OFF | Reorders type/interface declarations alphabetically. Breaks TypeScript circular type references (e.g., `ContextualizedControl` ↔ `ContextualizedProfile` in `inspecjs/context.ts`). TypeScript resolves circular types by declaration order — sorting destroys that. [perfectionist docs](https://perfectionist.dev/rules/sort-modules) | `TS2456: Type alias circularly references itself` after auto-fix | Yes — no safe way to sort interdependent types |
| `import-x/namespace` | OFF | Cannot resolve CommonJS namespace exports. `import * as _ from 'lodash'` then `_.get()` produces 736 false positives ("'get' not found in imported namespace"). Lodash is CJS; the rule needs ESM exports to validate. | [eslint-plugin-import-x known limitation](https://github.com/un-ts/eslint-plugin-import-x) | Interim — fix by migrating to `lodash-es` |
| `n/no-missing-import` | OFF | Cannot resolve TypeScript paths or monorepo workspace imports. Reports false "missing" for `./context`, `./fileparse` etc. in TS libs. [eslint-plugin-n docs](https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-missing-import.md) | All hits are valid TS imports that compile fine | Interim — configure with proper TS resolver |
| `n/no-unpublished-import` | OFF | Same root cause as `n/no-missing-import` — the `n` plugin doesn't understand monorepo workspace links. [eslint-plugin-n docs](https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unpublished-import.md) | Same evidence | Interim — configure with proper TS resolver |
| `n/no-unsupported-features/es-syntax` | OFF | Defaults to Node `>=16.0.0` when lib `package.json` has no `engines` field. Reports regex `v` flag as unsupported. Root `package.json` specifies `>=22.18.0`. [eslint-plugin-n docs](https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unsupported-features/es-syntax.md) | `'regexp-v-flag' is not supported until Node.js >=20.0.0` on valid code | Interim — add `engines` to lib package.json files |
| `unicorn/prefer-spread` | OFF | Auto-fix converts `.concat()` to spread syntax incorrectly. `_.concat([], a, b)` becomes `[..._, a, b]` — spreading the lodash namespace object into an array. Known issue: [unicorn#1147](https://github.com/sindresorhus/eslint-plugin-unicorn/issues/1147), [unicorn#1809](https://github.com/sindresorhus/eslint-plugin-unicorn/issues/1809). | Build failure: `TS2488: Type lodash must have [Symbol.iterator]` | Yes — auto-fix is unsafe for CJS namespaces |
| `e18e/prefer-spread-syntax` | OFF | Same dangerous auto-fix as `unicorn/prefer-spread` — converts `.concat()` to spread. Redundant with `unicorn/prefer-spread`. | Same evidence as above | Yes — same root cause |
| `@typescript-eslint/consistent-type-definitions` | OFF | Was `['error', 'type']` — auto-fix converts `interface` to `type`. Breaks circular type references: `interface` is lazily evaluated (supports cycles), `type` is eagerly evaluated (TS2456). [typescript-eslint#10224](https://github.com/typescript-eslint/typescript-eslint/issues/10224), [typescript-eslint#3648](https://github.com/typescript-eslint/typescript-eslint/issues/3648) | `TS2456: Type alias circularly references itself` in `inspecjs/context.ts` after auto-fix | Yes — interfaces needed for circular type patterns |

### Rules Reconfigured (not disabled)

| Rule | Change | Reason | Permanent? |
|------|--------|--------|------------|
| `unicorn/filename-case` | `snakeCase` → `{cases: {kebabCase: true, snakeCase: true}}` | Entire codebase uses kebab-case (`asff-mapper.ts`). Rule was configured for snake-only. Both conventions are valid. | Yes |
| `@typescript-eslint/consistent-type-imports` | Added `{fixStyle: 'inline-type-imports'}` | Default fix splits `import {X} from 'y'` into separate `import type {X}` + `import {Y}` statements. Breaks when `X` is used as both type and value (e.g., enums). Inline style keeps one import statement. [typescript-eslint docs](https://typescript-eslint.io/rules/consistent-type-imports/#fixstyle) | Yes |
| `@typescript-eslint/restrict-template-expressions` | Added `{allowNumber: true, allowBoolean: true}` | Default config errors on `${number}` and `${boolean}` in template literals. Numbers and booleans have predictable string coercion — `String(42)` is busywork. [typescript-eslint docs](https://typescript-eslint.io/rules/restrict-template-expressions/) | Yes |
| `unicorn/filename-case` | Allow camelCase + pascalCase too | Codebase has mixed conventions: kebab (`asff-mapper.ts`), camel (`CCI_List.ts`), pascal (`CweNistMapping.ts`). All four cases allowed. | Yes |

### Rules Kept As-Is (notable)

| Rule | Status | Notes |
|------|--------|-------|
| `security/detect-object-injection` | WARN | False positives on static objects with bracket notation. Warnings are acceptable — switching to `Map` (as done in `source_format_util.ts`) is the proper fix per-file. |
| `@typescript-eslint/restrict-template-expressions` | ERROR | Legitimate — catches non-string values in template literals. Each instance needs a manual `String()` conversion. |
| `regexp/prefer-named-capture-group` | ERROR | Legitimate — named groups improve readability. Manual fix per regex. |
| `e18e/prefer-static-regex` | ERROR | Legitimate — moves regex to module scope for performance. Manual fix (create const at top of file). |

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
