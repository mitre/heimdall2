# Heimdall2 Frontend Library Migration Plan

> Migrate from 4 embedded libraries to @mitre/hdf-libs v3.2.0 + app domain types,
> using a composable normalization layer for incremental adoption, better-auth
> alignment, and future Pinia migration.

**Date:** 2026-06-06
**Status:** Draft — pending review

---

## 1. Problem Statement

Heimdall2's frontend embeds 4 libraries whose types leak directly into 61 Vue
components, stores, mixins, and utilities with no abstraction boundary:

| Embedded Lib | Frontend files | What it provides |
|-------------|---------------|-----------------|
| `inspecjs` v2.13.0 | 25 files | HDF parsing, types, contextualization, NIST utilities |
| `@mitre/hdf-converters` v2.13.0 | 14 files | 33 forward + 5 reverse converters, utilities |
| `@heimdall/common` | 23 files | Shared entity interfaces (IUser, IGroup, IEvaluation, IApiKey) |
| `@heimdall/password-complexity` | 0 frontend, 3 backend | Password validation (STIG rules) |

**Additionally:** `hdf-converters` internally imports from `inspecjs` in 50 source files —
the two libs are coupled.

**The backend is already clean** — zero imports from any embedded lib (Drizzle + Zod + better-auth
migration completed in sessions 1-4). This migration is **100% frontend + embedded libs**.

### Why this is a problem

1. **No abstraction boundary** — library-specific types (`ContextualizedControl`, `IEvaluation`,
   `ExecJSON`) leak into components. Swapping any library touches 60+ files.

2. **Two vocabularies in conflict** — inspecjs uses InSpec terminology (Control, Profile, Execution).
   hdf-libs v3 uses HDF terminology (Requirement, Baseline, Results). The frontend speaks InSpec
   but the future is HDF.

3. **@heimdall/common is stale** — the backend now returns Drizzle-shaped responses with better-auth
   session data, but the frontend still consumes old Sequelize-era interfaces (IUser with
   `encryptedPassword`, IGroup with Sequelize associations). These types are lies — they don't
   match what the API actually returns.

4. **hdf-converters uses Node.js-only APIs** — `crypto.createHash`, `sanitize-html`, `winston`.
   We already had to rip these out for the Vite migration. hdf-libs v3 converters use
   `@mitre/hdf-utilities` which provides browser-safe equivalents.

---

## 2. What We're Migrating TO

### hdf-libs v3 Package Ecosystem (10 packages, all @3.2.0)

| Package | Replaces | Purpose |
|---------|----------|---------|
| `@mitre/hdf-schema` | inspecjs generated types | 7 JSON schemas + TS/Go type generation. Types: `HDFResults`, `EvaluatedBaseline`, `EvaluatedRequirement`, `RequirementResult`, `ResultStatus`, `Severity` |
| `@mitre/hdf-parsers` | inspecjs `contextualizeEvaluation`, `convertFile` | Parse and validate HDF documents |
| `@mitre/hdf-converters` | `@mitre/hdf-converters` v2.13.0 | 45 converters (superset of old 33). Function-based API: `convertNessusToHdf(xml)` |
| `@mitre/hdf-mappings` | inspecjs `parse_nist`, `NistControl`, CCI data | CCI↔NIST, OWASP→NIST, CWE→NIST, Nessus→NIST, ScoutSuite→NIST mappings |
| `@mitre/hdf-validators` | (none — new) | Schema validation for HDF documents |
| `@mitre/hdf-utilities` | `crypto.createHash`, `sanitize-html` | `sha256()`, `parseXml()`, `stripHtml()`, `severityToImpact()`, `impactToSeverity()` |
| `@mitre/hdf-diff` | (none — new) | Structural diff engine for assessment comparison |
| `@mitre/hdf-extension-graph` | inspecjs overlay handling | InSpec overlay/extension chain resolution |
| `@mitre/hdf-generators` | (none — new) | Generate InSpec profiles from baselines |
| `@mitre/hdf-cli` | (Go CLI) | Go CLI wrapping all packages |

### What DOESN'T exist in v3

