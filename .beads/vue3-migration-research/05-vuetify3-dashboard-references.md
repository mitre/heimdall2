# Vuetify 3 Dashboard Reference Templates (2026-03-12)

Evaluated as reference architectures for Heimdall2's Vue 3 migration. Goal: learn patterns for Vue 3 + Vuetify 3 + Pinia + Composition API + Vite + TypeScript dashboard apps.

## Target Stack
- Vue 3 with `<script setup>` Composition API
- Vuetify 3 (3.7.x or 4.x)
- Pinia for state management
- Vite as build tool
- TypeScript (strict)
- Vue Router 4+
- ApexCharts for charting

---

## 1. vitify-next — PRIMARY REFERENCE (architecture + patterns)

**GitHub:** https://github.com/kingyue737/vitify-next
**License:** MIT | **Stars:** ~130 | **Last updated:** 2026-03-09
**Listed on:** Official vuetifyjs/awesome curated list
**Author:** Yue JIN (Kong Inc.)

| Criterion | Status |
|-----------|--------|
| Vue 3 + `<script setup>` | Yes |
| Vuetify 4.0.1 (upgraded from 3.x) | Yes |
| TypeScript (strict) | Yes |
| Pinia 3.x | Yes |
| Vite 7.x | Yes |
| Vue Router 5.x | Yes |
| Data tables | Yes |
| Charts | ECharts (via vue-echarts) |
| Dark mode | Yes |
| Unit tests | Vitest + Testing Library |
| E2E tests | Playwright |
| File-based routing | Yes |
| Layout system | Yes (vite-plugin-vue-meta-layouts) |
| Auto-imports | Yes (unplugin-auto-import, unplugin-vue-components) |

**Strengths:** Cleanest code quality. Strict TypeScript. Demonstrates file-based routing, layout system, Pinia stores, testing setup. Actively maintained. Lightweight — intentionally minimal to show patterns, not bloat.

**Variants:** vitify-nuxt (Nuxt 4), vitify-electron, vitify-admin (Vue 2 version)

**Use for:** Project structure, TypeScript patterns, Pinia stores, Vite config, layout system, testing setup.

---

## 2. Materio Free — REFERENCE (ApexCharts + dashboard layout)

**GitHub:** https://github.com/themeselection/materio-vuetify-vuejs-admin-template-free
**License:** MIT | **Stars:** ~820 | **Last updated:** 2025-01-01
**Vendor:** ThemeSelection

| Criterion | Status |
|-----------|--------|
| Vue 3 + Composition API | Yes (TypeScript version uses `<script setup>`) |
| Vuetify 3.7.5 | Yes |
| TypeScript | Yes (separate typescript-version/ directory) |
| Pinia 2.x | Yes |
| Vite 5.x | Yes |
| Vue Router 4.x | Yes |
| Data tables | Yes |
| Charts | **ApexCharts** (vue3-apexcharts) — matches Heimdall2 target |
| Dark mode | Yes |
| Login/auth pages | Yes (basic) |
| User management | Premium only |
| Iconify | Yes |

**Strengths:** Uses ApexCharts (same as Heimdall2). Dashboard layout with sidebar, cards, charts. TypeScript version available.

**Weaknesses:** Last commit Jan 2025 (14 months stale). Free version is limited (marketing funnel for premium). ESLint 8, Vite 5 (outdated).

**Use for:** ApexCharts + Vuetify 3 integration patterns, dashboard card layouts.

---

## 3. Able Pro — REFERENCE (feature-rich commercial template)

**Store:** https://store.vuetifyjs.com/products/able-pro-vuetify-3-vuejs-admin-dashboard-template
**License:** Commercial ($69 personal / $129 commercial / $399 unlimited)
**Vendor:** CodedThemes (12+ years dashboard dev)
**Listed on:** Official Vuetify Store

| Criterion | Status |
|-----------|--------|
| Vue 3 | Yes |
| Vuetify 3 | Yes |
| TypeScript | Not confirmed |
| Pinia | Not confirmed |
| Vite | Not confirmed (mentions Gulp) |
| Charts | **ApexCharts** (20+ chart types) |
| Dark mode | Yes (Light/Dark/Auto + 10 primary colors) |
| Widgets | 40+ statistical/chart/table widgets |
| Form elements | Extensive (validation, masks, date pickers, rich text editors) |
| Auth pages | Yes |
| WCAG compliance | Yes |
| Live customizer | Yes |
| Layouts | Multiple (vertical nav, container/full-width, blur header) |

