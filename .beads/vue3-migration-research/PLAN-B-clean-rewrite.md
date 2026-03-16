# Plan B: Clean Frontend Rewrite

## Strategy

Create a new `frontend-v3/` directory with Vue 3 + Vuetify 3 + Vite + Composition API from scratch. Port components page-by-page, rewriting as you go. Run old and new frontends in parallel during transition. Switch over when feature parity is reached.

This builds on the existing `feature/nuxt-ui-modernization` branch concept but uses Vuetify 3 instead of Nuxt UI (less rewrite of template markup).

## Prerequisites

- Node.js 18+
- Backend API stays identical (NestJS REST API doesn't change)

## Estimated LOE: 12-16 weeks focused effort (~480-640 hours)

## Phase 1: Scaffold + Core Infrastructure (Weeks 1-2)

### 1.1 Project Setup
- [ ] Create `apps/frontend-v3/` using `npm create vue@latest` (Vite + Vue 3 + TypeScript)
- [ ] Install Vuetify 3: `vuetify@^3.7`, `vite-plugin-vuetify`
- [ ] Install Pinia (replaces Vuex entirely)
- [ ] Install Vue Router 4
- [ ] Configure Vite with same Node polyfills as current app
- [ ] Set up TypeScript strict mode
- [ ] Copy `public/` assets (favicons, static files)

### 1.2 Theme + Design System
- [ ] Port `plugins/vuetify.ts` theme to Vuetify 3 `createVuetify()` format
- [ ] Port color utilities (`color_util.ts`, `gen_variants()`, `gen_visibilities()`)
- [ ] Port SASS variable overrides (new Vuetify 3 variable names)
- [ ] Verify MITRE branding colors render correctly

### 1.3 Pinia Stores (from Vuex modules)
- [ ] ServerStore (from server.ts) — auth, JWT, user info
- [ ] InspecDataStore (from data_store.ts) — file uploads
- [ ] FilteredDataStore (from data_filters.ts) — LRU-cached filtering
- [ ] EvaluationStore (from evaluations.ts) — backend evaluations
- [ ] SnackbarStore (from snackbar.ts) — notifications
- [ ] All remaining stores: sidebar, status_counts, severity_counts, report_intake, app_info, color_hack, search, spinner, groups, heights

### 1.4 Router
- [ ] Port 8 routes from `router.ts`
- [ ] Port route guards (auth check, admin role, URL sync)
- [ ] Use Vue Router 4 `createRouter()` + `createWebHistory()`

### 1.5 Composables (from mixins)
- [ ] `useAppInfo()` from AppInfoMixin
- [ ] `useEvaluation()` from EvaluationMixin
- [ ] `useSanitize()` from HtmlSanitizeMixin
- [ ] `useServer()` from ServerMixin
- [ ] `useUserValidator()` from UserValidatorMixin

### 1.6 Utilities (copy directly)
- [ ] Copy all `utilities/*.ts` — these are framework-agnostic
- [ ] Copy `types/models.ts`, `enums/Trinary.ts`

**Milestone: App scaffolded, stores ported, router works, theme renders.**

## Phase 2: Global Layout Components (Weeks 3-4)

### 2.1 App Shell
- [ ] `App.vue` — root layout with v-app, v-layout
- [ ] `Base.vue` — shared page layout (topbar + sidebar + content + footer)
- [ ] `Topbar.vue` — app bar with search, user menu, upload button
- [ ] `Sidebar.vue` — navigation drawer with file list
- [ ] `Footer.vue` — classification banner

### 2.2 Global UI Components
- [ ] `Snackbar.vue` — notification toasts
- [ ] `Spinner.vue` — loading overlay
- [ ] `SearchBar.vue` + `SearchHelpModal.vue`
- [ ] `Modal.vue`, `HelpModal.vue`, `AboutModal.vue`
- [ ] `UpdateNotification.vue`
- [ ] `TopbarDropdown.vue`, `UserModal.vue`
- [ ] `PrintButton.vue`, `RefreshButton.vue`

### 2.3 Auth Pages
- [ ] `Login.vue` — login page with provider buttons
- [ ] `LocalLogin.vue` — email/password form
- [ ] `LDAPLogin.vue` — LDAP auth form
- [ ] `Signup.vue` — registration form
- [ ] `RegistrationModal.vue`

**Milestone: Can log in, see app shell, navigate between pages.**

## Phase 3: Data Display Components (Weeks 5-7)

### 3.1 Upload System
- [ ] `UploadNexus.vue` — upload dialog with tabs
- [ ] `FileReader.vue` — local file upload
- [ ] `LoadFileList.vue` — database evaluation list
- [ ] `SampleList.vue` — sample data
- [ ] `HelpFooter.vue`
- [ ] AWS: `S3Reader.vue`, `AuthStepBasic.vue`, `AuthStepMFA.vue`, `FileList.vue`
- [ ] Tenable: `TenableReader.vue`, `AuthStep.vue`, `FileList.vue`
- [ ] Splunk: `SplunkReader.vue`, `AuthStep.vue`, `FileList.vue`

### 3.2 Results Page Components
- [ ] `Results.vue` — main results view
- [ ] `ProfileData.vue`, `ProfileInfo.vue`
- [ ] `EvaluationInfo.vue`
- [ ] `StatusChart.vue`, `SeverityChart.vue`, `ComplianceChart.vue`
- [ ] `StatusCardRow.vue`, `InfoCardRow.vue`
- [ ] `ColumnHeader.vue`

### 3.3 Control Table
- [ ] `ControlTable.vue` — uses v-data-table (Vuetify 3 API)
- [ ] `ControlRowHeader.vue`, `ControlRowDetails.vue`, `ControlRowCol.vue`
- [ ] `ResponsiveRowSmall.vue`, `ResponsiveRowMedium.vue`, `ResponsiveRowLarge.vue`, `ResponsiveRowSwitch.vue`

### 3.4 Treemap
- [ ] `Treemap.vue` — NIST treemap visualization (d3-based)
- [ ] `Cell.vue`

**Milestone: Can upload files, view results, interact with control table and treemap.**

## Phase 4: Comparison, Export, Admin (Weeks 8-10)

### 4.1 Comparison
- [ ] `Compare.vue` — comparison view
- [ ] `CompareRow.vue`, `ProfileRow.vue`
- [ ] `DeltaView.vue`, `ChangeItem.vue`

### 4.2 Export Modals
- [ ] `ExportCaat.vue`, `ExportNist.vue`
- [ ] `ExportCKLModal.vue`, `ExportASFFModal.vue`
- [ ] `ExportCSVModal.vue`, `ExportHTMLModal.vue`
- [ ] `ExportJson.vue`, `ExportXCCDFResults.vue`
- [ ] `ExportSplunkModal.vue`

### 4.3 Admin
- [ ] `Admin.vue` — admin dashboard
- [ ] `UserManagement.vue` — user CRUD with v-data-table
- [ ] `Statistics.vue`

### 4.4 Groups
- [ ] `Groups.vue` — groups page
- [ ] `GroupManagement.vue`, `GroupModal.vue`
- [ ] `GroupRow.vue`, `GroupUsers.vue`, `Users.vue`
- [ ] `GroupAPIKeysModal.vue`

### 4.5 Tags
- [ ] `TagRow.vue`
- [ ] `EditEvaluationModal.vue`

**Milestone: Full feature parity with Vue 2 frontend.**

## Phase 5: Testing + Cutover (Weeks 11-14)

### 5.1 Test Migration
- [ ] Port test setup to Vitest + @vue/test-utils v2
- [ ] Port existing tests (rewrite mounting calls for Vue 3)
- [ ] Add integration tests for critical paths:
  - Login → upload file → view results → export
  - Compare multiple evaluations
  - Admin user management
  - Group management

### 5.2 Visual QA
- [ ] Side-by-side comparison: old vs new on every page
- [ ] Responsive testing: mobile, tablet, desktop
- [ ] Dark theme verification
- [ ] Accessibility check (keyboard nav, screen reader)

### 5.3 Build Integration
- [ ] Update root `package.json` scripts
- [ ] Update `lerna.json` / workspace config
- [ ] Update backend to serve `frontend-v3/` dist
- [ ] Update Docker build to use new frontend

### 5.4 Cutover
- [ ] Rename `apps/frontend/` → `apps/frontend-v2/` (archive)
- [ ] Rename `apps/frontend-v3/` → `apps/frontend/`
- [ ] Update all workspace references
- [ ] Remove v2 dependencies from root

### 5.5 Cleanup
- [ ] Remove `apps/frontend-v2/` after confidence period
- [ ] Close migration branches: `feature/vue3-migration`, `feature/nuxt-ui-modernization`
- [ ] Security audit: verify all CVEs resolved

**Milestone: Production cutover to Vue 3 frontend.**

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Feature parity takes longer than expected | High | Port most-used pages first (Results, Landing) |
| Subtle behavior differences from rewrite | High | Side-by-side visual QA on every page |
| Feature development on old frontend during migration | High | Freeze features or port changes to both |
| Utility code assumptions about Vue 2 internals | Low | Utilities are mostly framework-agnostic |
| inspecjs integration issues with new build | Low | Library is framework-agnostic |
| Team context switching between old and new | Medium | Dedicate team to migration, don't mix |

## Pros

- Clean codebase — no compat baggage, no decorator cruft
- Can modernize architecture decisions (Pinia > Vuex, Composition API > class components)
- Opportunity to improve component structure, reduce complexity
- No risk of vuex-module-decorators breaking under compat
- Can use `<script setup>` everywhere (better TypeScript inference)
- Vite from day one (faster dev server, HMR)

## Cons

- **Feature parity takes longer** — must rewrite 96 components
- **Two frontends to maintain** during transition (bug fixes go to both)
- **No intermediate production deployment** — it's either old or new
- **More total LOE** than incremental approach
- **Risk of "second system effect"** — temptation to over-engineer
- The existing `feature/nuxt-ui-modernization` branch chose a different UI framework (Nuxt UI) — this plan uses Vuetify 3 instead for less template rewrite

## When to Choose Plan B Over Plan A

- If vuex-module-decorators breaks badly under compat mode
- If the team wants to modernize architecture (Pinia, script setup, Vite) in one shot
- If the class component → Composition API rewrite under compat proves brittle
- If you have budget for 12-16 weeks of focused frontend work
- If you want a "clean break" with no transitional baggage

## Component Porting Priority (by user impact)

1. **Login/Signup** — gate to everything
2. **Landing** — first thing users see
3. **Results + Control Table** — core functionality (most used)
4. **Upload system** — critical for getting data in
5. **Compare** — frequently used feature
6. **Export modals** — important for output
7. **Admin + Groups** — admin-only, lower priority
8. **Tags** — lowest priority
