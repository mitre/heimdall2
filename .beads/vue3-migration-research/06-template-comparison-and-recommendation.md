# Template Comparison & Architecture Recommendation (2026-03-12)

Research from 6 parallel agents: deep source review of vitify-next, Materio Free TS, Able Pro, logue starter, create-vuetify, plus Heimdall2 current patterns and open PRs/roadmap.

## Decision: vitify-next as Primary Reference Architecture

**With cherry-picked patterns from logue (DX tooling), Materio (dashboard cards), and create-vuetify (official baseline).**

## Why vitify-next Wins

1. **ECharts alignment** — Heimdall2 is planning to migrate from ApexCharts/D3 to Apache ECharts (Issue #210, analysis docs exist). vitify-next already uses ECharts with tree-shaken imports and Vuetify theme sync.

2. **Cleanest architecture** — Auto-imports eliminate ~500 lines of import boilerplate across 96 components. File-based routing with typed route map prevents broken links. Layout system gives clean auth vs app shell separation.

3. **Full test infrastructure** — Vitest + Playwright + `renderWithVuetify()`/`mountWithVuetify()` helpers with `@pinia/testing`. Directly reusable for Heimdall2.

4. **Actively maintained** — Updated 3 days ago, on Vuetify 4.0.1, Vite 7.3, Vue 3.5.29. Listed on official vuetifyjs/awesome.

5. **Plugin auto-registration** — `main.ts` uses `import.meta.glob('./plugins/*.ts')` to auto-load all plugins. Add a file, it's registered.

6. **MD3 blueprint** — Material Design 3 styling out of the box via Vuetify's `md3` blueprint.

7. **SVG icon optimization** — `rollup-plugin-regexp` replaces MDI icon name strings with SVG path data at build time, eliminating the 7MB `@mdi/font` webfont.

## What to Cherry-Pick from Other Templates

### From logue/vite-vuetify-ts-starter (DX Tooling)

| Pattern | Detail |
|---------|--------|
| **ESLint flat config** | `eslint.config.ts` with vue, typescript, security, vuetify, a11y, import-x plugins |
| **OxLint first-pass** | Rust-based linter runs 50-100x faster than ESLint for rules it supports. `eslint-plugin-oxlint` tells ESLint to skip those rules. |
| **Stylelint** | `postcss-html` + `stylelint-config-recommended-vue/scss` for SCSS in Vue SFCs |
| **Husky + lint-staged** | Pre-commit: OxLint → ESLint → Prettier → Stylelint |
| **Bundle analyzer** | `rollup-plugin-visualizer` with `--mode analyze` for interactive treemap |
| **pinia-plugin-persistedstate** | Per-store persistence to sessionStorage/localStorage with namespaced keys |
| **TypeScript project references** | Split: `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.vitest.json` |
| **Vite checker plugin** | `vite-plugin-checker` shows TypeScript errors in dev overlay |
| **ESLint caching** | `--cache --cache-location ./node_modules/.vite/eslint-cache` |

### From Materio Free (Dashboard Patterns — Transitional)

| Pattern | Detail |
|---------|--------|
| **ApexCharts reactive theme** | `computed(() => { const colors = vuetifyTheme.current.value.colors; return chartOptions })` — charts auto-update on theme change. Use during transition period before ECharts migration. |
| **hexToRgb utility** | Converts theme hex colors to rgba strings for chart libraries |
| **Dashboard card components** | `CardStatisticsVertical`/`Horizontal`/`WithImages` with typed props interfaces and `withDefaults` |
| **`@core`/`@layouts` abstraction** | Best architectural depth — typed nav items, ACL-ready types, enums for layout variants |
| **ApexCharts auto-import resolver** | `unplugin-vue-components` resolver for VueApexCharts global availability |
| **Responsive chart config** | ApexCharts `responsive` array with breakpoint-specific options |

### From create-vuetify Essentials (Official Baseline)

| Pattern | Detail |
|---------|--------|
| **Canonical project structure** | Official recommended directory layout |
| **eslint-config-vuetify** | Single-line ESLint config (simpler alternative to logue's explicit config) |
| **unplugin-fonts** | Font loading via `@fontsource/roboto` |

### NOT Adopting from Able Pro

Able Pro was evaluated and rejected:
- Code quality mediocre (`@ts-ignore`, `/* eslint-disable */`, no composables, no tests)
- Mixed Pinia styles (Options + Composition in same project)
- Chart configs duplicated with no shared patterns
- `href="javascript:void(0)"` (outdated)
- WCAG claim is marketing — rides on Vuetify's built-in a11y
- The 40+ widgets are copy-paste variations of the same pattern visible in the free version

## Target Architecture for Heimdall2

### Vite Plugin Stack (from vitify-next + logue)

```typescript
// vite.config.ts plugins (in order)
1. rollup-plugin-regexp      // MDI icon SVG replacement (from vitify-next)
2. VueRouter                 // File-based routing, importMode: 'async'
3. Vue                       // SFC compiler, propsDestructure: true
4. Layouts                   // vite-plugin-vue-meta-layouts
5. Vuetify                   // autoImport: true, styles.configFile
6. Components                // unplugin-vue-components (custom + Vuetify)
7. AutoImport                // Vue, Pinia, Router, Vuetify composables, stores
8. Checker                   // vite-plugin-checker for TS errors in dev (from logue)
```

### Auto-Import Configuration

```typescript
AutoImport({
  imports: [
    'vue',                    // ref, computed, watch, onMounted, etc.
    'pinia',                  // defineStore, storeToRefs
    VueRouterAutoImports,     // useRoute, useRouter, definePage
    { vuetify: ['useTheme', 'useDisplay', 'useRtl', 'useLocale', 'useLayout'] },
  ],
  dirs: ['src/stores', 'src/composables'],  // Auto-import all stores + composables
  dts: 'src/auto-imports.d.ts',
  vueTemplate: true,
})
```

### Directory Structure

```
apps/frontend/src/
  main.ts                    # Auto-loads plugins via import.meta.glob
  App.vue                    # v-app + theme sync
  assets/
    icons/                   # Custom SVG icons
    styles/
      index.css              # Global styles
      settings.scss          # Vuetify SASS overrides
  components/
    layout/                  # Shell: AppBar, AppDrawer, AppFooter, etc.
    cards/                   # Data display cards (from current)
    charts/                  # ECharts components (replacing ApexCharts + D3)
    controls/                # Control table components
    export/                  # Export modals
    upload/                  # Upload source components
    generic/                 # Reusable (dialogs, buttons, ratings)
    admin/                   # Admin/groups management
  composables/               # Extracted from mixins + new
    useAppInfo.ts
    useEvaluation.ts
    useServer.ts
    useSanitize.ts
    useUserValidator.ts
    useFilter.ts             # New: extracted from FilteredDataModule
    useNotification.ts       # From vitify-next Notify pattern
  layouts/
    default.vue              # Sidebar + AppBar + main + footer
    blank.vue                # Auth pages (no nav)
    minimal.vue              # Public pages (appbar only)
  pages/                     # File-based routing
    index.vue                # Redirect to /results or /login
    login.vue
    signup.vue
    results.vue              # Main results dashboard
    results/[id].vue         # Results with evaluation IDs
    compare.vue
    compare/[id].vue
    admin.vue
    groups.vue
    [...all].vue             # 404
  plugins/
    vuetify.ts               # createVuetify() with MD3, MITRE theme, defaults
    pinia.ts                 # createPinia() + persistedstate
    router.ts                # File-based router + layouts + auth guards
    echarts.ts               # Tree-shaken ECharts setup (from vitify-next)
    axios.ts                 # HTTP client with JWT interceptors
  stores/                    # Pinia stores (Composition API style)
    server.ts                # Auth, JWT, user info
    evaluations.ts           # Backend evaluations
    inspec-data.ts           # File uploads + parsed content
    filtered-data.ts         # LRU-cached filtering
    search.ts                # Search/filter state (Pinia: ~80 lines vs Vuex 471)
    status-counts.ts
    severity-counts.ts
    snackbar.ts
    sidebar.ts
    spinner.ts
    groups.ts
    app-info.ts
  types/
    models.ts                # Domain models (Evaluation, Control, etc.)
    routes.ts                # RouteMeta augmentation
  utilities/                 # Framework-agnostic helpers (carry over from current)
    color_util.ts            # Simplified — no more DOM hacks
    format_util.ts
    nist_util.ts
    delta_util.ts
    treemap_util.ts
    ... (others carry over unchanged)
```

### Pinia Store Pattern (Composition API Style)

```typescript
// Example: stores/search.ts — currently 471 lines of Vuex boilerplate
// Target: ~80 lines of Pinia
export const useSearchStore = defineStore('search', () => {
  const statusFilter = ref<string[]>([])
  const severityFilter = ref<string[]>([])
  const idFilter = ref<string[]>([])
  const titleFilter = ref<string[]>([])
  const nistFilter = ref<string[]>([])
  const descriptionFilter = ref<string[]>([])
  const codeFilter = ref<string[]>([])
  const tagFilter = ref<string[]>([])
  const freetext = ref('')

  function addFilter(category: string, value: string) {
    const filter = filterRef(category)
    if (!filter.value.includes(value)) filter.value.push(value)
  }

  function clearFilter(category: string) {
    filterRef(category).value = []
  }

  function clearAll() {
    statusFilter.value = []; severityFilter.value = []
    // ... etc
  }

  function filterRef(category: string) {
    // returns the correct ref based on category name
  }

  return { statusFilter, severityFilter, idFilter, titleFilter,
           nistFilter, descriptionFilter, codeFilter, tagFilter,
           freetext, addFilter, clearFilter, clearAll }
})
```

### Component Pattern

```vue
<!-- Example: components/cards/StatusChart.vue -->
<script setup lang="ts">
// No imports needed — all auto-imported
const props = defineProps<{
  filter: Filter
  value?: string[]
}>()

const emit = defineEmits<{
  'category-selected': [category: string]
}>()

const searchStore = useSearchStore()
const statusCountStore = useStatusCountStore()

const series = computed(() =>
  statusCountStore.countOf(props.filter)
)

const centerValue = computed(() =>
  series.value.reduce((a, b) => a + b, 0)
)

function onCategorySelected(category: string) {
  searchStore.addFilter('status', category)
  emit('category-selected', category)
}
</script>

<template>
  <ApexPieChart
    :series="series"
    :center-value="centerValue"
    @category-selected="onCategorySelected"
  />
</template>
```

### Test Pattern (from vitify-next)

```typescript
// test/helpers.ts
import { mount } from '@vue/test-utils'
import { render } from '@testing-library/vue'
import { createTestingPinia } from '@pinia/testing'
import { createVuetify } from 'vuetify'

const vuetify = createVuetify()

export function mountWithVuetify(component, options = {}) {
  return mount(component, {
    global: {
      plugins: [vuetify, createTestingPinia()],
      ...options.global,
    },
    ...options,
  })
}

export function renderWithVuetify(component, options = {}) {
  return render(component, {
    global: {
      plugins: [vuetify, createTestingPinia()],
      ...options.global,
    },
    ...options,
  })
}
```

### CI Pipeline (4 parallel jobs)

```yaml
jobs:
  lint:
    steps: [oxlint, eslint, stylelint, prettier --check]
  typecheck:
    steps: [vue-tsc --noEmit]
  unit-test:
    steps: [vitest run --coverage]
  e2e-test:
    steps: [playwright test --project=chromium]
```

### Theme Configuration

```typescript
// plugins/vuetify.ts
import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

export default createVuetify({
  blueprint: md3,
  icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          primary: '#005b94',        // MITRE Primary Blue
          secondary: '#00b3dc',      // MITRE Secondary Blue
          // Status colors
          statusPassed: '#4CAF50',
          statusFailed: '#FF5252',
          statusNotApplicable: '#03A9F4',
          statusNotReviewed: '#FF9800',
          statusProfileError: '#3F51B5',
          // Severity colors
          severityNone: '#03A9F4',
          severityLow: '#FFEB3B',
          severityMedium: '#FF9800',
          severityHigh: '#FF5722',
          severityCritical: '#FF1744',
        },
      },
      light: {
        colors: {
          // Same semantic colors, adjusted for light background
        },
      },
    },
  },
  defaults: {
    VDataTable: { fixedHeader: true, hover: true, density: 'comfortable' },
    VTextField: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VSelect: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VCard: { variant: 'flat', border: true },
    VBtn: { variant: 'flat' },
    VChip: { rounded: 'lg' },
  },
})
```

## Eliminated Workarounds

Patterns in current Heimdall2 that the new architecture eliminates:

| Current Workaround | Why It Exists | What Replaces It |
|--------------------|--------------|--------------------|
| `color_hack.ts` (DOM manipulation) | Vuetify 2 doesn't expose theme colors programmatically | `useTheme().current.value.colors` |
| `ColorHackModule` Vuex store | Wraps DOM color lookups in reactive store | Direct `computed()` from `useTheme()` |
| `search.ts` 471-line Vuex boilerplate | Vuex requires separate mutations/actions per operation | Pinia direct state mutation (~80 lines) |
| `getModule(Class)` singleton exports | vuex-module-decorators pattern for store access | `useStore()` composable (auto-imported) |
| `extends mixins(A, B)` | Class-component mixin composition | `useComposable()` function calls |
| `@Component({ components: {...} })` | Manual component registration per file | Auto-imported via unplugin-vue-components |
| `import { Prop, Watch } from 'vue-property-decorator'` | Decorator imports in every file | Auto-imported `defineProps`, `watch` |
| `lodash.get()` with `as unknown as` casts | Deep property access on weakly typed data | Optional chaining (`?.`) |
| `$vuetify.breakpoint.smAndDown` | Vuetify 2 breakpoint API | `useDisplay()` composable |
| `vue-template-compiler` | Vue 2 SFC compilation | `@vue/compiler-sfc` (built into Vue 3) |

## Dependency Comparison

| Category | Current (Vue 2) | Target (Vue 3) |
|----------|----------------|----------------|
| Framework | vue 2.7.16 | vue 3.5.x |
| UI | vuetify 2.3.9 | vuetify 3.7+ (or 4.x) |
| State | vuex 3.1.2 + vuex-module-decorators | pinia 3.x + persistedstate |
| Router | vue-router 3.6.5 | vue-router 4.x (file-based) |
| Build | @vue/cli-service 5.0.8 (webpack) | vite 7.x |
| Charts | apexcharts + vue-apexcharts + d3 | echarts + vue-echarts (tree-shaken) |
| Testing | vitest + @vue/test-utils v1 | vitest + @vue/test-utils v2 + playwright |
| Linting | ESLint (legacy config) + overcommit | ESLint flat + OxLint + Stylelint + Husky |
| TS | vue-class-component + vue-property-decorator | native `<script setup lang="ts">` |
| Icons | @mdi/font (7MB webfont) | @mdi/js (SVG paths, tree-shaken) |
| Validation | vuelidate 0.7 | vee-validate 4 or @vuelidate/core 2 |
| Cookies | vue-cookies | js-cookie |
| File upload | vue-file-agent | vue-upload-component or native |
