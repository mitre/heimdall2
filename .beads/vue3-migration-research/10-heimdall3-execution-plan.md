# Heimdall 3.0 — Execution Plan (2026-03-12)

Living document. Updated as decisions are made and work progresses.

---

## Vision

**Heimdall is the security results viewer for the MITRE SAF ecosystem.** It takes security scan results from any source (InSpec, STIG, Tenable, XCCDF, SARIF, and 20+ formats), normalizes them to HDF, and provides a unified view for understanding, comparing, and acting on security posture.

At its core, Heimdall is a simple app: **upload → view → compare → export.** But it serves a demanding audience — federal, DoD, and enterprise security teams who need:
- Reliable, auditable security compliance visualization
- Enterprise authentication (LDAP, SAML, OIDC, CAC/PIV, MFA)
- Air-gapped deployment on hardened RHEL systems
- API-driven integration with CI/CD pipelines
- Group-based access control for multi-team environments

The current Heimdall 2.x codebase served this mission well but has accumulated technical debt that now blocks progress: EOL frameworks with unpatched CVEs, abandoned libraries, no database migrations, hand-rolled auth with security gaps, and triple-defined schemas.

**Heimdall 3.0 is not a feature release — it is a foundation rebuild.** The goal is to modernize the platform so that future features, security fixes, and community contributions can land cleanly on a well-architected, type-safe, properly tested codebase.

## Goals

### 1. Security First
Resolve all known CVEs (Vuetify 2 prototype pollution, XSS, @vue/cli-service vulnerabilities). Fix auth security gaps (httpOnly cookies, JWT storage, SQL injection). Add MFA, refresh tokens, account lockout. The security viewer must itself be secure.

### 2. Full-Stack Type Safety
One schema definition flows from database table → Zod validation → API DTOs → OpenAPI documentation → frontend form validation. No more triple-defining types (Sequelize model + TypeScript interface + class-validator DTO). When a field changes, it changes everywhere automatically.

### 3. Modern, Maintainable Codebase
Replace EOL and abandoned libraries with actively maintained alternatives. Vue 3 Composition API is the standard the community supports. Drizzle is SQL-first and transparent. Pinia is the official Vue state management. Every choice should be the thing the ecosystem recommends, not a custom implementation.

### 4. Proper Database Engineering
Replace `synchronize: true` with real migrations. Add FK constraints, indexes, unique constraints. Fix normalization violations. Ensure the database can be safely evolved in production without data loss or downtime.

### 5. Enterprise Auth Ready
Support the authentication methods that federal and enterprise environments require: LDAP/AD, SAML 2.0, OIDC, MFA/2FA, API keys with expiration and rotation, session management with device tracking and selective revocation.

### 6. API-First Design
Generate a complete OpenAPI 3.0 specification from the same Zod schemas that validate requests. External consumers (CI/CD pipelines, other tools) should have a documented, stable API contract.

### 7. Deployable Anywhere
Continue supporting: Docker, bare-metal RPM (RHEL/OL/Rocky 8/9), and air-gapped environments. The technology choices must not introduce deployment complexity (no Rust binaries like Prisma, no external auth services like Keycloak).

### 8. Preserve All Existing Functionality
This is a foundation rebuild, NOT a feature rewrite. Every page, every export format, every upload source, every auth method that works today must work after the migration. Users should notice improved performance and UI, not missing features.

## Non-Goals

- **No new features** during the migration (except security: MFA, refresh tokens)
- **No UI redesign** — visual parity with current Heimdall, just on modern framework
- **No backend framework change** — NestJS stays, only the layers around it change
- **No new deployment targets** — DEB/APK packaging is a separate effort (saf-packaging)

## Guiding Principles for All Agents

1. **Research before coding.** Read docs, check compatibility, verify assumptions. The cost of 5 minutes of research is zero. The cost of guessing is hours of rework.
2. **One definition, one source of truth.** If a type is defined in libs/schemas/, it is not also defined in the backend DTOs or frontend models.
3. **Follow the reference.** vitify-next is the primary reference architecture. When in doubt about how to structure something, check how vitify-next does it.
4. **Test what matters.** Write tests for behavior (does login work?), not implementation (did $emit fire?). Visual QA for UI. EXPLAIN ANALYZE for database.
5. **Port, don't rewrite.** The business logic (filtering, treemaps, CKL export) is correct and framework-agnostic. Copy it. The framework wrapping changes; the logic stays.
6. **Security is not optional.** Every auth endpoint gets rate limiting. Every cookie gets httpOnly. Every database query uses parameterized inputs. No exceptions.
7. **Ship incrementally.** The MVP (login → upload → view results) should work before Compare, Admin, or Export are ported. The backend security fixes ship as a patch before any migration.