| Missing from v3 | Used by heimdall2 | Resolution |
|-----------------|-------------------|------------|
| ASFF → HDF **forward** converter | `ASFFResults` (import ASFF findings) | Carry forward in-app — no `asff-to-hdf` in v3 |
| HDF → HTML reverse converter | `FromHDFToHTMLMapper` (export modal) | Carry forward in-app or upstream PR |
| HDF → Splunk reverse converter | `FromHDFToSplunkMapper` (export modal) | Carry forward in-app or upstream PR |
| HDF → CAAT reverse converter | `FromHDFToCAATMapper` (export modal) | Carry forward in-app or upstream PR |
| HDF → ASFF reverse converter | `FromHdfToAsffMapper` (export modal) | Carry forward in-app or upstream PR |
| `formatCompliance()` utility | 3 chart components | Carry forward as app utility |
| `FileMetaData` type | report_intake store | Define in app domain types |
| `SplunkConfig` / `SplunkConfigNoIndex` | Splunk import/export | Define in app domain types |
| `checkSplunkCredentials()` | Splunk auth step | Carry forward or rewrite |
| `ContextualizedControl/Evaluation/Profile` | 25 files | **Replaced by composables + `@mitre/hdf-extension-graph`** (overlay graph with `extendsFrom`/`extendedBy` already exists in v3) |
| `@heimdall/common` interfaces | 22 files | **Replaced by app domain types** aligned with Drizzle/better-auth |

---

## 3. Vocabulary Mapping

### HDF Data Types: InSpec v1 → HDF v3

| InSpec / inspecjs v1 | HDF v3 | Notes |
|---------------------|--------|-------|
| `ExecJSON.Execution` | `HDFResults` | Top-level assessment document |
| `ExecJSON.Profile` | `EvaluatedBaseline` | A baseline that has been assessed |
| `ExecJSON.Control` | `EvaluatedRequirement` | A requirement with findings |
| `ExecJSON.ControlResult` | `RequirementResult` | A single test outcome |
| `ControlResultStatus` (enum) | `ResultStatus` (enum) | `passed`, `failed`, `error`, `notApplicable`, `notReviewed` |
| `Severity` (enum) | `Severity` (enum) | `critical`, `high`, `medium`, `low`, `informational` |
| `ControlDescription` | `Description` | `{label, data}` pairs |
| `SourceLocation` | `SourceLocation` | `{ref, line}` |
| `ContextualizedControl` | **composable** | `useRequirement()` with computed status/severity |
| `ContextualizedEvaluation` | **composable** | `useAssessment()` with parsed baselines |
| `ContextualizedProfile` | **composable** | Part of `useAssessment()` |
| `HDFControl` | **composable** | Wrapper logic moves into composable |
| `HDFControlSegment` | **composable** | Segment logic moves into composable |
| `ControlStatus` | `ResultStatus` | Same concept, different name |
| `ControlGroupStatus` | computed | Derived from individual statuses |
| `NistControl` / `parse_nist` | `@mitre/hdf-mappings` | `getCCINistMappings()`, `getNISTDescription()` |
| `convertImpactToSeverity()` | `impactToSeverity()` | From `@mitre/hdf-schema/helpers` or `@mitre/hdf-utilities` |
| `severities` array | derivable | From `Severity` type |
| `is_control` type guard | schema type guards | |
| `contextualizeEvaluation()` | `parseResults()` | From `@mitre/hdf-parsers` |
| `convertFile()` | `fingerprint()` + converter | From `@mitre/hdf-converters` |

### App Entity Types: @heimdall/common → Drizzle/better-auth aligned

| Old Interface | What it represents | New Source of Truth |
|--------------|-------------------|-------------------|
| `IUser` | User profile | Drizzle `SelectUser` / better-auth `ba_user` |
| `ISlimUser` | User list item | Drizzle select subset |
| `IGroup` | Group with members | Drizzle `SelectGroup` with relations |
| `IEvaluation` | Evaluation metadata | Drizzle `SelectEvaluation` |
| `IEvaluationTag` | Tag on evaluation | Drizzle `SelectEvaluationTag` |
| `IApiKey` | API key | better-auth API key type |
| `IStatistics` | System counts | `StatisticsDTO` from backend |
| `ICreateUser`, `IUpdateUser`, etc. | Mutation DTOs | Zod schemas via nestjs-zod |
| `IStartupSettings` | App config | `StartupSettingsDto` |
| `IEvaluationGroup` | Group-eval association | Drizzle join table type |

These should be defined as the frontend's OWN types that match what the API actually returns —
not duplicated from the backend's Drizzle types, but aligned with them.

### Converter API: v1 Class → v3 Function

| v1 Pattern | v3 Pattern |
|-----------|-----------|
| `new NessusResults(xml).toHdf()` | `convertNessusToHdf(xml)` |
| `new ASFFResults(json).toHdf()` | (not yet in v3) |
| `fingerprint(data)` → `INPUT_TYPES` | Converter-level `fingerprint()` functions |

---

## 4. Architecture: Composables as the Normalization Surface

