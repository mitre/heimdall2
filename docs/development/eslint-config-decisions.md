# ESLint Configuration Decisions

This document records the reasoning behind `eslint.config.mjs`. It is the design doc referenced by
the lint cards (`heimdall2-4qm` and children) and by `eslint.config.mjs` itself, which cites the
auto-fix hazard numbers in §5 from its own comments.

**Rewritten 2026-08-14** against the 814-line config. The previous version described a 211-line
config from 2026-06-25 and had gone substantially wrong — see §9 for what changed and why.

**Rule of thumb for this file:** the config carries its own rationale in comments at each decision
site. That is the primary record. This document explains the *shape* of the configuration and the
decisions that span more than one rule. Where the two ever disagree, the config is authoritative —
it is the executable one.

## 1. Background

ESLint 10 with flat config arrived in PR #7919 (Amndeep, 2026-04-10). The upgrade turned on strict
rules but the codebase was never brought into compliance, and `yarn lint:ci` carried `|| true`,
which masked every failure. At the start of the cleanup there were **58,124 problems** across 709
files.

Card `heimdall2-4qm` drove that to **zero**. `yarn lint:ci` now runs `eslint --max-warnings 0` and
**exits 0**, the `|| true` is gone from every workspace package, and the `continue-on-error` escape
was removed from `.github/workflows/linter.yml` in `1e57fee7d` — so lint is genuinely blocking in
CI for the first time.

## 2. How the config is organized

Flat config is **last-wins**: a later block overrides an earlier one for any file both match. The
file is ordered accordingly — broad presets first, scoped exceptions after, and
`eslint-config-prettier` **last** so formatting rules lose to Prettier rather than fight it.

Roughly 40 named blocks. Every scoped block carries a `name:` and a comment explaining what it
covers and why, so a reader can tell a deliberate carve-out from an accident.

### Preset curation, not wholesale extension

The governing principle: **one generalist plugin, domain specialists where they earn it, and
everything else curated rule by rule.** Wholesale-extending overlapping presets produces the same
finding reported three to five times by different plugins, and the fix for one trips another.

- Generalist: `unicorn`
- Domain specialists: `regexp`, `security`, `import-x`, `n`, `promise`, `vue`, `vitest`, `cypress`,
  `yml`, `json`, `markdown` (+ `markdown-links`, `markdown-preferences`), `@stylistic`
- Type-aware: `typescript-eslint`
- **`perfectionist`'s preset is deliberately NOT extended** (config lines 84 and 107). It remains a
  dependency but its `sort-*` rules are not adopted; that overlap is exactly what the curation rule
  exists to prevent.
- `e18e` is adopted selectively — its checks that duplicate a specialist are turned off (§3.1).

## 3. Global rule decisions

Grouped by the *reason*, because the reason is what generalizes. Every one of these carries its
full rationale inline in `eslint.config.mjs`.

### 3.1 Duplicate checks — the specialist owns it

Two plugins reporting the same defect means acting on the cruder signal and fixing things twice.

| Off | Owned instead by |
|---|---|
| `e18e/prefer-regex-test` | `regexp/prefer-regexp-test` |
| `e18e/prefer-array-some` | `unicorn/prefer-array-some` |
| `n/no-process-exit` | `unicorn/no-process-exit` (also off — see 3.4) |
| `security/detect-unsafe-regex` | `regexp/no-super-linear-backtracking` and `-move` |

The regex case is the instructive one. `security/detect-unsafe-regex` is safe-regex's *star-height
heuristic*, which cannot distinguish an ambiguous pattern from a merely nested one. The `regexp`
plugin's rules model actual backtracking, are enabled, and are what actually found the real
problems on this branch — the `DATABASE_URL` catch-all tail and the ASFF quantifiers. Keeping both
means acting on the cruder signal.

### 3.2 Rules ahead of this repo's runtime floor

The rule is correct in the abstract and wrong for the runtime we ship on. These are revisit-later,
not never.

- **`unicorn/prefer-uint8array-base64`** — `Uint8Array.fromBase64`/`toBase64` is TC39 Stage 4 but
  **undefined** at our Node floor (22.18; 24.x in use). The `Buffer` forms it flags are the correct
  code today.