---

## Overview

Full-stack modernization of Heimdall2 across 4 parallel tracks:
- **Track 1 (Frontend):** Vue 2 → Vue 3, Vuetify 2 → 3, Vuex → Pinia, ApexCharts → ECharts, Webpack → Vite
- **Track 2 (Backend):** Sequelize → Drizzle, class-validator → Zod, auth security hardening, OpenAPI
- **Track 3 (Database):** Full schema rebuild — 3NF normalization, migrations, FK constraints, indexes, views
- **Track 4 (Shared):** libs/schemas/ — Drizzle + Zod single source of truth
- **Track 5 (Packaging):** saf-packaging mono-repo (RPM/DEB/APK) — independent

Estimated: 480-560 hours total. With 2 developers in parallel: 12 weeks. With Claude Code assisting: subtract 1-2 weeks.

---

## Sprint 0: Critical Security Patch (Week 1)
**Ships as Heimdall 2.x patch release — no migration needed**

### `izw.4` (P0) — Fix Critical Auth Vulnerabilities
On the CURRENT codebase, no Drizzle or Vue 3 needed:
- [ ] Set `httpOnly: true` on OAuth callback cookies (`authn.controller.ts` `setSessionCookies`)
- [ ] Fix SQL injection in `evaluations.service.ts` — `searchFields` from query params interpolated into `Sequelize.literal`/`Op.iRegexp`
- [ ] Fix `API_KEY_SECRET` empty string fallback → throw error if unset
- [ ] Add JWT auth guard to Tenable proxy endpoints
- [ ] Rate limiting on LDAP login endpoint (currently only on `/authn/login`)

**Why first:** These are exploitable vulnerabilities in production. Fix before anything else.

---

## Sprint 1: Parallel Foundation (Weeks 2-3)

### Track 1: `c72.1` — Frontend Scaffold
Build the new frontend infrastructure. NO components yet — just the foundation:

- [ ] Vite 7 with 8-plugin stack:
  1. rollup-plugin-regexp (MDI SVG icons, eliminates 7MB webfont)
  2. VueRouter (file-based routing, `importMode: 'async'`)
  3. Vue (@vitejs/plugin-vue, `propsDestructure: true`)
  4. Layouts (vite-plugin-vue-meta-layouts)
  5. Vuetify (vite-plugin-vuetify, `autoImport: true`, SCSS config)
  6. Components (unplugin-vue-components)
  7. AutoImport (unplugin-auto-import — Vue, Pinia, Router, Vuetify composables, stores)
  8. Checker (vite-plugin-checker — TS errors in dev overlay)
- [ ] Vuetify 3 with MD3 blueprint, MITRE theme (dark default, status/severity semantic colors)
- [ ] Pinia 3 with persistedstate plugin
- [ ] 3 layouts: `default.vue` (sidebar+appbar), `blank.vue` (auth), `minimal.vue` (public)
- [ ] File-based routing with typed route map + auth guards
- [ ] ESLint flat config + OxLint + Stylelint + Husky pre-commit
- [ ] Vitest + Playwright test harness with `renderWithVuetify`/`mountWithVuetify` helpers
- [ ] TypeScript project references (app/node/vitest tsconfigs)

### Track 2: `izw.1` — Drizzle Setup + Simple Entities
Install Drizzle alongside Sequelize and migrate the 3 simplest tables:

- [ ] Install drizzle-orm, drizzle-kit, zod, nestjs-zod
- [ ] `drizzle-kit pull` to generate initial schema from existing PostgreSQL
- [ ] Create DrizzleModule (custom provider pattern)
- [ ] Migrate EvaluationTag, GroupUser, GroupEvaluation to Drizzle
- [ ] Both ORMs coexist — Drizzle for migrated entities, Sequelize for the rest

### Track 3: `izw.8` — Migration Framework (immediately after izw.1)
Replace `synchronize: true` with proper migrations:

- [ ] `drizzle-kit pull --init` to baseline existing schema
- [ ] Remove `synchronize: true` from database.module.ts
- [ ] `drizzle-kit generate` produces SQL migration files in `drizzle/`
- [ ] `drizzle-kit migrate` applies migrations sequentially
- [ ] Migration files committed to git
- [ ] CI validates migrations are current

---

## Sprint 2: Core Foundations (Weeks 4-5)