```
Current (coupled — 61 files directly import library types):

  Raw JSON → inspecjs types ──────→ Vuex stores → Vue components
                                        ↑
  API responses → @heimdall/common ─────┘
                                        ↑
  File uploads → hdf-converters ────────┘


Target (decoupled — components only see domain types):

  Raw JSON → @mitre/hdf-libs v3 ─→ composables ──→ Pinia stores → Vue components
                                     ↑                  ↑
  API responses → (direct fetch) ────┘                   │
                                     ↑                   │
  File uploads → @mitre/hdf-converters v3 ───────────────┘

  The composable layer defines TWO type families:
  1. HDF domain types (Requirement, Assessment, Baseline) — for scan data
  2. App entity types (User, Group, Evaluation) — for API data, aligned with better-auth
```

### Why composables, not a library or adapter

- Composables are Vue 2.7 compatible (ref, computed, watch all work)
- They're the natural stepping stone to Pinia (Pinia stores ARE composables)
- They can be adopted one component at a time (incremental, not big-bang)
- They're independently testable with Vitest
- They align with the already-planned Composition API migration (epic 9uk)

---

## 5. Domain Type Definitions

### HDF Data Types (for scan results)

```typescript
// apps/frontend/src/types/hdf.ts

/** Result status — the 5 possible outcomes */
export type ResultStatus = 'passed' | 'failed' | 'error' | 'notApplicable' | 'notReviewed';

/** Severity level — aligned with HDF v3 */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

/** A single test outcome within a requirement */
export interface Result {
  status: ResultStatus;
  codeDesc: string;
  message?: string;
  startTime: string;
  runTime?: number;
  resource?: string;
  resourceId?: string;
}

/** A labeled description (check text, fix text, rationale) */
export interface Description {
  label: string;
  data: string;
}

/** A security requirement with its assessment results */
export interface Requirement {
  id: string;
  title: string | null;
  impact: number;
  severity: Severity;
  status: ResultStatus;
  extendedStatus: ExtendedResultStatus;  // includes 'waived' for filter engine
  waived: boolean;                       // explicit waiver flag
  descriptions: Description[];
  tags: Record<string, unknown>;
  nistTags: NistTag[];                   // parsed objects, not raw strings
  findingDetails: string | null;         // for freeform search (contains_term)
  code: string | null;
  results: Result[];
  sourceLocation: { ref: string; line: number } | null;
  extendedBy: Requirement[];   // overlay children (empty = base requirement)
  extendsFrom: Requirement[];  // overlay parents (empty = not an overlay)
}

/** A baseline that has been evaluated */
export interface EvaluatedBaseline {
  name: string;
  title?: string;
  version?: string;
  requirements: Requirement[];
  summary?: string;
}

/** A complete assessment — the top-level HDF document */
export interface Assessment {
  id: string;
  filename: string;
  baselines: EvaluatedBaseline[];
  timestamp?: string;
  statistics?: Record<string, unknown>;
  tool?: { name: string; version?: string };
}

/** An unevaluated baseline (profile-only file, no results yet) */
export interface Baseline {
  name: string;
  title?: string;
  version?: string;
  requirements: BaselineRequirement[];
  summary?: string;
}

/** A requirement in an unevaluated baseline — no results, just the definition */
export interface BaselineRequirement {
  id: string;
  title: string | null;
  impact: number;
  severity: Severity;
  descriptions: Description[];
  tags: Record<string, unknown>;
  nistTags: NistTag[];
  code: string | null;
}

/** Extended status including waived state — used by the filtering engine */
export type ExtendedResultStatus = ResultStatus | 'waived';

/** Parsed NIST tag with hierarchical containment support */
export interface NistTag {
  raw: string;           // e.g. "AC-2 (1)"
  family: string;        // e.g. "AC"
  controlNumber: string; // e.g. "2"
  enhancement?: string;  // e.g. "1"
  contains(other: NistTag): boolean;
}
```

**Note on `NistTag`:** The treemap utility requires hierarchical NIST containment checks
(`NistControl.contains()` in inspecjs). A flat `string[]` is insufficient — the domain
type must preserve the parsed structure with a `contains()` method. The composable
`useNistMapping()` constructs `NistTag` objects from raw tag strings.

**Note on `Baseline` vs `Assessment`:** report_intake.ts handles two file types:
evaluation files (results with findings) and profile-only files (baselines without
results). Both must be represented in the domain types.

### App Entity Types (for API data — aligned with Drizzle + better-auth)