**Strengths:** Most feature-rich. 40+ widgets, 20+ chart types with ApexCharts. WCAG compliance. Live theme customizer. Multiple layout options. Well-documented.

**Weaknesses:** Commercial license required. Build tooling unclear (Gulp mentioned — may not use Vite). TypeScript/Pinia status unconfirmed. Need to verify actual code quality vs marketing claims.

**Use for:** UI/UX patterns, widget designs, layout options. Worth purchasing if code quality is good after review.

---

## 4. logue/vite-vuetify-ts-starter — REFERENCE (DX + tooling)

**GitHub:** https://github.com/logue/vite-vuetify-ts-starter
**License:** MIT | **Stars:** ~300+ | **Last updated:** 2026-03-06

| Criterion | Status |
|-----------|--------|
| Vue 3 + Composition API | Yes |
| Vuetify 4.0.1 | Yes |
| TypeScript | Yes |
| Pinia 3.x | Yes |
| Vite 7.x | Yes |
| Vue Router 5.x | Yes |
| ESLint flat config | Yes (ESLint 10) |
| Stylelint | Yes (17) |
| OxLint | Yes |
| Husky pre-commit | Yes |
| Bundle analyzer | Yes |
| Unit tests | Vitest |
| E2E tests | Playwright |

**Strengths:** Best build tooling/DX setup. ESLint flat config, Stylelint, OxLint, Husky hooks, bundle analyzer, pinia-plugin-persistedstate. Already on Vuetify 4 and Vite 7.

**Weaknesses:** Blank canvas — no dashboard UI, no charts, no data tables.

**Use for:** Build tooling configuration, linting setup, DX infrastructure.

---

## 5. Official create-vuetify — REFERENCE (canonical starting point)

**GitHub:** https://github.com/vuetifyjs/create
**Usage:** `npm create vuetify@latest`
**License:** MIT | **Last updated:** 2026-02-27

Presets: Base, Default, **Essentials** (Vue Router + Pinia + Layouts + auto-import), Nuxt

**Use for:** Understanding official recommended project structure. Run with TypeScript + Essentials preset.

---

## 6. Lux UI — LOWER PRIORITY (stale but feature-rich)

**GitHub:** https://github.com/yangjiakai/lux-ui
**License:** MIT | **Stars:** ~1,700 | **Last updated:** 2024-08-25 (18 months stale)

Has both ApexCharts AND ECharts, data tables, i18n, drag-and-drop, virtual scrolling. Highest star count. But stale (Vuetify 3.6, Vite 5), loose TypeScript, uses Tailwind alongside Vuetify.

**Use for:** Complex page composition examples only. Do not follow its patterns.

---

## NOT RECOMMENDED

- **Creative Tim Vuetify Material Dashboard** — Still Vue 2 + Vuetify 2. Never migrated.
- **Sneat Free** (ThemeSelection) — Duplicate of Materio Free, same company.
- **vue-material-admin** (armomu) — Focused on 3D viz (Three.js/Babylon.js), not admin dashboards.

---

## Evaluation Plan

Review the code of each candidate vs Heimdall2's current architecture to determine best fit:

| What to Compare | Heimdall2 Current | Reference Templates |
|-----------------|-------------------|-------------------|
| Component structure | 96 class-based SFCs in components/ | `<script setup>` Composition API |
| State management | 16 Vuex modules with decorators | Pinia stores |
| Routing | Vue Router 3 with guards | Vue Router 4+ (file-based?) |
| Build system | Webpack via @vue/cli | Vite |
| Charts | vue-apexcharts (Vue 2) | vue3-apexcharts or vue-echarts |
| Data tables | Vuetify 2 v-data-table | Vuetify 3 v-data-table (redesigned API) |
| Layout | Manual (Topbar + Sidebar + Content) | Layout system plugin or manual |
| Testing | Vitest + @vue/test-utils v1 | Vitest + @vue/test-utils v2 + Playwright |
| TypeScript | Class-style with decorators | Strict with defineProps/defineEmits |