### Track 1: Frontend Stores + Composables
The foundation every component needs:

- [ ] Convert 16 Vuex stores to Pinia (Composition API style):
  - `server.ts` → auth, JWT, user info (most critical, 297 lines)
  - `data_store.ts` → file uploads + parsed content (172 lines)
  - `data_filters.ts` → LRU-cached filtering engine (455 lines)
  - `search.ts` → search/filter state (471 lines Vuex → ~80 lines Pinia)
  - `report_intake.ts` → file parsing, 20+ converter dispatch (412 lines)
  - `evaluations.ts` → backend evaluation CRUD (278 lines)
  - 10 simpler stores (snackbar, spinner, sidebar, heights, etc.)
- [ ] Convert 6 mixins to composables:
  - `useAppInfo()`, `useEvaluation()`, `useServer()`, `useSanitize()`, `useUserValidator()`
  - `RouteMixin` → replaced by Vue Router's `useRoute()`/`useRouter()`
- [ ] Copy 13 utility files verbatim (framework-agnostic)
- [ ] Delete `color_hack.ts` (Vuetify 3 `useTheme()` replaces DOM hacking)

### Track 2+3: Core Entity Migration + Schema Hardening
Migrate remaining entities AND fix schema issues together:

- [ ] `izw.2`: Migrate ApiKey, Group, Evaluation, User to Drizzle
- [ ] `izw.9`: Add FK constraints (Evaluation.userId, ApiKey.userId, ApiKey.groupId)
- [ ] `izw.10`: Add indexes on ALL FK columns + Users.email
- [ ] `izw.11`: Add unique constraints (GroupUsers, GroupEvaluations, EvaluationTags)
- [ ] `izw.12`: Add enum/CHECK constraints on role columns
- [ ] Replace all class-validator DTOs with nestjs-zod + Zod schemas
- [ ] Install ZodValidationPipe globally
- [ ] Remove Sequelize, sequelize-typescript, @nestjs/sequelize, class-validator, class-transformer

---

## Sprint 3: MVP Frontend + OpenAPI (Weeks 6-7)

### Track 1: Port Core Pages
All Vuetify template changes, ECharts migration, component conversion happen DURING the port — not as separate phases:

- [ ] **Login + Signup** (4 components, simplest, no shared data state)
  - LocalLogin, LDAPLogin, Login view, Signup view
  - VeeValidate 4 + @vee-validate/zod for form validation
- [ ] **Landing + Upload** (6 components)
  - Landing, UploadNexus, FileReader, SampleList, HelpFooter, LoadFileList