```typescript
// apps/frontend/src/types/entities.ts

/** User — matches what the API actually returns (Drizzle + better-auth) */
export interface User {
  id: string;        // better-auth UUID (not Sequelize bigint)
  email: string;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  organization: string | null;
  role: string;
  creationMethod: string | null;
  lastLogin: string | null;
  loginCount: number;
  forcePasswordChange: boolean | null;
  createdAt: string;
  updatedAt: string;
}

/** Slim user for list views */
export interface SlimUser {
  id: string;
  email: string;
  title: string | null;
  firstName: string | null;
  lastName: string | null;
}

/** Group — matches Drizzle SelectGroup with relations */
export interface Group {
  id: number;
  name: string;
  public: boolean;
  createdAt: string;
  updatedAt: string;
  users?: GroupMembership[];
}

/** Group membership */
export interface GroupMembership {
  userId: string;
  groupId: number;
  role: 'owner' | 'member';
  user?: SlimUser;
}

/** Evaluation metadata — what the API returns (not the HDF data itself) */
export interface EvaluationMeta {
  id: number;
  filename: string;
  public: boolean;
  userId?: string;
  groupId?: number;
  tags: EvaluationTag[];
  createdAt: string;
  updatedAt: string;
  // NOTE: 'data' field (the actual HDF JSON) is excluded from list responses
  //       and loaded separately via findById
}

/** Evaluation tag */
export interface EvaluationTag {
  id: number;
  value: string;
  evaluationId: number;
}

/** API key — aligned with better-auth @better-auth/api-key */
export interface ApiKey {
  id: string;
  name: string;
  type: string;
  userId?: string;
  groupId?: string;
  createdAt: string;
  updatedAt: string;
}

/** System statistics */
export interface Statistics {
  apiKeyCount: number;
  userCount: number;
  evaluationCount: number;
  evaluationTagCount: number;
  groupCount: number;
}
```

---

## 6. Composable API Design

```typescript
// HDF data composables — wrap hdf-libs v3 internally

// Core parsing — handles both evaluation files AND profile-only files
// IMPORTANT: raw data is deep-cloned before wrapping in reactive refs
// to break the frozen circular from_file reference from inspecjs/report_intake.
// Vue reactivity cannot wrap Object.freeze'd circular structures.
useAssessment(rawJson: string | object): {
  assessment: Ref<Assessment>,
  baselines: ComputedRef<EvaluatedBaseline[]>,
  allRequirements: ComputedRef<Requirement[]>,  // flattened from all baselines
}
useBaseline(rawJson: string | object): {
  baseline: Ref<Baseline>,
  requirements: ComputedRef<BaselineRequirement[]>,
}

// Requirement-level composables
useRequirement(req: Requirement): { status: ComputedRef<ResultStatus>, severity: ComputedRef<Severity> }
useNistMapping(requirement: Requirement): ComputedRef<NistTag[]>

// Aggregation composables
useStatusCounts(requirements: Ref<Requirement[]>): ComputedRef<Record<ExtendedResultStatus, number>>
useSeverityCounts(requirements: Ref<Requirement[]>): ComputedRef<Record<Severity, number>>

// Filtering — NOT a single flat composable. Mirrors data_filters.ts architecture:
// accepts a filter spec, returns a memoized filtered slice. One composable per concern.
useFilteredRequirements(
  allRequirements: Ref<Requirement[]>,
  filter: Ref<FilterSpec>
): ComputedRef<Requirement[]>

// Filter spec type — mirrors the 10+ filter dimensions in data_filters.ts
interface FilterSpec {
  statuses?: ExtendedResultStatus[];
  severities?: Severity[];
  searchTerm?: string;
  nistFamily?: string;
  // ... additional dimensions as needed
}

// App entity composables — typed API calls
useCurrentUser(): { user: Ref<User | null>, logout: () => Promise<void> }
useEvaluations(): { evaluations: Ref<EvaluationMeta[]>, load: () => Promise<void>, ... }
useGroups(): { groups: Ref<Group[]>, ... }
```

**Key design decisions in the composable API:**

1. **`allRequirements` flattens the traversal** — components don't navigate
   `assessment.baselines[].requirements[]` manually. The composable does the traversal
   and exposes a flat list. This replaces the `evaluation.contains[].contains[]` pattern.

2. **`useFilteredRequirements` is parameterized** — it accepts a `FilterSpec` ref and
   returns a memoized computed. This mirrors `data_filters.ts`'s parameterized getter
   pattern, not a single flat filter. The LRU cache can be replicated via `computed()`
   with a stable filter-spec hash.

3. **Raw data is deep-cloned before reactive wrapping** — breaks the frozen circular
   `from_file` reference that `Object.freeze` + inspecjs creates. Vue's `ref()`/`reactive()`
   will throw on frozen circular objects.

4. **`useBaseline` is separate from `useAssessment`** — profile-only files have no
   results, different type shape. report_intake.ts needs both paths.

