# Plan A: Incremental Migration via @vue/compat

## Strategy

Upgrade Vue 2→3 and Vuetify 2→3 simultaneously, using @vue/compat as a bridge for class components. The app stays functional throughout — no "big bang" rewrite. Class components are converted incrementally while compat mode keeps them working.

## Prerequisites

- Node.js 18+ (already met)
- `feature/vue3-migration` branch exists with main.ts/router.ts/store.ts already migrated

## Estimated LOE: 10-14 weeks focused effort (~400-560 hours)

## Phase 1: Foundation — Vue 3 + Vuetify 3 Simultaneous Upgrade (Weeks 1-2)

### 1.1 Build System Migration
- [ ] Replace `@vue/cli-service` with Vite (fixes CVE-2025-30360, CVE-2025-30359)
- [ ] Install `vite`, `@vitejs/plugin-vue`, `vite-plugin-vuetify`
- [ ] Convert `vue.config.js` → `vite.config.ts`
- [ ] Update Node polyfills (crypto, path, etc.) — use `vite-plugin-node-polyfills`
- [ ] Remove `vue-cli-plugin-vuetify`, `vuetify-loader`, `vue-svg-inline-loader`, `vue-svg-loader`

### 1.2 Install Vue 3 + @vue/compat
- [ ] Merge `feature/vue3-migration` branch work (main.ts, router.ts, store.ts)
- [ ] Update `package.json`: `vue` → `^3.5.0`, add `@vue/compat`
- [ ] Replace `vue-template-compiler` with `@vue/compiler-sfc`
- [ ] Alias `vue` to `@vue/compat` in Vite config
- [ ] Set `compatConfig: { MODE: 2 }` globally
- [ ] Verify class components boot via `GLOBAL_EXTEND`

### 1.3 Install Vuetify 3
- [ ] Upgrade `vuetify` to `^3.7.0`
- [ ] Rewrite `plugins/vuetify.ts` with `createVuetify()` API
- [ ] Migrate theme config (color objects transfer, structure changes)
- [ ] Add `import 'vuetify/styles'` to main.ts
- [ ] Migrate `src/sass/variables.scss` → Vuetify 3 variable names

### 1.4 Upgrade Vue Router + Vuex
- [ ] `vue-router` 3.6.5 → 4.x (`createRouter()`, `createWebHistory()`)
- [ ] `vuex` 3.1.2 → 4.x (`createStore()`)
- [ ] Verify `vuex-module-decorators` works with Vuex 4 under compat

**Milestone: App boots with Vue 3 compat + Vuetify 3. Probably broken UI everywhere.**

## Phase 2: Vuetify Template Migration — API-by-API (Weeks 3-6)

Do these as global passes across the entire codebase, not file-by-file:

### 2.1 Global Find-and-Replace Pass (~8 hours)
- [ ] `outlined` → `variant="outlined"` (on Vuetify input/btn/card components)
- [ ] `filled` → `variant="filled"`
- [ ] `solo` → `variant="solo"`
- [ ] `dense` → `density="compact"`
- [ ] `flat` → `variant="flat"` (on v-btn, v-card, v-app-bar)
- [ ] `depressed` → `variant="flat"`
- [ ] `item-text` → `item-title` (on v-select)
- [ ] `append-icon` → `append-inner-icon` (on text inputs)
- [ ] `background-color` → `bg-color`
- [ ] `v-simple-table` → `v-table`
- [ ] `input-value` → `model-value` (on v-checkbox)
- [ ] `close` → `closable` (on v-chip)
- [ ] `small`/`large`/`x-small`/`x-large` → `size="..."` (on v-btn, v-icon, v-chip)
- [ ] Color classes: `green--text` → `text-green`, `primary` bg → `bg-primary`

### 2.2 Activator Slot Pattern (~5 hours)
- [ ] 54 occurrences in 23 files
- [ ] `#activator="{on, attrs}"` + `v-on="on" v-bind="attrs"` → `#activator="{props}"` + `v-bind="props"`
- [ ] Regex: can semi-automate, needs per-file verification

### 2.3 .sync Modifier Removal (~2 hours)
- [ ] 20 occurrences in 10 files
- [ ] `:prop.sync="val"` → `v-model:prop="val"`

### 2.4 v-tabs Restructuring (~8 hours)
- [ ] 5 files: Admin, Compare, Login, ProfileInfo, UploadNexus, ControlRowDetails
- [ ] `v-tab-item` → `v-window-item`, `v-tabs-items` → `v-window`
- [ ] Remove `icons-and-text`, update `centered`/`right` to `align-tabs`

### 2.5 v-list Sub-Component Removal (~7 hours)
- [ ] 6 files, 44 occurrences
- [ ] Remove `v-list-item-content` (use default slot)
- [ ] Replace `v-list-item-action` → `append` slot
- [ ] Replace `v-list-item-icon` → `prepend` slot or `prepend-icon` prop

