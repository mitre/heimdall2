# Heimdall2 Backend Deep Analysis (2026-03-12)

Research from 6 parallel agents: auth system, database schema, RBAC/ABAC, API routes, tokens/API keys, better-auth evaluation.

## Database Schema (7 Tables, Sequelize ORM)

### Tables
| Table | Purpose | Key Issues |
|-------|---------|-----------|
| Users | Auth + identity | 16 columns, role as freeform string |
| Evaluations | Security scan results | `data` column is massive JSON blob (1NF violation) |
| Groups | Access control | BelongsToMany Users, Evaluations |
| GroupUsers | User↔Group join | role as freeform string, no unique constraint on (groupId,userId) |
| GroupEvaluations | Group↔Evaluation join | No unique constraint on (groupId,evaluationId) |
| EvaluationTags | Free-text tags | No unique constraint on (evaluationId,value) |
| ApiKeys | API auth tokens | Both FKs have `constraints: false` |

### Critical Schema Issues
1. **No migration framework** — uses `synchronize: true` in production
2. **Evaluation.data JSON blob** — entire InSpec results as one column (1NF violation)
3. **No DB-level FK constraints** — 3 relationships use `constraints: false`, orphan risk
4. **No indexes on FK columns** — all JOINs will degrade at scale
5. **Missing unique constraints** — join tables allow duplicates
6. **Redundant Evaluation.groupId** — same relationship stored two ways
7. **Free-text role columns** — no DB enum/check constraint on User.role, GroupUser.role
8. **SQL literal interpolation** — `Sequelize.literal()` with user email and searchFields from query params

## Authentication System

### 8 Passport.js Strategies
| Strategy | Library | Auto-Create User | Notes |
|----------|---------|-----------------|-------|
| Local | passport-local | No | email field, bcrypt cost 14 |
| LDAP | passport-ldapauth | Yes | Full SSL/TLS, search filters |
| GitHub | passport-github | Yes | Requires verified email |
| GitLab | passport-gitlab2 | Yes | Custom base URL support |
| Google | passport-google-oauth | Yes | Requires verified email |
| Okta | @govtechsg/passport-openidconnect | Yes | HTTPS proxy support |
| Generic OIDC | @govtechsg/passport-openidconnect | Yes | PKCE, external group sync |
| API Key | passport-headerapikey | N/A | JWT-based, bcrypt-hashed signature |

### JWT Token System
- **Per-user JWT secrets**: `JWT_SECRET + user.jwtSecret` composite signing
- **Default expiry: 60 seconds** (!) — no refresh tokens
- **Admin/force-password sessions**: 10 minutes
- **Max expiry**: 2 days
- **Logout**: regenerates jwtSecret, invalidates ALL sessions for that user
- **No session listing, no selective revocation**

### API Keys
- JWT-signed with `API_KEY_SECRET`, no expiration
- Signature bcrypt-hashed and stored
- Scoped to User OR Group
- Can only read/create evaluations (not update/delete)
- No rotation endpoint, no TTL

## Authorization (CASL-based ABAC)

### Role System
- **Global**: admin / user (2 roles, string-based)
- **Group**: owner / member (2 roles, string-based)
- **ABAC via @casl/ability** with 16 actions

### Permission Matrix
- Admin: `can(Manage, 'all')` except own user record without password
- Users: CRUD own record, create groups, read public groups/evaluations
- Group members: read group + add/remove evaluations
- Group owners: full manage on group + all evaluations in group
- Anonymous: nothing (registration endpoint only)

### Authorization Issues
1. **Manual CASL checks in every controller** — no decorator/guard-based pattern, error-prone
2. **Admin bypass inconsistency** — raw `role !== 'admin'` string check in one place
3. **Dual SQL + CASL authorization** — evaluation listing has redundant permission logic
4. **Group API keys bypass CASL** — `instanceof Group` sidestep
5. **No role validation on GroupUser.role** — accepts any string

## API Surface (42 endpoints, 9 controllers)

### Zero OpenAPI/Swagger infrastructure
- `@nestjs/swagger` not installed
- No Swagger decorators anywhere
- No OpenAPI spec file
- DTOs are well-typed with class-validator (16 input DTOs, 7 response DTOs)
- 25 TypeScript interfaces in libs/common/

### URL Inconsistencies
- `/github/callback` vs `/okta_callback` (mixed delimiters)
- `/users/user-find-all` (non-RESTful)
- `/groups/:id/updateGroupUserRole` (verb in URL)
- `/api/tenable` prefix (everything else has no prefix)
- Route ordering bug: `/evaluations/e2e` after `/:id`

### OpenAPI Effort: 8-12 hours with nestjs-zod + @nestjs/swagger

## Security Vulnerabilities

### Critical
1. OAuth cookies NOT httpOnly — XSS can steal JWTs
2. JWT stored in localStorage — XSS token theft
3. API keys never expire — no TTL/rotation
4. No MFA/2FA
5. No password reset flow
6. SQL injection via Sequelize.literal() with searchFields from query params

### High
7. Rate limiting only on /authn/login — LDAP, registration, API keys unprotected
8. No failed login tracking / account lockout
9. Default JWT expiry 60s with no refresh tokens
10. API_KEY_SECRET falls back to empty string

### Medium
11. Tenable proxy has no auth guard
12. No session listing / selective revocation
13. Group API keys bypass CASL
14. No CSRF protection on OAuth cookies
15. No audit trail for API key usage

## better-auth Evaluation

### Hard Blockers
1. **No Sequelize adapter** — only Prisma/Drizzle/Kysely
2. **Weak LDAP** — community plugin only, no SSL/TLS/filter config
3. **No per-user JWT secret equivalent** — fundamentally different session model

### Recommendation
DECISION: Migrate to better-auth. Sequelize blocker removed by Drizzle migration. LDAP via community plugin (enhance as needed for Heimdall's SSL/TLS/filter config). Gains: MFA, session management, password reset, SAML, 30+ OAuth providers, rate limiting, account lockout — all as plugins instead of hand-rolled code.

## Drizzle + Zod Stack Decision

### Full-Stack Type Safety
```
Drizzle pgTable → drizzle-zod → Zod schemas → nestjs-zod DTOs → @nestjs/swagger OpenAPI
                                      ↓
                              VeeValidate 4 + @vee-validate/zod → Vuetify 3 forms
```

One definition, four uses: database schema, API validation, TypeScript types, frontend form validation.

### Migration Path (Sequelize → Drizzle)
1. `drizzle-kit pull` — introspect existing DB, generate initial schema
2. Both ORMs coexist during transition
3. Migrate entity by entity (EvaluationTag → GroupUser → ... → User)
4. Remove Sequelize when all entities migrated
5. Extract shared schemas to libs/schemas/

### Key Packages
- drizzle-orm + drizzle-kit (ORM + migrations)
- zod (validation, shared frontend+backend)
- nestjs-zod (NestJS integration, replaces class-validator)
- @vee-validate/zod (Vue 3 form validation)
- VeeValidate 4 (Vuetify 3 form integration)