---

## 6b. Composition API Best Practices

Components migrated during Phases 2 and 3 convert from class-based (vue-class-component +
vue-property-decorator) to Composition API simultaneously. This is not two separate passes —
the type migration and the API migration happen in the same edit, per component.

### Component Pattern (Vue 2.7)

```typescript
// BEFORE: class-based with library types leaking in
@Component
export default class StatusChart extends Vue {
  @Prop() readonly filter!: ContextualizedControl[];  // ← inspecjs type
  get counts() { return countStatuses(this.filter); }   // ← inspecjs function
}

// AFTER: Composition API with domain types via composables
import { defineComponent, computed, toRefs } from 'vue';
import type { Requirement } from '@/types/hdf';
import { useStatusCounts } from '@/composables/useStatusCounts';

export default defineComponent({
  props: {
    requirements: { type: Array as () => Requirement[], required: true }
  },
  setup(props) {
    const { requirements } = toRefs(props);
    const counts = useStatusCounts(requirements);
    return { counts };
  }
});
```

### Rules

1. **`defineComponent()` + `setup()`** — not `<script setup>` (Vue 2.7 supports both but
   `defineComponent` is more explicit and debuggable)
2. **Props typed with domain types** — `Requirement[]`, not `ContextualizedControl[]`
3. **Composables for all shared logic** — no business logic in setup(), only wiring
4. **`toRefs(props)`** for reactive prop destructuring
5. **`computed()` for derived state** — replaces class getters
6. **`watch()` for side effects** — replaces `@Watch` decorator
7. **No `this` keyword** — Composition API doesn't use `this`
8. **Template stays the same** — only `<script>` block changes

### Composable Rules

1. **One concern per composable** — `useStatusCounts`, not `useEverything`
2. **Accept `Ref` or raw values** — use `toRef()`/`unref()` for flexibility
3. **Return plain objects** — `{ counts, loading, error }`, not classes
4. **Independently testable** — can test without mounting a component
5. **No Vuex/Pinia imports** — composables are store-agnostic (stores USE composables, not vice versa)
6. **Types from types/ only** — never from inspecjs, hdf-libs, or @heimdall/common

### Store Pattern (Pinia, Phase 7)

```typescript
// BEFORE: vuex-module-decorators
@Module({dynamic: true, store: Store, name: 'statusCounts'})
class StatusCounts extends VuexModule {
  @Mutation setCounts(counts: Record<string, number>) { ... }
  @Action async load() { ... }
}

// AFTER: Pinia setup store — thin wrapper around composables
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Requirement } from '@/types/hdf';
import { useStatusCounts } from '@/composables/useStatusCounts';

export const useStatusStore = defineStore('status', () => {
  const requirements = ref<Requirement[]>([]);
  const counts = useStatusCounts(requirements);
  function setRequirements(reqs: Requirement[]) { requirements.value = reqs; }
  return { requirements, counts, setRequirements };
});
```

Stores are THIN — business logic lives in composables. The store only holds reactive
state and coordinates between composables. This keeps everything DRY and testable.

---

## 7. Migration Phases

### Phase 1: Domain types + reference composable
- Create `types/hdf.ts` and `types/entities.ts`
- Create `useAssessment()` — wraps inspecjs internally
- Create `useRequirement()` — computes status/severity
- Write tests
- **Zero behavior change**

### Phase 2: Migrate components to HDF composables (7 child cards)
- `hl1.2.1` — Count stores (status_counts, severity_counts, color_hack) — sp:2
- `hl1.2.2` — Filter stores (data_filters + search) — typed FilterDimension — sp:5
- `hl1.2.3` — Report intake store — composable-backed parsing — sp:5
- `hl1.2.4` — Utilities (treemap, delta, format, helper) — depends on hl1.8 — sp:3
- `hl1.2.5` — Control table components (ControlTable, ControlRow*) — sp:3
- `hl1.2.6` — Chart + info components (StatusChart, SeverityChart, ProfileData, EvaluationInfo) — sp:2
- `hl1.2.7` — Views + comparison + export (Results, Compare, CompareRow, exports) — sp:3

### Phase 3: Replace @heimdall/common with app entity types (3 child cards)
- `hl1.3.1` — Group components (GroupModal, GroupManagement, etc.) — 6 files — sp:3
- `hl1.3.2` — User/admin components (UserModal, UserManagement, Statistics, TopbarDropdown) — 4 files — sp:2
- `hl1.3.3` — Evaluation components + stores + views — 13 files — sp:5