- **`unicorn/prefer-iterator-to-array`** — same class, plus a direct collision: this rule and
  `prefer-spread` both fire on iterator-to-array conversions, and the only form satisfying both is
  `Iterator.prototype.toArray()`, which the **browser** floor lacks. The frontend, hdf-converters
  and inspecjs all ship in the browser bundle, so spread is the correct code today.

### 3.3 Vocabulary opinions with no behavior gain

Aaron's 2026-08-13 triage. Each would have forced mass renaming of public-ish surface for zero
correctness value:

- **`unicorn/name-replacements`** — 281 hits, renaming exported symbols and Vue props.
- **`unicorn/consistent-boolean-name`** — `is`/`has` prefix enforcement across Vue props and mapper
  options.
- **`unicorn/consistent-compound-words`** — its three hits rename **exported types of a published
  package** (`FileMetaData`, `GenericPayloadWithMetaData`), which every consumer of hdf-converters
  would have to follow.

### 3.4 Style family with dangerous or valueless fixers

Dropped in the same triage — zero correctness value, and every fixer is `suggestion`-type, meaning
it rewrites the AST: `unicorn/no-for-each`, `no-useless-else` (see hazard #6), `prefer-node-protocol`,
`prefer-ternary`, `prevent-abbreviations`, `switch-case-braces`. Also `unicorn/no-null`.

`unicorn/no-process-exit` and `n/no-process-exit` are both off because their advice is actively
wrong at the entry points that trip them: throwing inside `bootstrap().catch()` produces exactly the
unhandled rejection those handlers exist to prevent.

### 3.5 Cost exceeds value on legacy surface

**`regexp/require-unicode-regexp`** and **`require-unicode-sets-regexp`** — adding `u`/`v` flags to
180 working legacy regexes (144 of them in hdf-converters mappers) is 180 *semantic* changes, each
needing per-pattern equivalence proof against golden fixtures. New code can adopt the flags freely.

### 3.6 Type-safety relaxations

`@typescript-eslint/no-explicit-any`, `no-unsafe-argument`, `no-unsafe-assignment`, `no-unsafe-call`,
`no-unsafe-member-access`, `no-unsafe-return`, `no-redundant-type-constituents`, and
`prefer-nullish-coalescing` are off. These fire pervasively on the untyped boundaries this codebase
has by design — parsed scan output, CJS namespace imports, Vuex module internals. Tightening them is
a typed-inputs project, not a lint sweep.

### 3.7 Rules reconfigured rather than disabled

- **`unicorn/filename-case: kebabCase`** — the rule's own default, what NestJS generates, and what
  the repo already is (`apps/backend/src` alone: 56 kebab-case files, zero snake_case). The previous
  `snakeCase` setting matched nothing and produced 343 errors, hidden until `|| true` came out.
  Packages with a different *measured* convention get scoped case unions rather than renames.
- **`@typescript-eslint/no-unused-vars`** with `^_` ignore patterns on args, caught errors,
  destructured arrays and vars. The underscore prefix is the ecosystem's intentionally-unused
  marker and this codebase already uses it; unmarked unused vars still flag.
- **`@typescript-eslint/consistent-type-definitions: ['error', 'type']`** globally, with per-package
  scoping where measured usage points the other way.
- `consistent-type-imports` and `consistent-type-exports` are on; `@stylistic/quotes` is single with
  `avoidEscape`.

## 4. Scoped overrides — the pattern

Framework conventions get a **scoped block with a stated reason**, never an inline disable. Notable
ones:

| Block | Scope | Why |
|---|---|---|
| `unicorn/nest-dto-parameter-names` | `apps/backend/src/**/*.ts` | NestJS documents naming a DTO parameter after its class (`createCatDto: CreateCatDto`). All 15 hits are parameters, not methods, and the rule offers no suffix or pattern exemption. |
| `promise-off-for-cypress-chainables` | `**/*.cy.ts`, `test/support/**` | Cypress `.then()` is a Chainable continuation, not a Promise — its callbacks assert and return nothing by design. |
| `unicorn/cjs-entry-points` | backend `main.ts`, test-infra, support servers | Plain CJS scripts have no top-level await; `entry().catch(...)` is the idiom that keeps a failed boot exiting non-zero. |
| `unicorn/vue-plugin-installation` | `router.ts`, `store.ts`, one component | Vue 2 installs plugins via `Vue.use()` at module scope, before the instances these modules export. The side effect is the module's purpose. |
| `unicorn/router-push-not-array-push` | router-calling files | `vue-router`'s `push` shares `Array#push`'s name; the syntactic rule cannot see receivers. Real array pushes stay linted everywhere else. |
| `unicorn/vue2-reactive-array-writes` | `apps/frontend/**` | The rule prefers the exact index write Vue 2 cannot observe. |
| `regexp/password-rules-stay-explicit` | `libs/password-complexity/**` | Those regexes ARE the STIG rules; their siblings depend on case being significant and the package ships no tests to catch a later mistake. |
| `n/frontend-bundler-resolution`, `n/lib-source-tsc-resolution` | frontend, `libs/**` | The `n` plugin resolves as Node would; these trees are resolved by the bundler and by `tsc`. |
| `security/spec-fixture-paths`, `security/maintainer-data-tooling` | specs, `hdf-converters/data/**` | Fixture paths and maintainer tooling are not user input. |

## 5. Auto-fix safety

**`yarn lint` is wired to `--fix-type layout`**, which cannot change the AST. That is the whole
mitigation: `suggestion`-type fixers rewrite code, and several have shipped real bugs. Verify any
new rule with `--fix-dry-run` before trusting its fixer.

**Known auto-fix hazards.** These numbers are cited from `eslint.config.mjs` — do not renumber them.

1. `unicorn/prefer-spread` — converts `.concat()` on a CJS namespace to spread; `_.concat([], a, b)`
   became `[..._, a, b]`, spreading the lodash namespace object. Build failure `TS2488`.
2. `e18e/prefer-spread-syntax` — same fixer, same failure.
3. `perfectionist/sort-modules` — reorders type declarations alphabetically and breaks circular type
   references (`TS2456`). TypeScript resolves cycles by declaration order.
4. `@typescript-eslint/consistent-type-definitions` — `interface` → `type` breaks circular
   references: interfaces are lazily evaluated, type aliases eagerly.
5. `@typescript-eslint/consistent-type-imports` without `inline-type-imports` — splits an import
   whose binding is used as both type and value.
6. **`unicorn/no-useless-else` — DESTROYS `continue` statements.** It rewrites
   `if (cond) { continue } else { ... }` into a form that drops the control flow entirely, which
   caused a stack overflow in inspecjs. Rule disabled globally.
7. `perfectionist/sort-decorators` — decorator order is semantic; sorting it broke every Sequelize
   model.
8. `unicorn/prefer-at` — widened a type at one call site.
9. `markdown-preferences/prefer-autolinks` — converts *relative* links (`[SECURITY.md](SECURITY.md)`)
   into angle-bracket autolinks, but those require an absolute URI with a scheme, so the output is
   not a link at all. A fixer that produces invalid markdown from valid markdown cannot be trusted.

## 6. Rule-pair collisions

When two enabled rules disagree, the resolution is **the form both accept** — or, where one rule is
wrong about this repo's runtime floor, turn that one off.

| Pair | Resolution |
|---|---|
| `prefer-spread` vs `prefer-iterator-to-array` | Browser floor lacks iterator helpers → the latter off |
| `prefer-continue` vs `no-break-in-nested-loop` | Extract the loop body to a function |
| `prefer-switch` vs `no-break-in-nested-loop` | Put the switch in a callback body — a callback is not a loop |
| `prefer-includes` vs `no-unnecessary-boolean-comparison` | Bind the optional first: `const f = x; if (f && !f.includes(y))`. A bare negated `includes` inverts the meaning, because `arr?.indexOf(x) === -1` is **false** when `arr` is undefined |
| `prefer-global-this` vs `no-unnecessary-global-this` | Both accept the bare global |
| template literal → `String()` → `no-useless-coercion` | `JSON.stringify`'s lib type lies (it is `string` but really `string \| undefined`) |
| `floating-promises` vs `return-array-push` on `router.push` | Scoped block (§4) |
| `detect-unsafe-regex` vs the `regexp` analyzers | Keep the precise analyzer (§3.1) |

`String.prototype.matchAll` is hoist-safe on a shared `/g` regex; `test`/`exec` are not.
`prefer-number-coercion` is semantics-dangerous — `Number('')` is `0` where `parseFloat` gives `NaN`.

## 7. Inline disables

An inline disable is a commit-blocking event: show the code fix, or explain why no code fix exists.
This branch added **six**, each carrying an impossibility rationale at its site:

| Site | Rule | Why no code fix exists |
|---|---|---|
| `apps/backend/config/app-config.ts:17` | `security/detect-non-literal-fs-filename` | Reads an operator-configured TLS path |
| `apps/backend/config/app-config.ts:62` | `security/detect-object-injection` | `process.env` is the platform's exotic object — no `.get()`, and a dynamically named variable requires bracket access |
| `apps/backend/src/authn/ldap.strategy.ts:83` | `unicorn/prefer-at` | `.at()` widened the type |
| `apps/backend/src/casl/casl-exception.filter.ts:10` | `promise/valid-params` | Nest's base filter signature |
| `apps/backend/src/tenable/tenable.controller.ts:25` | `@typescript-eslint/consistent-type-definitions` | Module augmentation requires `interface` |
| `apps/frontend/src/store/search.ts:66` | `security/detect-non-literal-regexp` | Pattern built from hardcoded internal data |

Pre-existing disables not added by this work (`vue/no-v-html` in the control-table components,
`ban-ts-comment` in two backend test constants) are untouched.

## 8. Prettier

Prettier **3.9.6** with `eslint-config-prettier` **10.1.8**, configured last in
`eslint.config.mjs` so formatting rules defer to it. `eslint-plugin-prettier` is deliberately not
used — Prettier's own documentation discourages running it as an ESLint rule. `.prettierrc.json`
sets `singleQuote` only. Scripts are `yarn format` and `yarn format:check`.

**The repo-wide reformat has not run yet** — roughly 576 files. It is card `heimdall2-fhtn`, and
`.git-blame-ignore-revs` is already scaffolded for that commit.

## 9. What changed in the 2026-08-14 rewrite

The previous version of this file was written 2026-06-25 against a 211-line config and had become
misleading. Corrected:

- **"~405 lint errors remain in hdf-converters"** — now zero, repo-wide.
- **"Remove `|| true` from `lint:ci`"** — already removed, and CI is now blocking.
- **"Write `engines` in lib package.json files"** — done; all workspace packages declare
  `>=22.18.0`.
- **"Fix the `@eslint/markdown` crash"** — handled, with an ignore and an upstream note in the
  config.
- **`unicorn/consistent-boolean-name` listed as ERROR / "legitimate"** — it is now **off** (§3.3).
- **`unicorn/filename-case` described as a four-case union** — it is now `kebabCase` with scoped
  unions only where a different convention was measured.
- **`perfectionist/*` rows described as disabled overrides** — the preset is not extended at all, by
  design (§2).
- **`@typescript-eslint/restrict-template-expressions` described as reconfigured** with
  `allowNumber`/`allowBoolean`/`allowNullish` — it is not configured in the file at all; it comes
  from the preset at its default.
- **`security/detect-object-injection` described as WARN** — it is an error, with narrow scoped
  exceptions for specs and maintainer data tooling.
- **Auto-fix hazard #6 was missing entirely** even though `eslint.config.mjs` cites it by number.
  Added, along with three further hazards found since (#7–#9).

## 10. Verifying a claim in this document

- Effective rules for one file — **use this, not a grep of the config**, because scoped `off` blocks
  may not apply to the file you care about:
  `npx eslint --print-config <file>`
- What a disabled rule *would* flag: `npx eslint <path> --rule '{"<rule>":"error"}'`
- Whether a fixer is safe: `npx eslint <path> --fix-dry-run`
- The gate itself: `yarn lint:ci` (must exit 0)
