# Vue 3 @vue/compat Analysis (2026-03-12)

## How @vue/compat Works

- Ships as `@vue/compat`, a build of Vue 3 that emulates Vue 2 behavior
- Alias `vue` to `@vue/compat` in build config
- Defaults to `MODE: 2` (Vue 2 behavior)
- Emits deprecation warnings for every Vue 2 feature used
- Features can be toggled individually per feature ID
- Per-component `compatConfig: { MODE: 3 }` for incremental migration

## What Compat Mode Handles Automatically

These work in compat mode with runtime warnings:

- `Vue.extend`, `Vue.prototype`, `Vue.set`, `Vue.delete`, `Vue.observable`
- `$on`, `$off`, `$once` (event emitter API)
- `$children`, `$listeners`, `$scopedSlots`
- Options API: `data` as object, `beforeDestroy`/`destroyed` hooks
- `v-bind.sync`, keycode modifiers, filters, `v-on.native`
- Functional components, async components (old syntax)
- Render functions (old `h` signature)
- Class components via `GLOBAL_EXTEND` flag (vue-class-component uses Vue.extend internally)

## What Compat Mode CANNOT Handle

### Hard incompatibilities (must fix BEFORE enabling compat mode):

1. **Vuetify 2** — relies on Vue 2 internal VNode APIs. CANNOT work with compat.
2. **GLOBAL_MOUNT_CONTAINER** — `new Vue().$mount('#app')` replaced container; `createApp().mount()` renders inside it
3. **COMPILER_V_IF_V_FOR_PRECEDENCE** — `v-if` now takes precedence over `v-for` on same element
4. **COMPILER_SFC_FUNCTIONAL** — `<template functional>` not supported
5. **COMPILER_V_IF_SAME_KEY** — same `key` on `v-if`/`v-else` branches
6. **CONFIG_DEVTOOLS** — different API

### Libraries that depend on Vue 2 internals:
- Vuetify 2 (VNode private properties)
- ElementUI
- Quasar v1

## What Works Under Compat (Temporarily)

### Class Components
`vue-class-component` works via `GLOBAL_EXTEND` compat flag since it uses `Vue.extend()` internally. The decorators (`@Prop`, `@Watch`, `@Emit`, `@Component`) function under compat mode. This is a transitional crutch — must eventually rewrite.

### vuex-module-decorators
Vuex 3 works under compat via `GLOBAL_EXTEND`. The `getModule()` pattern may work initially but is fragile. Mixed community reports.

## Official 12-Step Migration Path

### Phase 1: Preparation (while still on Vue 2.7)
1. Update deprecated slot syntax to Vue 2.6+ standard
2. Remove filters (use computed/methods)
3. Remove event bus (`$on`/`$off`) — use Mitt or provide/inject
4. Audit third-party packages for Vue 3 compatibility

### Phase 2: Install Migration Build
5. Upgrade tooling: `vue-loader` ^16 or Vite
6. Install `vue` ^3.1.0, `@vue/compat`, replace `vue-template-compiler` with `@vue/compiler-sfc`
7. Alias `vue` to `@vue/compat` in build config, set `MODE: 2`
8. Fix compile-time errors

### Phase 3: Fix Warnings
9. Upgrade vue-router to v4
10. Upgrade vuex to v4
11. Fix warnings per-component using `compatConfig`
12. Switch components to `MODE: 3` one at a time

### Phase 4: Finalize
13. Remove `@vue/compat` alias
14. Run on pure Vue 3

## Performance Implications

Official docs: "small performance/size overhead" but "should not noticeably affect production UX." Adds runtime checks for every deprecated feature. Not recommended as permanent runtime — intended as temporary bridge.

## Critical Limitation for Heimdall2

**The compat mode cannot bridge Vuetify 2.** This means you cannot:
1. Install @vue/compat first and gradually fix things
2. Keep Vuetify 2 running while migrating other parts

Instead, the Vuetify 2→3 migration must happen simultaneously with Vue 3. The practical migration order is:

1. Vuetify 3 + Vue 3 (with @vue/compat for own components)
2. Class components continue working via compat's GLOBAL_EXTEND
3. Incrementally rewrite class components to Composition API
4. Remove compat mode

## Real-World LOE Data

| Source | App Size | LOE | Notes |
|--------|----------|-----|-------|
| 365Talents | 300 components | Multi-month | UI lib migration took 1 week alone |
| Reddit (Vuetify+Vuex) | Large | ~2 weeks | Dedicated team |
| Kilian article | Medium | "Nearly painless" | No class components, simpler app |
| Pixelmatters | Production app | Weeks | Parallel branch strategy |
| Epicmax (consultancy) | Enterprise | 4-9 months | Phased rollouts |

## Heimdall2 Factors That Increase LOE

1. Class components in 100% of files (vs typical ~0%)
2. vuex-module-decorators in 100% of stores
3. Vuetify deeply embedded (786 usages in 71/96 files)
4. Must migrate Vuetify simultaneously with Vue 3 (no gradual path)

## Heimdall2 Factors That Decrease LOE

1. No event bus, no filters, no .native — several migration tasks eliminated
2. `.sync` modifier is minimal (20 occurrences)
3. Single SPA (not multiple Vue instances)
4. Good TypeScript coverage helps catch errors
5. Previous migration branch has entry point work done