### 2.6 v-data-table Migration (~15 hours)
- [ ] 11 files — each needs manual review
- [ ] Header format: `{ text, value }` → `{ title, key }`
- [ ] Replace `header-props`, `footer-props` with slots/props
- [ ] Update slot names: `expanded-item` → `expanded-row`
- [ ] Handle `.sync` → `v-model:` for sort/page/options

### 2.7 v-form validate() Async (~3 hours)
- [ ] 10 files
- [ ] `this.$refs.form.validate()` → `await this.$refs.form.validate()`
- [ ] Handle `{valid, errors}` return object instead of boolean

### 2.8 Layout Components (~3 hours)
- [ ] Remove `app` prop from v-navigation-drawer, v-app-bar
- [ ] Remove `clipped-left`, `fixed`, `stateless`
- [ ] Restructure with `v-layout` if needed

**Milestone: All Vuetify templates updated. App renders correctly.**

## Phase 3: Third-Party Library Replacements (Week 7)

- [ ] `vue-apexcharts` → `vue3-apexcharts`
- [ ] `vuelidate` ^0.7 → `@vuelidate/core` + `@vuelidate/validators`
- [ ] `vue-cookies` → `vue-cookies` 1.8+ or `js-cookie`
- [ ] `vue-file-agent` → find Vue 3 replacement (e.g., `vue-upload-component`)
- [ ] `vue-highlightjs` → direct `highlight.js` integration
- [ ] `vue-prism-component` → v2.x or direct Prism integration
- [ ] `@vue/test-utils` v1 → v2

**Milestone: All third-party dependencies on Vue 3 compatible versions.**

## Phase 4: Class Component → Composition API (Weeks 8-12)

This is the volume work. 102 files, 414 decorator occurrences.

### Approach: API-by-API, not file-by-file

**Pass 1: Convert mixins to composables (6 mixins)**
- [ ] AppInfoMixin → useAppInfo()
- [ ] EvaluationMixin → useEvaluation()
- [ ] HtmlSanitizeMixin → useSanitize()
- [ ] RouteMixin → useRoute() (may be replaced by vue-router's built-in)
- [ ] ServerMixin → useServer()
- [ ] UserValidatorMixin → useUserValidator()

**Pass 2: Convert store modules (17 files)**
Option A — Vuex 4 (minimal change):
- [ ] Keep `vuex-module-decorators` if working, or rewrite to plain Vuex 4 modules
- [ ] `getModule()` → direct store access or `useStore()`

Option B — Pinia (recommended, cleaner):
- [ ] Each Vuex module → Pinia store
- [ ] Mutations eliminated (actions mutate directly)
- [ ] Vuex and Pinia CAN coexist during migration

**Pass 3: Convert components (96 files, can be parallelized)**
For each component:
- [ ] Remove `@Component` decorator
- [ ] `@Prop` → `defineProps()`
- [ ] `@Watch` → `watch()` in `setup()`
- [ ] `@Emit` → `defineEmits()`
- [ ] Class methods → `setup()` functions or `methods:`
- [ ] Class getters → `computed()`
- [ ] Lifecycle hooks → `onMounted()`, `onUnmounted()`, etc.
- [ ] Set `compatConfig: { MODE: 3 }` on each converted component

### Suggested order (by dependency):
1. Utility/generic components (8 files) — least dependencies
2. Card components (31 files)
3. Export/modal components (18 files)
4. Upload components (12 files)
5. Admin/groups components (9 files)
6. Auth components (4 files)
7. Global/layout components (20 files)
8. View/page components (8 files) — most dependencies, do last

**Milestone: All components on Composition API. Compat mode still active but no warnings.**

## Phase 5: Remove Compat Mode + Final QA (Weeks 13-14)

- [ ] Remove `@vue/compat` dependency
- [ ] Remove vue alias from Vite config
- [ ] Remove all `compatConfig` options
- [ ] Full test suite run (vitest)
- [ ] Visual QA on every page
- [ ] Performance comparison (before/after)
- [ ] Security audit (verify all CVEs resolved)

**Milestone: Pure Vue 3 + Vuetify 3 + Composition API. Zero compat baggage.**

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| vuex-module-decorators breaks under compat | Medium | Fall back to Pinia migration in Phase 1 |
| Vuetify 3 visual regressions | High | Budget 20-30 hours for visual QA |
| Class component conversion introduces bugs | Medium | Convert one category, test, repeat |
| Feature development blocked during migration | High | Can ship compat mode to production; migrate incrementally |
| Scope creep ("let's also add...") | High | Strict scope: Vue 3 + Vuetify 3 parity only, no new features |

## Pros

- App stays functional throughout — can ship intermediate states to production
- Class components keep working via compat while converting incrementally
- No parallel frontend to maintain
- Builds on existing `feature/vue3-migration` branch work
- All CVEs resolved

## Cons

- Vuetify 2→3 template changes must happen in one big pass (weeks 3-6)
- Compat mode adds runtime overhead during transition
- Complex build configuration during compat phase
- Must verify vuex-module-decorators works under compat (risk)
