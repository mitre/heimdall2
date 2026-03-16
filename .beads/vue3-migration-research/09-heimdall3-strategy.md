# Heimdall 3.0 — Full-Stack Modernization Strategy (2026-03-12)

## Vision

Modernize Heimdall2 from a Vue 2 + Sequelize app with security vulnerabilities into a modern, type-safe, well-tested platform with shared schemas, proper database migrations, and enterprise auth support.

## Architecture: Current → Target

| Layer | Current | Target |
|-------|---------|--------|
| Frontend framework | Vue 2.7.16 (EOL) | Vue 3.5+ |
| UI library | Vuetify 2.3.9 (EOL, 2 CVEs) | Vuetify 3.7+ |
| State management | Vuex 3 + vuex-module-decorators | Pinia 3 (Composition API) |
| Component style | Class decorators (abandoned libs) | `<script setup lang="ts">` |
| Charts | ApexCharts + D3 | Apache ECharts (Issue #210) |
| Build | Webpack (@vue/cli, 2 CVEs) | Vite 7 (8-plugin stack) |
| Linting | ESLint legacy + overcommit | ESLint flat + OxLint + Stylelint + Husky |
| Testing | Vitest + @vue/test-utils v1 | Vitest + @vue/test-utils v2 + Playwright |
| ORM | Sequelize (synchronize: true) | Drizzle (drizzle-kit migrations) |
| Validation | class-validator (backend) + vuelidate 0.7 (frontend) | Zod (shared via drizzle-zod) |
| Schema sharing | 25 manual interfaces in libs/common/ | drizzle-zod auto-generated in libs/schemas/ |
| API docs | None | OpenAPI 3.0 via nestjs-zod + @nestjs/swagger |
| Form validation | vuelidate 0.7 (EOL) | VeeValidate 4 + @vee-validate/zod |
| Auth framework | 8 hand-rolled Passport.js strategies | better-auth (MFA, sessions, SAML, 30+ OAuth, Drizzle adapter) |
| HTTP framework | NestJS 11 (keep) | NestJS 11 (keep) |
| Database | PostgreSQL (keep) | PostgreSQL (keep) |
| ABAC | CASL @casl/ability (keep) | CASL @casl/ability (keep) |

## Full-Stack Type Safety Flow

```
Drizzle pgTable definition
        ↓
   drizzle-zod
        ↓
   Zod schemas (libs/schemas/)
      ↙          ↘
nestjs-zod DTOs    VeeValidate 4
(@nestjs/swagger)  (@vee-validate/zod)
      ↓                  ↓
OpenAPI 3.0 spec   Vuetify 3 forms
```

One definition → database types + API validation + TypeScript types + frontend form validation + OpenAPI docs.

## Work Tracks (Parallel)

### Track 1: Frontend — Clean Scaffold (7-8 weeks)

Reference architecture: vitify-next + cherry-picks from logue (DX), Materio (cards)

**Approach:** New frontend scaffold with Vite + Vue 3 + Vuetify 3 + Pinia + ECharts. Port pages in priority order using Claude Code for batch conversion. NOT incremental compat mode (proven to fail for this codebase).

**Phase 1.1: Scaffold + Infrastructure** (~1 week)
- Vite 7 with 8-plugin stack (Router, Vue, Layouts, Vuetify, Components, AutoImport, Checker, icon regexp)
- Vuetify 3 with MD3 blueprint, SVG icons, MITRE theme
- Pinia with persistedstate plugin
- File-based routing with typed route map
- 3 layouts: default (sidebar), blank (auth), minimal (public)
- ESLint flat + OxLint + Stylelint + Husky
- Vitest + Playwright test infrastructure
- TypeScript project references (app/node/vitest)

**Phase 1.2: Stores + Composables** (~1 week)
- Convert 16 Vuex stores to Pinia (Composition API style)
- Convert 6 mixins to composables
- Copy 13 utility files verbatim
- search.ts: 471 lines Vuex → ~80 lines Pinia
- color_hack.ts: deleted (Vuetify 3 useTheme() replaces it)

**Phase 1.3: Core Pages** (~2 weeks)
- Port Results (most used), Landing, Login/Signup
- ControlTable (450 lines), charts (ECharts), treemap
- Upload system (FileReader, S3, Tenable, Splunk)
- Claude Code batch-converts trivial components (41 files, 15-30 min each)

**Phase 1.4: Remaining Pages** (~1 week)
- Compare, Admin, Groups
- Export modals (CKL, CSV, HTML, JSON, XCCDF, ASFF, Splunk)
- Database reader

**Phase 1.5: QA + Cleanup** (~1 week)
- Visual QA every page side-by-side
- Test suite migration
- Performance benchmark
- Remove old frontend code

### Track 2: Backend — Drizzle + Zod + Security (4-6 weeks)

**Phase 2.1: Drizzle Setup + Initial Migration** (~1 week)
- `drizzle-kit pull` to generate schema from existing DB
- DrizzleModule alongside existing Sequelize
- Migrate simplest entities first: EvaluationTag, GroupUser, GroupEvaluation
- Add FK constraints, indexes, unique constraints during migration

**Phase 2.2: Core Entity Migration** (~2 weeks)
- Migrate: ApiKey, Group, Evaluation, User (dependency order)
- Replace class-validator DTOs with nestjs-zod + Zod schemas
- Install ZodValidationPipe globally
- Remove Sequelize when all entities migrated

**Phase 2.3: OpenAPI Generation** (~1 week)
- Install @nestjs/swagger
- `patchNestJsSwagger()` from nestjs-zod
- Add @ApiTags, @ApiBearerAuth to controllers
- Auto-generate OpenAPI 3.0 spec from Zod DTOs
- Fix URL inconsistencies (callback delimiters, verbs in URLs, route ordering)

**Phase 2.4: Auth Security Fixes** (~2 weeks)
- Set httpOnly on OAuth cookies
- Move JWT from localStorage to httpOnly cookie
- Add refresh token rotation
- Add 2FA via otplib (TOTP) + backup codes
- Rate limiting on all auth endpoints (not just /authn/login)
- Failed login tracking + account lockout
- API key expiration + rotation endpoint
- Fix Tenable proxy auth gap
- Fix SQL injection in Sequelize.literal()

### Track 3: Shared Schemas (after Tracks 1+2 converge, ~1 week)

- Extract Drizzle table definitions to libs/schemas/
- Generate Zod schemas via drizzle-zod
- Frontend forms use shared Zod schemas via VeeValidate 4 + @vee-validate/zod
- Remove libs/common/interfaces/ (replaced by Zod inferred types)
- Single source of truth: table definition → validation → types → forms → OpenAPI

### Track 4: SAF Packaging (independent, ongoing)

Continues in mitre/saf-packaging repo:
- Heimdall RPM already done (Go CLI, SELinux, systemd)
- Add DEB/APK via nFPM
- COPR for hosted RPM repo
- Profile packaging (101 InSpec baselines)
- Air-gap bundles
- Vulcan and saf-cli packaging

## Dependency Graph

```
Track 1 (Frontend)          Track 2 (Backend)
  ↓                           ↓
Phase 1.1 (scaffold)    Phase 2.1 (Drizzle setup)
  ↓                           ↓
Phase 1.2 (stores)      Phase 2.2 (entity migration)
  ↓                           ↓
Phase 1.3 (core pages)  Phase 2.3 (OpenAPI)
  ↓                           ↓
Phase 1.4 (rest)        Phase 2.4 (auth security)
  ↓                           ↓
Phase 1.5 (QA)               ↓
       ↘                    ↙
        Track 3 (shared schemas)
              ↓
         libs/schemas/
              ↓
        Heimdall 3.0 Release
```

Tracks 1 and 2 are INDEPENDENT until Track 3. The backend REST API doesn't change during the frontend migration. The frontend doesn't care about the ORM swap.

Track 4 (packaging) is fully independent — it consumes releases, doesn't affect development.

## Effort Estimates

| Track | Estimate | Can Parallelize |
|-------|----------|----------------|
| Track 1: Frontend | 280-300 hours (7-8 weeks × 1 dev) | Yes, with Track 2 |
| Track 2: Backend | 160-200 hours (4-6 weeks × 1 dev) | Yes, with Track 1 |
| Track 3: Shared Schemas | 40-60 hours (1 week × 1 dev) | After 1+2 |
| Track 4: Packaging | Ongoing (separate repo) | Fully independent |
| **Total** | **480-560 hours** | **With 2 devs: 8-10 weeks** |

## Security Issues Resolved

| Issue | Severity | Resolved By |
|-------|----------|-------------|
| Vuetify 2 CVE-2025-8083 (CVSS 8.6) | Critical | Track 1: Vuetify 3 |
| Vuetify 2 CVE-2025-8082 (XSS) | Critical | Track 1: Vuetify 3 |
| @vue/cli-service CVEs | High | Track 1: Vite |
| OAuth cookies not httpOnly | Critical | Track 2: Phase 2.4 |
| JWT in localStorage | Critical | Track 2: Phase 2.4 |
| API keys never expire | Critical | Track 2: Phase 2.4 |
| No MFA/2FA | Critical | Track 2: Phase 2.4 |
| No password reset | High | Track 2: Phase 2.4 |
| SQL injection (Sequelize.literal) | High | Track 2: Phase 2.2 (Drizzle) |
| No DB FK constraints | High | Track 2: Phase 2.1 |
| No DB indexes on FKs | High | Track 2: Phase 2.1 |
| synchronize: true in production | Critical | Track 2: Phase 2.1 (drizzle-kit) |
| Rate limiting only on login | High | Track 2: Phase 2.4 |
| No account lockout | High | Track 2: Phase 2.4 |
| Tenable proxy no auth | Medium | Track 2: Phase 2.4 |

## Key Architectural Decisions

1. **Clean scaffold, not incremental compat** — compat mode proven to fail for this codebase
2. **vitify-next as primary reference** — ECharts alignment, cleanest patterns, actively maintained
3. **Drizzle + Zod** for full-stack type safety — one definition flows database to form
4. **Keep NestJS** — framework is solid, ORM/auth layers are the problems
5. **Keep CASL** — better-auth's RBAC doesn't replace attribute-based access control
6. **Migrate to better-auth** — Sequelize blocker removed by Drizzle migration. LDAP via community plugin (enhance as needed). Gains: MFA, sessions, password reset, SAML, 30+ OAuth providers as plugins.
7. **ECharts** (not ApexCharts) — aligns with Issue #210 plan, vitify-next reference
8. **Pinia Composition API style** — direct state mutation, eliminates vuex-module-decorators
9. **VeeValidate 4 + @vee-validate/zod** — shared Zod schemas for form validation
10. **File-based routing** — typed route map, auto-generated types