### Phase 4: Swap composable internals to hdf-libs v3
- Install `@mitre/hdf-schema`, `@mitre/hdf-parsers`, `@mitre/hdf-mappings`, `@mitre/hdf-utilities`
- Rewrite composable internals
- **Zero changes above the composable layer**

### Phase 5: Swap converters to @mitre/hdf-converters v3
- Replace class-based converters with function-based v3 calls
- Carry forward 4 missing reverse converters
- Update `report_intake` store

### Phase 6: Delete old embedded libs
- Remove `libs/inspecjs/`, `libs/hdf-converters/`, `libs/common/`
- `libs/password-complexity/` stays (backend-only, independent)
- Update workspace config

### Phase 7: Vuex → Pinia (3 child cards)
- `hl1.7.1` — Simple stores (sidebar, heights, spinner, snackbar, app_info) — sp:3
- `hl1.7.2` — Medium stores (status_counts, severity_counts, color_hack, groups, store) — sp:3
- `hl1.7.3` — Complex stores (data_store, evaluations, server, data_filters, search, report_intake) — sp:8

---

## 8. Relationship to Existing Epics

This plan unifies work that was previously planned across separate epics. Some epics
are absorbed, some are extended, some remain independent.

### Absorbed into this plan

| Existing Epic | Disposition |
|--------------|-------------|
| `oma` — Shared Schemas (libs/schemas/) | **Absorbed by Phase 1 + 3.** The `libs/schemas/` package becomes the domain type definitions. `@heimdall/common` interfaces replaced by app entity types aligned with Drizzle + better-auth. |
| `3ys` — Frontend composable library | **Absorbed by Phase 1 + 2.** HDF composables (useAssessment, useRequirement) join the utility composables (useLoading, useApi, etc.) already planned in 3ys. The domain type composables ARE the normalization boundary. |
| `9uk` — Composition API migration | **Absorbed by Phase 2 + 3.** Component migration from class-based to Composition API now also includes swapping from library types to composable domain types. Two birds, one migration pass. |

### Extended by this plan (new work not previously carded)

| New Phase | What's new |
|-----------|-----------|
| Phase 4 — Swap to hdf-libs v3 | Rewrite composable internals from inspecjs to @mitre/hdf-* packages |
| Phase 5 — Swap converters to v3 | Replace class-based v1 converters with function-based v3 converters |
| Phase 6 — Delete old libs | Remove libs/inspecjs, libs/hdf-converters, libs/common |
| Phase 7 — Vuex → Pinia | Replace 15 vuex-module-decorators stores with Pinia |

### Independent epics (not absorbed, but sequencing matters)

| Epic | Relationship |
|------|-------------|
| `izw` — Backend Modernization | **Predecessor.** Mostly done. Must complete `izw.55` (user data migration) before entity types can drop the dual-table userId pattern. |
| `1ep` — better-auth password-policy plugin | **Independent.** Replaces `@heimdall/password-complexity` on the backend. Runs whenever. |
| `oum.4` — Switch to password-policy plugin | **After 1ep.** Backend-only, no frontend impact. |
| `881` — SQL-first queries | **Independent.** Backend query optimization. Can parallel with frontend work. |
| `bc6` — Data filtering optimization | **After Phase 2.** Depends on composable migration being done (filters move into composables). |
| `nad` — Pagination | **Predecessor.** 3/5 done. `useServerPagination` established the composable pattern. Must close nad.4/nad.5 first. |
| `4xw` — Vite migration | **Predecessor.** Must stabilize before v3 swap (Phase 4) since hdf-libs v3 is ESM-only. |

### Complete dependency graph

```
izw (backend) ──→ izw.55 (user migration)
  ↓                    ↓
nad (pagination) ──→ close nad.4/nad.5
  ↓
4xw (Vite) ──→ stabilize
  ↓
Phase 1 (domain types + reference composable)    ← NEW
  ↓
Phase 2 (migrate HDF imports)    ← absorbs 3ys, 9uk partial
  ↓
Phase 3 (migrate entity imports)    ← absorbs oma (sequential — both touch data_filters.ts)
  ↓
Phase 4 (swap to hdf-libs v3) ←→ Phase 5 (swap converters)    ← NEW (parallel OK — different files)
  ↓                                   ↓
Phase 6 (delete old libs)    ← NEW
  ↓
Phase 7 (Vuex → Pinia)    ← NEW
  ↓
bc6 (data filtering optimization)

Independent:
  1ep (password-policy plugin) → oum.4 (switch Heimdall to it)
  881 (SQL-first backend queries)
```

---

## 9. LOE Summary