- [ ] **Results** (25 components — the main page)
  - Results view, ControlTable, ControlRowHeader, ControlRowDetails, ControlRowCol
  - ResponsiveRowSmall/Medium/Large/Switch
  - StatusChart, SeverityChart, ComplianceChart (ECharts — Issue #210)
  - ProfileData, ProfileInfo, EvaluationInfo
  - StatusCardRow, InfoCardRow, ColumnHeader
  - Treemap, Cell (d3, minimal Vuetify)
  - SearchBar, SearchHelpModal
- [ ] **App shell** (8 components)
  - App, Base, Topbar, Sidebar, Footer
  - Snackbar, Spinner, UpdateNotification
- [ ] Claude Code batch-converts 41 trivial components (15-30 min each)

### Track 2: OpenAPI + Schema Decisions
- [ ] `izw.3`: @nestjs/swagger + nestjs-zod `patchNestJsSwagger()`
- [ ] Auto-generate OpenAPI 3.0 from Zod DTOs
- [ ] Fix URL inconsistencies (callback delimiters, verbs in URLs, route ordering)
- [ ] Swagger UI at /api/docs
- [ ] `izw.13`: Decision on redundant Evaluation.groupId (recommend: rename to uploadGroupId or remove)
- [ ] `izw.14`: Decision on Evaluation.data JSON blob (recommend: JSONB with GIN index)

---

## Sprint 4: Complete Frontend + Auth Improvements (Weeks 8-9)

### Track 1: Port Remaining Pages
- [ ] **Compare** (10 components — second hardest after Results)
  - Compare view (614 lines), CompareRow, ProfileRow, DeltaView, ChangeItem
- [ ] **Admin + Groups** (13 components)
  - Admin, UserManagement, Statistics
  - Groups, GroupManagement, GroupModal, GroupRow, GroupUsers, Users, GroupAPIKeysModal
  - TagRow, EditEvaluationModal
- [ ] **Export modals** (8 components — tedious, self-contained)
  - ExportCKLModal (752 lines — largest single file, needs VeeValidate+Zod)
  - ExportCSVModal, ExportHTMLModal, ExportJson, ExportXCCDFResults
  - ExportASFFModal, ExportNist, ExportSplunkModal
- [ ] **Upload readers** (9 components)
  - S3: S3Reader, AuthStepBasic, AuthStepMFA, FileList
  - Tenable: TenableReader, AuthStep, FileList
  - Splunk: SplunkReader, AuthStep, FileList
  - DatabaseReader

### Track 2: better-auth Migration + Enterprise Auth
- [ ] `izw.16`: Migrate Passport.js → better-auth (with Drizzle adapter)
  - Replace 9 strategy files + 6 guard files with better-auth
  - MFA/2FA via better-auth plugin (replaces izw.5)
  - Session management via better-auth (replaces izw.6)
  - Password reset flow via better-auth plugin
  - Rate limiting + account lockout via better-auth
  - Verify LDAP works via community plugin
  - Verify OIDC external group sync works
- [ ] `izw.17`: Add SAML 2.0 support via better-auth SSO plugin
- [ ] `izw.18`: Add CAC/PIV/X.509 client certificate auth (P2)
- [ ] `izw.19`: Add Kerberos/SPNEGO for Windows integrated auth (P3)
- [ ] `izw.15`: Fix evaluation pagination hack (20x over-fetch)

---

## Sprint 5: Integration + QA (Weeks 10-11)

### Track 1: Frontend QA
- [ ] `c72.6.1`: Visual QA — every page side-by-side with Vue 2 version
- [ ] `c72.6.2`: Security audit — verify all CVEs resolved
- [ ] `c72.6.3`: Performance benchmark — Vue 3 vs Vue 2 baseline
- [ ] `c72.3.6`: Test suite migration (@vue/test-utils v2 + Playwright E2E)
- [ ] Remove @vue/compat (if used during transition)
- [ ] Remove old frontend code

### Track 4: Shared Schemas (convergence point)
- [ ] `heimdall2-oma`: Extract Drizzle table definitions to `libs/schemas/`
- [ ] Generate Zod insert/select/update schemas via drizzle-zod
- [ ] Backend DTOs import from `@heimdall/schemas`
- [ ] Frontend forms import from `@heimdall/schemas`
- [ ] Delete `libs/common/interfaces/` (replaced by Zod inferred types)
- [ ] Verify: one schema change flows automatically to both apps

### Track 2: Final Backend
- [ ] `izw.7`: API key TTL + rotation + audit trail
- [ ] Final OpenAPI spec review
- [ ] Database performance validation (EXPLAIN ANALYZE on critical queries)

---

## Sprint 6: Polish + Release (Week 12)

- [ ] Update all documentation (README, INSTALL, ENVIRONMENT_VARIABLES)
- [ ] Update Docker images
- [ ] Update saf-packaging RPM/DEB/APK builds for Heimdall 3.0
- [ ] Create release branch
- [ ] Final round of testing
- [ ] **Ship Heimdall 3.0**

---

## Database Schema Rebuild Plan

### Current State (7 tables, Sequelize, synchronize: true)

```
Users (16 columns, no FK constraints enforced by DB)
├── GroupUsers (join, no unique constraint on userId+groupId)
├── Evaluations (JSON blob for entire results, redundant groupId)
│   ├── GroupEvaluations (join, no unique constraint)
│   └── EvaluationTags (no unique constraint on evaluationId+value)
└── ApiKeys (both FKs have constraints: false)

Express Sessions (connect-pg-simple, OAuth/Tenable only)
```

### Target State (Drizzle, proper 3NF)

```
users (pgEnum for role, proper timestamps)
├── group_users (UNIQUE(group_id, user_id), FK constraints, index on both FKs)
├── evaluations (JSONB with GIN index, no redundant group_id, FK constraints)
│   ├── group_evaluations (UNIQUE(group_id, evaluation_id), FK constraints)
│   └── evaluation_tags (UNIQUE(evaluation_id, value), FK constraint)
├── api_keys (FK constraints, pgEnum for type, expires_at column)
├── sessions (NEW — refresh tokens, device info, IP tracking)
├── totp_secrets (NEW — 2FA TOTP secrets, encrypted)
└── audit_log (NEW — API key usage, login attempts, security events)

Views:
- user_groups_view: user with their groups and roles (replaces complex JOINs)
- evaluation_access_view: evaluation with accessible users/groups (for CASL)
- active_sessions_view: non-expired sessions per user

Indexes:
- All FK columns indexed
- users.email (login lookups)
- evaluations.user_id + evaluations.created_at (user's recent evaluations)
- api_keys.user_id, api_keys.group_id
- sessions.user_id + sessions.expires_at
- evaluation_tags.value (tag search)
- GIN index on evaluations.data (JSONB queryability)
```

### Schema Changes Summary

| Issue | Severity | Sprint | Resolution |
|-------|----------|--------|------------|
| synchronize: true | Critical | 1 | drizzle-kit migrations |
| No FK constraints (3) | High | 2 | Add with CASCADE/SET NULL |
| No indexes on FKs (10+) | High | 2 | Add all + EXPLAIN ANALYZE |
| No unique on joins (3) | Medium | 2 | Add after cleaning duplicates |
| Free-text roles (4) | Medium | 2 | pgEnum or CHECK constraint |
| Redundant Evaluation.groupId | Medium | 3 | Rename to upload_group_id or remove |
| Evaluation.data JSON blob | High | 3 | Convert to JSONB + GIN index |
| Pagination 20x over-fetch | Medium | 4 | Proper subquery pagination |
| New: Sessions table | Feature | 4 | For refresh tokens + device tracking |
| New: TOTP secrets table | Feature | 4 | For 2FA |
| New: Audit log table | Feature | 4 | API key usage + security events |
| New: Database views | Optimization | 5 | Simplify common JOIN patterns |

---

## Key Architectural Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Clean scaffold, not incremental compat | Compat mode proven to fail (vuex-module-decorators incompatible, all Vuetify templates must change at once) |
| 2 | vitify-next as primary reference | ECharts alignment, cleanest patterns, actively maintained, Vuetify 4 |
| 3 | Drizzle (not Prisma) | First-party Zod integration, no Rust binary (clean RPM packaging), SQL-first |
| 4 | Zod (not Valibot/Typebox) | Ecosystem support: drizzle-zod, nestjs-zod, @vee-validate/zod, VeeValidate 4 |
| 5 | Keep NestJS | Framework is solid; ORM/auth/validation layers are the problems |
| 6 | Keep CASL | better-auth's RBAC doesn't replace attribute-based access control |
| 7 | Migrate to better-auth | Sequelize blocker removed by Drizzle. Gains: MFA, sessions, SAML, 30+ OAuth, password reset as plugins |
| 8 | ECharts (not ApexCharts) | Aligns with Issue #210 plan, vitify-next reference, D3 treemap replacement |
| 9 | Pinia Composition API style | Direct state mutation, eliminates vuex-module-decorators |
| 10 | VeeValidate 4 + @vee-validate/zod | Shared Zod schemas for form validation, replaces vuelidate 0.7 |
| 11 | JSONB + GIN index for eval data | Pragmatic middle ground — queryable without full normalization |
| 12 | File-based routing | Typed route map, auto-generated types, less config |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| vuex-module-decorators → Pinia conversion introduces bugs | Medium | High | TDD: write tests before converting each store |
| Vuetify 3 visual regressions | High | Medium | Side-by-side QA, budget 20-30 hours |
| ECharts learning curve | Medium | Low | vitify-next provides working examples |
| Drizzle + Sequelize coexistence issues | Low | High | Migrate simple tables first, verify queries |
| Feature development blocked during migration | High | High | Clean scaffold: can ship MVP early |
| Shared schemas break when one side changes | Medium | Medium | CI type-checking on both apps |
| 2FA complicates login flow | Low | Medium | Make 2FA optional, not mandatory |
| Existing user passwords need migration | Low | High | bcrypt hashes work as-is with custom verify |

---

## Research Documents

| Document | Contents |
|----------|----------|
| 01-codebase-inventory.md | 96 components, 16 stores, full architecture map |
| 02-vulnerability-assessment.md | CVEs, EOL status, blocked upgrades |
| 03-vuetify-component-migration-map.md | Component-by-component Vuetify 2→3 changes |
| 04-vue3-compat-mode-analysis.md | @vue/compat capabilities and limitations |
| 05-vuetify3-dashboard-references.md | 5 template evaluations |
| 06-template-comparison-and-recommendation.md | vitify-next recommendation + cherry-picks |
| 07-backend-analysis.md | Auth system, database schema, RBAC, API routes, tokens |
| 08-migration-strategy-paths.md | 4 path analysis (compat, scaffold, strangler, codemods) |
| 09-heimdall3-strategy.md | Full-stack modernization strategy |
| 10-heimdall3-execution-plan.md | This document — sprint-by-sprint execution plan |
