# Heimdall2 Frontend Codebase Inventory (2026-03-12)

Research conducted by 7 parallel agents analyzing the heimdall2 frontend for Vue 3 migration.

## Architecture Overview

- **Framework:** Vue 2.7.16 (EOL Dec 2023)
- **UI Library:** Vuetify 2.3.9 (EOL Jan 2025)
- **State:** Vuex 3.1.2 with vuex-module-decorators 1.0.1
- **Router:** Vue Router 3.6.5
- **Build:** Webpack via Vue CLI 5.0.8
- **Language:** 100% TypeScript
- **Component Style:** Class-based with vue-class-component 7.0.2 + vue-property-decorator 9.0.0
- **Testing:** Vitest + @vue/test-utils
- **Single SPA:** 1 Vue instance, mounted on `#app`

## Component Counts

| Category | Count |
|----------|-------|
| Total `.vue` files | 96 |
| View/page components | 8 |
| Global/layout components | 20 |
| Card/data display components | 31 |
| Export/modal components | 18 |
| Upload components | 12 |
| Admin/groups components | 9 |
| Auth/login components | 4 |
| Generic/utility components | 8 |

## Routes (8 main)

| Path | Component | Auth | Notes |
|------|-----------|------|-------|
| `/` | Landing.vue | Yes | Dashboard |
| `/results` | Results.vue | Yes | Alias: `/profiles` |
| `/results/:id` | Results.vue | Yes | CSV list of IDs |
| `/compare` | Compare.vue | Yes | |
| `/compare/:id` | Compare.vue | Yes | |
| `/manage-groups` | Groups.vue | Yes | |
| `/login` | Login.vue | No | |
| `/signup` | Signup.vue | No | |
| `/admin` | Admin.vue | Yes | requiresAdmin |

## Vuex Store Modules (16)

All use `vuex-module-decorators` with `@Module`, `@Mutation`, `@Action`, `getModule`.

| Module | File | Purpose |
|--------|------|---------|
| ServerModule | server.ts | Auth, JWT, user info |
| InspecDataModule | data_store.ts | Execution/profile files |
| FilteredDataModule | data_filters.ts | LRU-cached filtering |
| EvaluationModule | evaluations.ts | Backend evaluations |
| SnackbarModule | snackbar.ts | Notifications |
| SidebarModule | sidebar_state.ts | Sidebar visibility |
| StatusCountModule | status_counts.ts | Status roll-ups |
| SeverityCountModule | severity_counts.ts | Severity roll-ups |
| InspecIntakeModule | report_intake.ts | File upload |
| AppInfoModule | app_info.ts | Version, updates |
| ColorHackModule | color_hack.ts | Color state |
| SearchModule | search.ts | Search state |
| SpinnerModule | spinner.ts | Loading indicator |
| GroupsModule | groups.ts | User groups |
| HeightsModule | heights.ts | Component heights |

## Mixins (6)

All class-based with `@Component` decorator:

| Mixin | Purpose |
|-------|---------|
| AppInfoMixin.ts | App metadata access |
| EvaluationMixin.ts | Evaluation group utilities |
| HtmlSanitizeMixin.ts | HTML sanitization |
| RouteMixin.ts | Route access helpers |
| ServerMixin.ts | Server/auth utilities |
| UserValidatorMixin.ts | Email/password validation |

## Key Dependencies

### Vue Ecosystem (must change)
- `vue` ~2.7.16
- `vuetify` ^2.3.9
- `vue-router` ~3.6.5
- `vuex` ^3.1.2
- `vue-class-component` ^7.0.2 (ABANDONED)
- `vue-property-decorator` ^9.0.0 (ABANDONED)
- `vuex-module-decorators` ^1.0.1 (ABANDONED)

### Third-Party Vue 2-only (need replacement)
- `vue-file-agent` ^1.7.3 (NO Vue 3 version)
- `vue-apexcharts` ^1.5.1 -> `vue3-apexcharts`
- `vue-cookies` ^1.7.4 (limited Vue 3 support)
- `vue-highlightjs` ^1.3.3 (NO Vue 3 version)
- `vue-prism-component` ^1.2.0 -> v2.x exists
- `vuelidate` ^0.7.5 -> `@vuelidate/core` 2.x

### Framework-Agnostic (no changes needed)
- axios, lodash, luxon, d3, apexcharts, chroma-js
- @aws-sdk/client-s3, @aws-sdk/client-sts
- sanitize-html, class-transformer, uuid, date-fns

## Vue 2 Breaking Change Patterns Found

| Pattern | Count | Files | Impact |
|---------|-------|-------|--------|
| `@Component` decorator | 414 | 102 | CRITICAL — must rewrite |
| Vuetify component uses | 786 | 71 | CRITICAL — all need API updates |
| `vuex-module-decorators` | 180 | 17 | CRITICAL — must replace |
| Activator slot (`v-on="on"`) | 54 | 23 | MODERATE — regex-replaceable |
| `.sync` modifier | 20 | 10 | LOW — mechanical rename |
| `v-data-table` | 11 | 11 | MAJOR — API redesigned |
| `this.$refs` | varies | 4 | LOW |
| `this.$set()` | 1 | 1 | TRIVIAL |
| `$scopedSlots` | 1 | 1 | LOW |
| `$children` | 1 | 1 | LOW |
| Event bus ($on/$off) | 0 | 0 | NONE |
| Filters (template pipes) | 0 | 0 | NONE |
| `.native` modifier | 0 | 0 | NONE |
| `inline-template` | 0 | 0 | NONE |
| Functional SFC template | 2 | 2 | LOW |

## Vuetify Component Usage (top 15)

| Component | Occurrences | Files | Vuetify 3 Severity |
|-----------|-------------|-------|-------------------|
| v-col | 107 | 42 | Trivial (unchanged) |
| v-text-field | 60 | 21 | Moderate (variant prop) |
| v-btn | 113 | 52 | Moderate (variant/size props) |
| v-card | 177 | 43 | Trivial (variant prop) |
| v-icon | 102 | 47 | Trivial (size prop) |
| v-row | 72 | 42 | Trivial (unchanged) |
| v-list-item | 41 | 7 | Major (sub-components removed) |
| v-divider | 40 | many | None (unchanged) |
| v-spacer | 31 | many | None (unchanged) |
| v-tooltip | 23 | 14 | Moderate (activator + location) |
| v-container | 23 | many | Trivial |
| v-dialog | 20 | 20 | Moderate (activator) |
| v-tab | 16 | 5 | Major (restructured) |
| v-tab-item | 17 | 5 | Major (removed → v-window-item) |
| v-chip | 14 | 4 | Trivial (prop renames) |

## Previous Migration Attempts

1. **`feature/vue3-migration`** (Oct 2025, 3 commits)
   - Migrated main.ts → createApp(), store.ts → createStore(), router.ts → createRouter()
   - Added @vue/compat, set MODE: 2
   - Only 3 files changed; 96 components untouched

2. **`feature/nuxt-ui-modernization`** (late 2025, 4 commits)
   - Ground-up rewrite approach with new frontend-v3/ directory
   - Vue 3 + Nuxt UI + Vite

3. **`dependabot/npm_and_yarn/vuetify-3.0.0`** — auto-PR, would break everything