| Phase | Description | Absorbs | SP | Claude-pace |
|-------|------------|---------|-----|-------------|
| 1 | Domain types + reference composable | oma (partial) | 5 | ~30 min |
| 2 | Migrate 25 HDF component imports | 3ys + 9uk (partial) | 13 | ~90 min |
| 3 | Replace 23 @heimdall/common imports (after Phase 2) | oma (partial) | 8 | ~45 min |
| 4 | Swap composable internals to hdf-libs v3 | NEW | 8 | ~45 min |
| 5 | Swap converters to v3 | NEW | 5 | ~30 min |
| 6 | Delete old embedded libs | NEW | 2 | ~10 min |
| 7 | Vuex → Pinia | 9uk (partial) | 13 | ~90 min |
| **Total** | | | **54** | **~6 hours** |

**Note:** The 3ys utility composables (useLoading, useApi, useClipboard, useNotify) are
still needed but are separate from the HDF domain composables. They can be built during
Phase 2 as components need them. The 9uk component migration (101 files) is larger than
Phase 2+3 because it includes components that don't import from any embedded lib — those
are pure class→setup conversions that happen alongside but aren't driven by this plan.

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| 4 reverse converters missing from v3 | Export modals broken | Carry forward in-app; upstream PRs to hdf-libs |
| `ContextualizedControl` computed properties hard to replicate | Status/severity logic wrong | `computeEffectiveStatus()` exists in v3 helpers |
| @heimdall/common types don't match API responses | Type errors, runtime bugs | Align with actual Drizzle SelectUser/SelectGroup shapes |
| better-auth returns UUID strings, old types expect numbers | userId type mismatches | Entity types use `string` ids (better-auth native) |
| Vue 2.7 Composition API limitations | `<script setup>` unavailable | `ref()`, `computed()`, `watch()` all work; `defineComponent()` + `setup()` |
| Pinia on Vue 2.7 | Version constraint | Pin to `pinia@^2.3.1` (supports Vue ^2.7.0). Pinia v3 is Vue 3 only. |
| hdf-libs v3 is ESM-only | Import issues | Vite handles ESM natively |
| hdf-libs v3 may not be published to npm | Phase 4 blocked | Verify `npm view @mitre/hdf-schema` BEFORE starting Phase 4. If not published, install from git or local link. |
| Report intake store is complex (300+ lines) | High-risk refactor | Migrate last, after simpler stores prove the pattern |
| Phases 2+3 both touch data_filters.ts | Merge conflicts if parallel | Run Phase 2 first (HDF types), then Phase 3 (entity types). Do NOT parallelize these two phases. |
| Frozen circular `from_file` reference | Vue reactivity breaks on Object.freeze'd circular objects | Deep-clone raw data before wrapping in `ref()`. Break the circular reference during cloning. |
| Profile-only files (no results) | Unhandled file type | `useBaseline()` composable handles profile-only files separately from `useAssessment()` |

---

## 11. Review Findings — Resolved

Six findings from agent review, all addressed:

### F1: No v3 equivalent for InSpec v1 file parsing — RESOLVED
`@mitre/hdf-converters` exports `convertV1ToV2()` and `isHDFV1()` from the
`legacyhdf-to-hdf` converter. The composable path for v1 files:
`isHDFV1(raw)` → `convertV1ToV2(raw)` → `parseResults(converted)`.

### F2: FULL_NIST_HIERARCHY has no v3 equivalent — BUILD IN COMPOSABLE
`@mitre/hdf-mappings` provides `getAllNISTIds()` and `getNISTFamily()`. The hierarchy
tree can be built from these using the same algorithm as inspecjs's
`_generate_full_nist_hierarchy()`. This becomes `useNistHierarchy()` — a composable
that builds and caches the tree from v3 mapping data. Better than inspecjs because
it uses live mapping data instead of a hardcoded constant.

### F3: Overlay graph (extendedBy/extendsFrom) — USE @mitre/hdf-extension-graph
`@mitre/hdf-extension-graph` already provides `ContextualizedRequirement` with
`extendsFrom` and `extendedBy` arrays, plus `root`, `isRedundant`, and `fullCode`
properties. The `Requirement` domain type needs an `extendedBy` field for the
`omit_overlayed_controls` filter dimension:

```typescript
export interface Requirement {
  // ... existing fields ...
  extendedBy: Requirement[];   // overlay children (empty = base requirement)
  extendsFrom: Requirement[];  // overlay parents (empty = not an overlay)
}
```

### F4: Severity 'none' vs 'informational' mismatch — HANDLED BY v3
`@mitre/hdf-utilities` `severityToImpact()` accepts `'none'`, `'info'`,
`'informational'`, and `'information'` — all map to 0.0. `impactToSeverity()`
returns `'informational'` for impact 0.0. The domain type uses v3's canonical
values. The composable normalization layer translates inspecjs `'none'` → `'informational'`
during Phase 2 (while inspecjs is still the internal engine), then the translation
disappears naturally in Phase 4 when v3 is the engine.

### F5: ControlStatus title-case → camelCase — COMPOSABLE MAPPING
inspecjs uses title-case: `'Not Applicable'`, `'Passed'`, `'Failed'`, etc.
v3 uses camelCase: `'notApplicable'`, `'passed'`, `'failed'`, etc.
The composable normalization layer maps between them:

```typescript
const STATUS_MAP: Record<string, ResultStatus> = {
  'Passed': 'passed',
  'Failed': 'failed',
  'Not Applicable': 'notApplicable',
  'Not Reviewed': 'notReviewed',
  'Profile Error': 'error',
  'From Profile': 'notReviewed',
};
```

This mapping lives inside `useRequirement()` and disappears in Phase 4 when v3
provides camelCase natively. Components never see the old casing.

### F6: filterControlsBy uses lodash _.get path strings — TYPED ACCESSORS
Replace stringly-typed `_.get(control, 'root.hdf.severity')` with typed filter
functions. Best practice: filter dimensions are typed accessor functions, not
path strings.

```typescript
// BEFORE (fragile — path strings break when object shape changes):
const filters = { 'root.hdf.severity': filter.severity };
const item = _.get(control, filter);

// AFTER (type-safe — compiler catches shape changes):
interface FilterDimension<T> {
  accessor: (item: T) => string | string[] | boolean | undefined;
  values: string[] | boolean | undefined;
}

const dimensions: FilterDimension<Requirement>[] = [
  { accessor: (r) => r.severity, values: filter.severity },
  { accessor: (r) => r.id, values: filter.ids },
  { accessor: (r) => r.title ?? '', values: filter.titleSearchTerms },
  { accessor: (r) => r.findingDetails ?? '', values: filter.descSearchTerms },
  { accessor: (r) => r.nistTags.map(t => t.raw), values: filter.nistIdFilter },
  { accessor: (r) => r.code ?? '', values: filter.codeSearchTerms },
  { accessor: (r) => r.waived, values: filter.status?.includes('waived') },
  { accessor: (r) => r.status, values: filter.status?.filter(s => s !== 'waived') },
];

function filterRequirements(
  requirements: Requirement[],
  dimensions: FilterDimension<Requirement>[]
): Requirement[] {
  const active = dimensions.filter(d =>
    (Array.isArray(d.values) && d.values.length > 0) ||
    (typeof d.values === 'boolean' && d.values)
  );
  return requirements.filter(r =>
    active.every(d => matchDimension(d.accessor(r), d.values))
  );
}
```

This is a compile-time-safe replacement that produces the same filtering behavior.
The `filterRequirements` function replaces `filterControlsBy` and lives in the
`useFilteredRequirements` composable. No lodash `_.get` needed.

---

## 12. Upstream Contributions

### Splunk + Tenable API Clients (hdf-libs issue #86)

Filed: https://github.com/mitre/hdf-libs/issues/86

hdf-libs v3 converts file formats but has no API client code. Heimdall2 maintains
~700 lines of raw axios Splunk + Tenable integration. Proposal: build typed API
clients in hdf-libs that fetch data from these services and pipe through existing
converters. We build the initial TS implementation during Phase 5 work, then
contribute as a PR.

### 4 Reverse Converters

HDF→HTML, HDF→Splunk, HDF→CAAT, HDF→ASFF are missing from hdf-libs v3. We carry
them forward in-app during Phase 5 (hl1.5.2), then upstream as PRs once stabilized.

### HTTP Client Decision

Research card hl1.9 will evaluate: `ky` (browser-first, tiny, typed), native `fetch`
(universal), or `splunk-sdk`. Decision applies to both Heimdall2 composables and the
upstream hdf-libs PR. Vulcan may also be moving from axios — align the choice.

---

## 13. What This Unlocks

1. **Library independence** — swap hdf-libs versions without touching UI
2. **API contract truth** — frontend types match what the backend actually returns
3. **Multi-framework support** — NIST, CIS, CWE, OWASP mappings via `@mitre/hdf-mappings`
4. **better-auth alignment** — entity types use string UUIDs, session-based auth
5. **Pinia migration** — composables are the natural stepping stone
6. **hdf-libs Go CLI** — same data formats across TS and Go
7. **Future Vue 3** — composables + Pinia + domain types = ready when/if needed
8. **Browser-safe by default** — `@mitre/hdf-utilities` replaces Node.js-only APIs
