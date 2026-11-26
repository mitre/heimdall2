# ADR-003: CKLB (STIG Viewer 3 JSON Checklist) Converter — Forward, Reverse, and Shared Checklist Domain Layer

**Status:** Draft (reviewed by 10 independent agents across 2 rounds, 32 findings incorporated)
**Date:** 2026-06-22
**Author:** Aaron Lippold
**Resolves:** #5603 (epic), #7271 (schema mapping), #7733 (CKL↔CKLB conversion)
**Branch:** `feature/attestation-editing-engine`
**Related:** ADR-001 (attestation engine), ADR-002 (DRY hdf-converters)
**Schema:** `SV3_CKLB_1_0_JSON_SCHEMA.json` (DISA, v1.0, 2024-01-09)

---

## Glossary

| Term | Definition |
|------|-----------|
| **CKL** | Checklist — DISA's legacy XML format used by STIG Viewer 2 for recording STIG review results. Uses statuses: Not A Finding, Open (Finding), Not Applicable, Not Reviewed. |
| **CKLB** | Checklist JSON — DISA's newer JSON format introduced by STIG Viewer 3 (SV3). File extension `.cklb`. Uses statuses: `not_a_finding`, `open`, `not_applicable`, `not_reviewed`. |
| **SV3** | STIG Viewer 3 — DISA's tool for reviewing STIGs and producing checklists |
| **HDF / OHDF** | Heimdall Data Format / Outcome-based HDF — JSON output format from InSpec and other scanners |
| **passthrough** | An extension point in the InSpec JSON report schema. Designed for reporters, plugins, and downstream tools to attach structured data to the report. A deliberate interoperability mechanism — not a dump for unknown data. |
| **round-trip** | Import CKLB into Heimdall, review/attest/comment, export back to CKLB. The output must be valid CKLB that SV3 accepts with all user edits preserved. |
| **patching** | The round-trip export strategy: start from the original CKLB (preserved in HDF passthrough), unconditionally overlay the 4 mutable fields from current HDF state, serialize. An unchanged value overlaid = the same value, so no dirty-tracking is needed for the overlay itself. |

---

## 1. Context

### 1.1 The Problem

DISA's STIG Viewer 3 produces `.cklb` files — a JSON-based checklist format that replaces the legacy CKL XML format. Heimdall supports CKL import/export but has no CKLB support. Users need:

1. **Import CKLB into Heimdall** — view, filter, and report on SV3 checklists alongside other scan data
2. **Round-trip editing** — import CKLB → review/attest/comment in Heimdall → export back to CKLB → continue in SV3
3. **CKL↔CKLB conversion** — many DoD tools/processes still consume CKL; users need to move between formats
4. **SAF CLI integration** — `saf convert cklb2hdf` and `saf convert hdf2cklb` commands

### 1.2 Existing Issues

- **#5603** (Amndeep, epic): "Support for CKLB checklist format." Includes a checklist item to "propose a modification to the CKLB format to include a field for pass-through data" — this ADR concludes that modification is **unnecessary** (see §4).
- **#7271** (Emily Rodriguez): "Perform schema mapping between latest CKLB format and OHDF." Assigned, never completed. The mapping is provided in §3 of this ADR.
- **#7733** (RCramm123): "SAFcli to convert between cklb and ckl files." Answered by the shared intermediate architecture in §5.

### 1.3 The CKLB Schema (SV3 v1.0)

The schema defines a JSON structure with:
- **Top level:** `title` (filename, **required**), `id` (UUID, **required**), `cklb_version` ("1.0"), `target_data`, `stigs[]`
- **Per STIG:** `stig_name`, `display_name`, `stig_id`, `release_info`, `uuid`, `size`, `rules[]`
- **Per rule (`stig_rule`):** 35+ fields including `group_id`, `rule_id`, `rule_version`, `severity`, `status`, `comments`, `finding_details`, `overrides`, `ccis[]`, `legacy_ids[]`, `group_tree[]`
- **`additionalProperties: false`** at every level — strict schema, no extension points
- **No `required` fields on `stig_rule`** — all rule fields are optional. Converter must handle missing fields defensively.

**Schema bug:** `check_content` appears twice (lines 250 and 286). JSON forbids duplicate keys; parsers keep the last. Real CKLB files have a single field. Report upstream to DISA.

### 1.4 Key Insight

**CKLB is structurally the existing CKL intermediate object with renamed fields and no XML layer.** Every piece of format-agnostic logic the CKL mapper already has — status mapping, severity↔impact, CCI↔NIST, finding-details parsing, structured-comment parsing, multi-STIG parent-profile synthesis — applies unchanged to CKLB. The difference is serialization: CKL needs JSONIX for XML; CKLB is `JSON.parse`/`JSON.stringify`.

---

## 2. Decision

Build a CKLB converter (forward + reverse) by extracting the shared checklist domain logic from the existing CKL mapper into a common module, then adding a thin CKLB serialization layer. The extraction and the new converter are one body of work — not "DRY first, then build."

### 2.1 Architecture: Shared Intermediate (Option B)

```
                    ┌─────────────────────┐
                    │  Shared Checklist    │
                    │  Domain Logic        │
                    │  (checklist-common/) │
                    │                      │
                    │  - Domain enums      │
                    │  - StatusMapping     │
                    │  - severity↔impact   │
                    │  - CCI↔NIST          │
                    │  - comment parsing   │
                    │  - finding details   │
                    │  - hdfSpecificData   │
                    │  - ChecklistMapper   │
                    │    (intermediate→HDF)│
                    └──────┬───────┬───────┘
                           │       │
              ┌────────────┘       └────────────┐
              │                                  │
    ┌─────────▼──────────┐            ┌─────────▼──────────┐
    │  CKL Mapper        │            │  CKLB Mapper       │
    │  (existing)        │            │  (new)             │
    │                    │            │                    │
    │  XML ↔ JSONIX ↔    │            │  JSON.parse ↔      │
    │  intermediate      │            │  intermediate      │
    │                    │            │                    │
    │  toCkl() (XML out) │            │  toCklb() (JSON)   │
    └────────────────────┘            └────────────────────┘
```

**CKL↔CKLB conversion via shared intermediate:** `CKL→intermediate→CKLB` and `CKLB→intermediate→CKL`. This is lossless for the shared field set (status, severity, CCIs, comments, finding details, target data). **CKLB-native fields** (`display_name`, `group_tree`, `reference_identifier`, `createdAt`/`updatedAt`, structured `overrides`) have no CKL representation and are lost on CKLB→CKL — they survive only via HDF passthrough. Document this lossiness explicitly for users.

### 2.2 Why Not the Alternatives

**Option A (fully standalone CKLB mapper):** Duplicates ~400 lines of validated severity/status/CCI/comment logic. Guarantees the two mappers drift over time. Violates DRY.

**Option C (CKLB→CKL→HDF, convert internally):** Forces CKLB through XML's lossy `STIG_DATA` key-value representation. Discards CKLB-native fields. Strictly more lossy and more fragile.

### 2.3 Round-Trip Export: The Patching Approach

For CKLB files that were imported into Heimdall and are being exported back:

1. Read the original CKLB from `passthrough.source` (stored at import time)
2. For each HDF profile, identify the corresponding STIG by `profile.name` → `stig.stig_id`. Guard: if a checklist contains the same `stig_id` twice (re-imported benchmark), warn and match by array position.
3. Within that STIG, match HDF controls to CKLB rules by `control.id` ↔ `rule.group_id` (scoped within the STIG). Note: rule `uuid` is in passthrough only, not on the HDF control — it cannot be used as a matching key. `group_id` is unique within a STIG.
4. **Unconditionally overlay the 4 mutable fields** from current HDF state onto the matched CKLB rule: `status`, `comments`, `finding_details`, `overrides.severity`. An unchanged value overlaid = the same value, so per-field dirty-tracking is not needed for the overlay itself. This avoids coupling the export path to the annotation store's dirty-tracking granularity.
5. For override **removal** (no `severityoverride` tag on the HDF control): delete `overrides.severity` from the CKLB rule. Do not leave stale overrides.
6. `JSON.stringify()` — valid CKLB, correct values for all 4 fields, no reconstruction needed.

**Multi-cycle invariant:** On reimport, the patched CKLB output becomes the next `passthrough.source`. Each cycle's overlay is idempotent (same HDF state → same CKLB values), so divergence does not accumulate.

This is simpler and more reliable than reconstructing a CKLB from HDF fields. The full intermediate→CKLB path is only needed for "fresh export" (HDF that was never CKLB).

### 2.4 Relationship to BaseResults (ADR-002)

The checklist mapper family (`ChecklistResults`, `CklbResults`) is **bidirectional** — both `toHdf()` and `toCkl()`/`toCklb()`. ADR-002's `BaseResults<TInput, TOutput>` is forward-only (`toHdf()`). The checklist family sits outside the BaseResults direction by design. This is not a conflict — BaseResults standardizes the 14 forward-only Results wrappers; checklist converters are a distinct pattern with their own shared intermediate.

---

## 3. Field Mapping

### 3.1 Status Mapping

**Forward (CKLB → HDF):** Lossless. Each CKLB status maps to exactly one HDF state.

| CKLB `status` | CKL `STATUS` | HDF `ControlResultStatus` | HDF `impact` effect | Heimdall display |
|---|---|---|---|---|
| `open` | `Open` | `failed` | severity-derived (>0) | Failed |
| `not_a_finding` | `Not A Finding` | `passed` | severity-derived | Passed |
| `not_applicable` | `Not Applicable` | `skipped` | forced to 0 | Not Applicable |
| `not_reviewed` | `Not Reviewed` | `skipped` | severity-derived | Not Reviewed |

**Reverse (HDF → CKLB):** NOT a symmetric bijection. Both `not_applicable` and `not_reviewed` map to HDF `skipped`. Reverse disambiguation relies on impact: impact 0 → `not_applicable`; impact >0 with no failed/passed results → `not_reviewed`. This uses the existing CKL `getStatus` logic. Additionally, HDF `error` status and Heimdall's computed "No Data" state have no CKLB target — they fall through to `not_reviewed`.

### 3.2 Severity Mapping

| CKLB `severity` | HDF `impact` | Notes |
|---|---|---|
| `low` | 0.3 | |
| `medium` | 0.5 | |
| `high` | 0.7 | |
| `unknown` | **Conditional on status** | If `status == open`: impact **0.1** (preserves visibility as a finding — impact 0 would hide it as Not Applicable). All other statuses: impact **0**. Preserve original `"unknown"` in passthrough for round-trip. **Flag for SAF team review.** |

**Overrides:** `overrides.severity.severity` overrides the base severity. `overrides.severity.reason` is the justification. Maps to existing `tags.severityoverride` / `tags.severityjustification`.

**HDF → CKLB (reverse):** HDF has 5 severity bands (none, low, medium, high, critical). CKLB has 4 (unknown, low, medium, high). Mapping: `critical` → `high`, `none` → `unknown`. Override values must also run this collapse — never emit `"critical"` into CKLB `overrides.severity.severity` (SV3 likely rejects it). Impact precision survives round-trip via `hdfSpecificData` in `third_party_tools` (same mechanism as CKL).

### 3.3 Rule → Control Mapping

| CKLB `stig_rule` field | HDF path | Transform |
|---|---|---|
| `group_id` (e.g. `V-257777`) | `controls[].id` | direct (primary control ID) |
| `rule_id` (e.g. `SV-257777r...`) | `tags.rid` | direct |
| `rule_version` (e.g. `RHEL-09-...`) | `tags.stig_id` | direct (stable STIG ID) |
| `rule_title` | `title` | direct |
| `discussion` | `desc` | direct |
| `check_content` | `descriptions[label=check]` | direct |
| `fix_text` | `descriptions[label=fix]` | direct |
| `comments` | `descriptions[label=comments]` (+ caveat/justification/rationale) | parse via `parseComments` |
| `finding_details` | `results[].code_desc` | parse via `parseFindingDetails` |
| `severity` | `impact` + `tags.severity` | enum → float (§3.2) |
| `status` | `results[].status` + `impact` | enum (§3.1) |
| `ccis[]` | `tags.cci` + `tags.nist` | array + `CciNistTwoWayMapper.nistFilter` |
| `legacy_ids[]` | `tags.Legacy_ID` | keep as array (see §8.7 for type mismatch) |
| `weight` | `tags.weight` | direct |
| `classification` | `tags.Class` | direct |
| `group_title` | `tags.gtitle` | direct |
| `false_positives` | `tags.False_Positives` | direct |
| `false_negatives` | `tags.False_Negatives` | direct |
| `documentable` | `tags.Documentable` | direct |
| `mitigations` | `tags.Mitigations` | direct |
| `potential_impacts` | `tags.Potential_Impact` | direct |
| `mitigation_control` | `tags.Mitigation_Control` | direct |
| `responsibility` | `tags.Responsibility` | direct |
| `security_override_guidance` | `tags.Security_Override_Guidance` | direct |
| `ia_controls` | `tags.IA_Controls` | direct |
| `overrides.severity` | `tags.severityoverride` + `tags.severityjustification` | restructure |
| `third_party_tools` | `hdfSpecificData` blob | JSON parse/stringify (same as CKL) |
| `check_content_ref` | `refs[]` | map `{name, href}` → HDF `refs` entry (cleaner than passthrough) |
| `target_key` | `tags.TargetKey` | direct |
| `stig_ref` | `tags.STIGRef` | direct |
| `reference_identifier` (per-rule) | `tags.reference_identifier` | direct |

### 3.4 Fields with No HDF Equivalent (Passthrough)

These fields are preserved in `passthrough.source` for round-trip fidelity:

**Top level:** `title` (**required** — round-trip produces invalid CKLB without it), `id`, `cklb_version`, `active`, `mode`, `has_path`

**Per STIG:** `display_name`, `uuid`, `reference_identifier` (STIG-level), `size`

**Per rule:** `uuid` (used as primary round-trip matching key, §2.3), `stig_uuid`, `group_id_src`, `rule_id_src`, `group_tree[]`, `createdAt`, `updatedAt`, full `overrides` object (preserves future override keys beyond `severity`), `STIGUuid` (deprecated)

### 3.5 Target Data Mapping

| CKLB `target_data` | CKL `<ASSET>` | HDF location |
|---|---|---|
| `host_name` | `HOST_NAME` | `passthrough.source.target_data` |
| `ip_address` | `HOST_IP` | same |
| `mac_address` | `HOST_MAC` | same |
| `fqdn` | `HOST_FQDN` | same |
| `comments` | `TARGET_COMMENT` | same |
| `role` | `ROLE` | same (free string in CKLB vs enum in CKL) |
| `target_type` | `ASSET_TYPE` | same |
| `is_web_database` | `WEB_OR_DATABASE` | same |
| `technology_area` | `TECH_AREA` | same |
| `web_db_site` | `WEB_DB_SITE` | same |
| `web_db_instance` | `WEB_DB_INSTANCE` | same |

HDF has no native asset model beyond `platform.target_id`. All target data lives in passthrough, same as the existing CKL mapper.

### 3.6 STIG Header → Profile Mapping

| CKLB `stig` | HDF `profile` |
|---|---|
| `stig_name` | `title` |
| `stig_id` (benchmark ID) | `name` |
| `release_info` | `version` (parsed) |
| `rules[]` | `controls[]` |

Multi-STIG checklists (`stigs.length > 1`): one HDF profile per STIG, plus a synthesized Parent Profile with `depends[]` — same as existing CKL mapper (`ChecklistResults.toHdf`).

---

## 4. Passthrough Strategy (Resolves #5603 Concern)

Issue #5603 includes: *"If [not all fields map to OHDF], propose a modification to the CKLB format to include a field for pass-through data and communicate this proposal to DISA."*

**No DISA schema modification is needed for v1.** The passthrough mechanism is an HDF concept, not a CKLB concept. Attestation audit trail fidelity through SV3 (i.e., an ISSO handing a standalone `.cklb` to another reviewer in SV3 and expecting full attestation metadata to be visible) is an open question — CKLB has no field for attestation frequency, TTL, or attribution. A standalone `.cklb` is not a complete attestation record; the HDF annotation bundle must accompany it for full fidelity.

`passthrough` is a designed extension point in the InSpec JSON report schema — a place for reporters, plugins, and downstream tools to attach structured data. It is a deliberate interoperability mechanism. Heimdall's converters use it to store source format data for round-trip fidelity.

**The flow:**
```
CKLB file → JSON.parse → map to HDF controls
                          store original in passthrough.source
                          add heimdall metadata via createHeimdallPassthrough('cklb', ...)
         → User works in Heimdall (attest, comment, review)
         → Export: read passthrough.source, patch dirty-tracked fields only, JSON.stringify
         → Valid CKLB file (SV3 accepts it)
```

CKLB's `additionalProperties: false` is irrelevant — we never inject fields into CKLB. We store CKLB data inside HDF's extension point on import, and reconstruct valid CKLB from it on export.

**Note:** Heimdall-origin metadata (attestation frequency, TTL/expiration, `updated_by`, `explanation`) has no native CKLB field. This metadata survives in the HDF annotation bundle or, for impact precision, in the `hdfSpecificData` blob carried via `third_party_tools`. We do not claim "zero injection" — `hdfSpecificData` repurposes `third_party_tools` (a field documented as "from origin STIG"). This is the same pragmatic choice CKL makes. No schema modification is needed, but the repurposing should be documented for users.

**Passthrough structure:**
```typescript
passthrough: {
  heimdall: { sourceFormat: 'cklb', toolVersion: string },
  source: {                    // original CKLB for round-trip patching
    title: string,             // REQUIRED by CKLB schema
    id: string,                // checklist UUID
    cklb_version: string,
    target_data: TargetData,
    stigs: CklbStig[],         // full original including CKLB-only fields
    active?: boolean,
    mode?: number,
    has_path?: boolean,
  },
  raw?: CklbDocument,          // entire original (withRaw mode only)
}
```

### 4.1 `hdfSpecificData` Strategy

The existing CKL mapper stores HDF-specific data (impact precision, critical/none severity, control code) as a JSON blob inside the `third_party_tools` string field. This allows HDF data to survive a CKL round-trip.

CKLB has the same `third_party_tools` field (string, per rule). **For v1, use the same mechanism** — one code path for both formats. This is a pragmatic choice, not an ideal one; `third_party_tools` is described as "Third_Party_Tools from origin STIG" and we're repurposing it.

**Decision for SAF team:** Should v2 store `hdfSpecificData` in passthrough instead, keeping `third_party_tools` clean? The tradeoff: cleaner CKLB output vs. diverging from the CKL code path.

---

## 5. Shared Checklist Domain Layer

### 5.1 What Gets Extracted

The shared logic lives in two CKL mapper files today. The table below shows **actual locations** (verified by code audit):

**From `checklist-jsonix-converter.ts`:**

| Item | Line(s) | Verdict |
|---|---|---|
| `StatusMapping` enum | :92 | SHAREABLE (pure enum) |
| `Severity` enum | :109 | SHAREABLE |
| `ChecklistObject`, `ChecklistStig`, `ChecklistVuln` types | :29-89 | NEEDS-MODIFICATION (see §5.4) |
| `ChecklistMetadata`, `StigMetadata` types | :116-140 | NEEDS-MODIFICATION (uses JSONIX enums) |
| `EmptyChecklistObject` | :142-200 | NEEDS-MODIFICATION (instantiates JSONIX enums) |
| `IMPACT_MAPPING` (Map) | :101 | SHAREABLE |
| `computeImpact` | :334 | SHAREABLE |
| `addHdfControlSpecificData` | :258 | SHAREABLE |
| `addHdfProfileSpecificData` | :311 | SHAREABLE |
| `severityMap` | :690 | SHAREABLE |
| `controlsToVulns` | :348 | SHAREABLE (but depends on helpers below) |
| `getStatus` (HDF→checklist status) | :569 | SHAREABLE (name collides with checklist-mapper.ts:172 — disambiguate) |
| `getComments` | :517 | SHAREABLE |
| `getFindingDetails` | :538 | SHAREABLE |
| `getReleaseInfo` | :554 | SHAREABLE |
| `matchNistToCcis` | :682 | SHAREABLE |
| `hdfToIntermediateObject` | :608 | SHAREABLE (needed for fresh CKLB export) |
| `updateChecklistWithMetadata` | :209 | SHAREABLE |

**From `checklist-mapper.ts`:**

| Item | Line(s) | Verdict |
|---|---|---|
| `ImpactMapping` enum | :29 | SHAREABLE |
| `transformImpact` | :138 | SHAREABLE |
| `computeSeverity` | :113 | SHAREABLE |
| `findSeverity` / `findSeverityOverride` | :72 / :92 | SHAREABLE |
| `cciRef` / `nistTag` | :45 / :55 | SHAREABLE |
| `parseComments` | :248 | SHAREABLE (**private** — must be exported) |
| `parseFindingDetails` | :207 | SHAREABLE (**private** — must be exported) |
| `getAttributes` | :291 | SHAREABLE |
| `getHdfSpecificDataAttribute` | :297 | SHAREABLE |
| `getChecklistObjectFromHdf` | :279 | SHAREABLE (already exported) |
| `ChecklistMapper` (intermediate→HDF) | :423 | Move to shared (uses intermediate, not XML) |
| `ChecklistResults` (CKL entry point) | :323 | STAYS in ckl-mapper (extends JSONIX converter) |

**From `description-editing.ts` (already format-agnostic, no extraction needed):**
`setControlDescription`, `syncChecklistVulnComments`, `buildEditsMapFromProfiles`, `prepareEvaluationForCklExport`, `sanitizeCklSectionMarkers`

**Note:** `description-editing.ts` does NOT contain `parseComments` or `getComments` — those are in the files listed above. It does import `ChecklistVuln` from `ckl-mapper/`, making it a coupling point that needs updating when types move.

**NOT extractable (JSONIX-coupled, stays in ckl-mapper):**
`createVulns`, `expandHeader`, `expandVulns`, `fromIntermediateObject`, `getValueFromAttributeName`, `toIntermediateObject`, the `ChecklistJsonixConverter` class.

### 5.2 File Structure

```
libs/hdf-converters/src/
  checklist-common/                    # NEW — extracted shared logic
    types.ts                           # ChecklistObject, ChecklistVuln, ChecklistStig, enums
                                       # + domain enums (Assettype, Role, Techarea,
                                       #   Severityoverride) relocated FROM checklistJsonix.ts
    status-severity.ts                 # StatusMapping, ImpactMapping, severity↔impact,
                                       # transformImpact, computeSeverity, findSeverity,
                                       # computeImpact, getStatus
    hdf-specific-data.ts               # addHdfControlSpecificData, addHdfProfileSpecificData
    comment-finding-details.ts         # parseComments, parseFindingDetails, getComments,
                                       # getFindingDetails, cciRef, nistTag, getAttributes,
                                       # getHdfSpecificDataAttribute
    intermediate-to-hdf.ts             # ChecklistMapper (moved from checklist-mapper.ts)
    hdf-to-intermediate.ts             # controlsToVulns, severityMap, getStatus (reverse),
                                       # matchNistToCcis, getReleaseInfo,
                                       # hdfToIntermediateObject, getChecklistObjectFromHdf
    index.ts                           # re-exports everything (backward compat)
  ckl-mapper/                          # EXISTING — keeps only XML/JSONIX concerns
    checklist-jsonix-converter.ts      # XML ↔ intermediate (JSONIX layer)
    checklist-mapper.ts                # ChecklistResults (CKL entry point, delegates to shared)
    checklist-metadata-utils.ts        # CKL-specific metadata validation
    checklistJsonix.ts                 # JSONIX type definitions
                                       # (re-imports domain enums from checklist-common/)
    jsonixMapping.ts                   # JSONIX config
  cklb-mapper/                         # NEW
    cklb-types.ts                      # TypeScript types from CKLB JSON schema
    cklb-converter.ts                  # CKLB JSON ↔ intermediate
    cklb-mapper.ts                     # CklbResults entry point: toHdf() + toCklb()
```

### 5.3 Migration Discipline

The extraction moves functions out of `ckl-mapper/` into `checklist-common/` with re-exports so all existing imports keep working. CKL behavior must be **byte-for-byte unchanged** — the existing CKL test fixtures are the regression gate. This is an extract, not a rewrite.

**External call sites are minimal:** `ChecklistResults` is imported in `apps/frontend/src/store/report_intake.ts:155`, `ExportCKLModal.vue`, and tests — all via `index.ts` `export *`. Re-exports preserve them.

### 5.4 The JSONIX Type Coupling (Critical Extraction Risk)

The shared intermediate types are currently **defined in terms of JSONIX types** from `checklistJsonix.ts`:
- `ChecklistVuln = Omit<Vuln, 'status' | 'stigdata'> & {...}` — extends the JSONIX `Vuln` type
- `ChecklistMetadata` uses JSONIX enums: `Assettype`, `Role`, `Techarea`
- `EmptyChecklistObject` instantiates JSONIX enum values: `Assettype.Computing`, `Role.None`, `Techarea.Empty`, `Severityoverride.Empty`

Moving these to `checklist-common/` while leaving `checklistJsonix.ts` in `ckl-mapper/` would create an **inverted dependency** (shared-layer → CKL-layer).

**Fix:** Relocate the domain enums (`Assettype`, `Role`, `Techarea`, `Severityoverride`), the base `Vuln` shape, the `Asset` type, and their transitive dependencies (`Status`, `StigdatumElement`, `Vulnattribute`) into `checklist-common/types.ts`. Have `checklistJsonix.ts` re-import/alias them. Constraint: `checklist-common/types.ts` must import NOTHING from `ckl-mapper/` — enforce this with an ESLint `no-restricted-imports` rule or a build test.

### 5.4a The Instance-Method Problem (Critical Extraction Challenge)

Many "shareable" functions in `checklist-jsonix-converter.ts` are **instance methods** on the `ChecklistJsonixConverter` class (which §5.1 says "NOT extractable, stays in ckl-mapper"). `controlsToVulns`, `computeImpact`, `getComments`, `getFindingDetails`, `severityMap`, `getStatus`, `matchNistToCcis`, `hdfToIntermediateObject` are all `this.`-coupled — `controlsToVulns` calls `this.computeImpact`, `this.getComments`, `this.getFindingDetails`, `this.severityMap`, `this.getStatus`, `this.matchNistToCcis`.

You cannot "move" an instance method out of a class — that contradicts §5.3's "extract, not rewrite." Two options:

**Option 1 (recommended): Extract a shared base class `ChecklistConverterBase` in `checklist-common/`.** Move the format-agnostic methods there. Both `ChecklistJsonixConverter` (CKL) and the new CKLB converter extend it. CKL behavior is byte-for-byte unchanged because the method bodies are identical — just the class hierarchy changes. This is the safest path.

**Option 2: Refactor to parameterized free functions.** Convert each `this.` method to a standalone function that takes its dependencies as parameters. More invasive, breaks more call sites, but produces a cleaner API. Not recommended for initial extraction — do this as a follow-up refactor if Option 1 proves constraining.

### 5.4b Additional Missing Extraction Items

The following were identified by code audit as needed but missing from §5.1:
- **`Asset` type** (jsonix-converter.ts:35) — `ChecklistAsset = Asset` inside `ChecklistObject` depends on JSONIX. Must relocate with domain enums.
- **`getStatus`** (checklist-mapper.ts:172, string→ControlResultStatus) — distinct from the reverse `getStatus` in jsonix-converter.ts:569. CKLB forward mapper needs it. Rename on extraction to `parseHdfStatus` to disambiguate.
- **`checkMessage`** (checklist-mapper.ts:192) — helper called by `parseFindingDetails`. Must move with it.
- **Module-level regex constants** (`FINDING_DETAILS_RE`, `COMMENT_SECTION_SPLIT_RE`, `COMMENT_SECTION_PARSE_RE` at checklist-mapper.ts:36-38) and `CCI_NIST_TWO_WAY_MAPPER` singleton (:35) — move with their consumers.
- **Consolidate `IMPACT_MAPPING`** (jsonix-converter.ts:101, 5 entries incl critical/none) and `ImpactMapping` enum (checklist-mapper.ts:29, 3 entries) into **one source** in `status-severity.ts`. Two separate impact maps is a DRY violation within the shared layer itself.

### 5.5 Status Vocabulary Normalization

CKL and CKLB use the same DISA vocabulary — both come from the same agency. The only difference is casing:

| CKL (XML) | CKLB (JSON) | Meaning |
|-----------|-------------|---------|
| `NotAFinding` | `not_a_finding` | Passed (not a finding) |
| `Open` | `open` | Failed (it IS a finding) |
| `Not_Applicable` | `not_applicable` | Not Applicable |
| `Not_Reviewed` | `not_reviewed` | Not Reviewed |

**Important:** The shared `StatusMapping` enum uses HDF vocabulary as VALUES, not CKL vocabulary:
```typescript
enum StatusMapping {
  Not_Applicable = 'Not Applicable',  // VALUE is HDF display string
  Not_Reviewed = 'Not Reviewed',
  NotAFinding = 'Passed',             // KEY is CKL-style, VALUE is HDF-style
  Open = 'Failed',
}
```

So there are THREE vocabularies: CKL keys (`NotAFinding`), CKLB strings (`not_a_finding`), and HDF values (`Passed`). The CKLB serializer maps HDF values to CKLB strings:
- `'Passed'` → `'not_a_finding'`
- `'Failed'` → `'open'`
- `'Not Applicable'` → `'not_applicable'`
- `'Not Reviewed'` → `'not_reviewed'`

Tests should verify the full roundtrip: CKLB snake_case → intermediate → HDF → intermediate → CKLB snake_case.

### 5.6 `legacy_ids` Type Mismatch

CKL's `ChecklistVuln.legacyId` is `string` (`;`-joined). CKLB's `legacy_ids` is `string[]`. Options:
- **Widen intermediate to `string | string[]`** and handle both in shared logic
- **Normalize to array in intermediate** — CKL import splits by separator, CKLB passes through directly. CKL export re-joins. CKLB export uses array.

Recommend normalize to array — cleaner, no conditional types. CKL's `expandVulns` already splits by separator (jsonix-converter.ts SEPARATOR_RE).

---

## 6. Detection and Registration

### 6.1 Format Fingerprinting

Add a JSON fingerprint to `fingerprinting.ts`:

```typescript
INPUT_TYPES.CKLB = 'cklb'
```

Detection keys: `cklb_version` (most specific — a const `"1.0"` unique to this format). Fallback: `id` + `title` + `stigs` with guard on `stigs[0].rules` / `stigs[0].stig_id`.

CKL detection is XML-only (`<CHECKLIST>` + `<STIGS>` + `<STIG_INFO>`). No collision risk.

### 6.2 CKLB Schema Version Handling

DISA versions the CKLB schema via the `cklb_version` field (`const: "1.0"` in the current schema) and the schema filename (`SV3_CKLB_1_0_JSON_SCHEMA.json`). The schema has no publication date field — the upload date (2024-01-10) is only on cyber.mil.

**Policy:**
- `cklb_version: "1.0"` or absent (defaults to 1.0 per schema description): **accept**
- `cklb_version` present but unrecognized (e.g., `"1.1"`, `"1.2"`): **warn** ("Unknown CKLB version X — parsing as 1.0, some fields may not be mapped"), then proceed best-effort
- `cklb_version: "2.0"` or any major version change: **fail** with clear error ("CKLB version 2.0 is not supported — update hdf-converters")
- No `cklb_version` field at all: **accept** (field is optional in schema, defaults to 1.0)

### 6.3 Exports and CLI

- Register in `libs/hdf-converters/src/index.ts`: `CklbResults`, `CklbMapper`
- Register `createHeimdallPassthrough('cklb', ...)` in the mapper
- SAF CLI commands: `cklb2hdf`, `hdf2cklb`
- Composed commands: `ckl2cklb` (CKL→intermediate→CKLB), `cklb2ckl` (CKLB→intermediate→CKL)

### 6.4 Error Strategy

**Best-effort with warnings, never silent drop.** A converter that silently swallows malformed rules can hide compliance findings — unacceptable for a security tool.

- **Fail-fast:** Missing required top-level fields (`title`, `id`) on export = error with clear message
- **Best-effort + warn:** Missing optional rule fields = default + log warning (e.g., missing `status` defaults to `not_reviewed` with warning "Rule {group_id} has no status — defaulting to not_reviewed")
- **Never silent drop:** A rule with unrecognized fields or unexpected values is still converted — unknown fields go to passthrough, unexpected enum values are preserved as-is with a warning
- **Validation on import:** Verify the two required top-level fields (`title`, `id`). Validate `status` enum values against the known set; warn on unrecognized but don't reject.

### 6.5 CKLB Type Generation

Generate TypeScript types from the CKLB JSON schema using `json-schema-to-typescript` (or `quicktype`). Do NOT hand-type the 35+ field interface — hand-typed types drift from the schema silently. The CKL side already generates types from XSD via JSONIX — there is in-repo precedent.

```bash
npx json-schema-to-typescript SV3_CKLB_1_0_JSON_SCHEMA.json -o src/cklb-mapper/cklb-types.ts
```

Check the generated file into source control. Regenerate when DISA publishes a new schema version. Handle the duplicate `check_content` key (§1.3) by pre-processing the schema before generation.

### 6.6 DRY Integration

- **`DEFAULT_PROFILE_FIELDS`** (ADR-002): Wire into `ChecklistMapper` (shared intermediate→HDF) and `CklbMapper`. The current `ChecklistMapper` hand-declares `attributes/groups/sha256/status/supports` — it is NOT in ADR-002's list of wired mappers and should be.
- **`createHeimdallPassthrough('cklb', ...)`** (ADR-002 / 9go.52): Use the standard passthrough helper.
- **Regen tool** (ADR-002): Add CKLB fixtures to the `regenerate-fixtures.mts` registry. Use the same `omitVersions + toEqual` fixture-comparison pattern as all other mappers.

### 6.7 Testing Strategy

- **Fixture-based regression tests** (primary): CKLB→HDF output compared against known-good baseline via `omitVersions + toEqual`. Same pattern as CKL and all other mappers.
- **Property-based invariant tests**: "every CKLB status maps to a valid HDF status," "every severity maps to a valid impact," "round-trip preserves all 4 mutable fields." These catch enum/mapping gaps fixtures won't.
- **Output schema validation**: Forward mapper output validates against `exec-json.json`. Reverse mapper output validates against `SV3_CKLB_1_0_JSON_SCHEMA.json`.
- **CKL regression gate**: After every shared-layer extraction step, ALL existing CKL fixture tests must pass unchanged. This is the §5.3 byte-for-byte invariant.

---

## 7. Integration with Attestation Engine (ADR-001)

The CKLB converter integrates with the attestation engine (9go epic) at several points:

1. **Import:** CKLB `comments` and `finding_details` fields populate the same HDF `descriptions` that the attestation engine reads. The structured comment format (`CAVEAT :: text\nCOMMENTS :: text`) is identical to CKL — reuse `parseComments`.

2. **Attestation on export:** When exporting HDF back to CKLB, `addAttestationToHDF()` applies attestation records to a clone (ADR-001 §5.4), then the patching approach writes the attested status and comments back into the CKLB. **Explicit card needed:** ADR-001 §5.4.2c lists CKL export (9go.27) but not CKLB. Add a dedicated card for "CKLB export with attestations applied" to prevent this falling through the cracks.

3. **CKL round-trip through CKLB:** A user can import CKL → work in Heimdall → export as CKLB (for SV3). The shared intermediate makes this lossless for mapped fields; CKLB-native fields are synthesized/empty.

4. **Source format badge (9go.48):** `passthrough.heimdall.sourceFormat === 'cklb'` drives the format badge display, same as all other mappers (9go.52).

5. **Attestation status gap (ADR-001 dependency):** ADR-001's `ControlAttestationStatus` enum has only `passed | failed`. ISSOs routinely mark NR controls as Not Applicable ("system lacks this component"). CKLB has `not_applicable` as a first-class status. An ISSO attesting NR→N/A through the attestation engine cannot be represented in the current enum. ADR-001 §3.1.3 #1 flags this but does not resolve it. **This must be resolved before CKLB attestation export works correctly.** Options: extend the enum to include `not_applicable`, or handle the mapping in the export layer.

6. **Finding details preservation on export:** The patching approach preserves the original `finding_details` verbatim from `passthrough.source` unless the ISSO edited it. Export uses the preserved passthrough value, NOT a regenerated parse. This is important for large scan-output blobs — a parse→regenerate path would be lossy.

---

## 8. Edge Cases

### 8.1 `overrides` with `patternProperties`

CKLB `overrides` is `Record<string, {reason?: string} & Record<string, string>>`. Only `severity` is used today. Strategy: type `severity` explicitly; passthrough the entire `overrides` object so future override keys survive round-trip. On override removal (user clears in Heimdall): delete the key from the override object — do not leave stale overrides.

### 8.2 `group_tree` Hierarchy

HDF `profile.groups` is a flat list with member control IDs — not a parent/child tree. CKLB `group_tree` is per-rule ancestry. No faithful HDF target. Store in passthrough, optionally surface the leaf as `tags.gtitle`. Reconstruct from passthrough on reverse.

### 8.3 Multi-STIG Checklists

One HDF profile per STIG, plus a synthesized Parent Profile with `depends[]`. Same as existing CKL mapper. On reverse, the parent profile is skipped.

### 8.4 `size` vs `rules.length`

When `size > rules.length`, the STIG was cherry-picked (not all rules included). Surface as a profile-level note. Do not silently produce a partial profile without indication.

### 8.5 Free-Text Enums

CKLB uses free strings for `role`, `technology_area`, `target_type` where CKL has fixed enums. On CKLB→intermediate: validate against CKL enum values, use if match, else passthrough as-is. On intermediate→CKLB: write directly (CKLB accepts any string). Never silently coerce.

### 8.6 `unknown` Severity + `open` Status Interaction

An `open` rule with `severity: unknown` must NOT get impact 0 — that renders as Not Applicable in Heimdall, hiding a live finding. The severity mapping (§3.2) is conditional on status: `open` + `unknown` → impact 0.1 (visible as a finding); all other statuses + `unknown` → impact 0.

### 8.7 `legacy_ids` Array vs String

See §5.6. The intermediate normalizes to `string[]`. CKL import splits by separator. CKLB passes through directly. CKL export re-joins with `; `. CKLB export uses the array.

### 8.8 Empty/Missing Rule Fields

CKLB `stig_rule` has no `required` fields. A rule with no `status` defaults to `not_reviewed`. A rule with no `comments` or `finding_details` is empty string. The converter must handle all fields defensively with `_.get(rule, field, defaultValue)` style access.

### 8.9 Fresh Export and CKL→CKLB Synthesis (No Passthrough)

**CKLB is a checklist format, not a STIG-only format.** Its structure — rules with a primary key, status, severity, comments, finding details — maps to ANY assessment results. The `group_id` field is an unconstrained string in the schema; it's the rule's primary key, whether that key is `V-230221` (STIG), `1.1` (CIS), `CKV_AWS_41` (Checkov), `CVE-2021-43529` (Twistlock), or `Config.1` (AWS Security Hub). Every HDF source has `control.id` which fills this role.

**Synthesis for required fields:**
- Top-level: `title` (use profile name or filename), `id` (generate UUIDv4), `cklb_version: "1.0"`
- Per STIG (6 required): `stig_name` (from `profile.title`), `display_name` (abbreviated), `stig_id` (from `profile.name`), `release_info` (from `profile.version` or synthesized), `uuid` (generate UUIDv4), `size` (= rules.length)
- Per rule: `uuid` (generate UUIDv4), `group_id` (from `control.id`), `rule_id` (from `tags.rid` or `control.id`), `rule_version` (from `tags.stig_id` or `control.id`)

**All HDF sources map cleanly:**

| Source | control.id → group_id | Has CCIs? | Has NIST? | Status? |
|---|---|---|---|---|
| CKL (STIG) | `V-230221` | ✓ | ✓ | ✓ |
| XCCDF (OpenSCAP) | `xccdf_mil.disa...SV-204393...` | ✓ | ✓ | ✓ |
| CIS AWS Foundations | `1.1` | ✓ | ✓ | ✓ |
| AWS Security Hub | `Config.1`, `S3.2` | ~ | ✓ | ✓ |
| Checkov (Terraform) | `CKV_AWS_41` | ✓ | ✓ | ✓ |
| ScoutSuite (AWS) | `cloudtrail-no-data-logging` | ~ | ✓ | ✓ |
| Nikto (web) | `999986` | ✓ | ✓ | ✓ |
| Snyk (dependency) | `SNYK-JS-ADMZIP-1065796` | ✓ | ✓ | ✓ |
| Twistlock (container) | `CVE-2021-43529` | ✓ | ✓ | ✓ |

SV3 behavior with non-STIG IDs should be verified by test, but the schema imposes no constraints on ID format.

**The `ckl2cklb` composed command** uses this same synthesis path for CKLB-native fields that CKL doesn't carry (`display_name`, `uuid`, `size`, `group_tree`). Add a JSON-schema validation test on fresh output.

### 8.10 CKLB Round-Trip Detection (Deferred)

ADR-001's CKL round-trip detection (reimport after external SV3 editing, detect status/comment changes, create attestation records) is deferred to Phase 2 (ADR-001 card J). **CKLB round-trip detection is similarly deferred.** In v1, when a user reimports a CKLB that was edited in SV3, the edits import as raw description text with no attestation records and no attribution. The multi-reviewer SV3 workflow silently loses audit trail on the SV3 leg. This is acceptable for MVP but must be addressed in Phase 2.

### 8.11 Attestation `explanation` / `frequency` in CKLB

Attestation structured metadata (`explanation`, `frequency`, `updated_by`) has no native CKLB field. On CKLB export, this metadata:
- Survives in the separate annotation bundle export (ADR-001 §3.4.2)
- Impact precision survives via `hdfSpecificData` in `third_party_tools`
- `explanation` can optionally be appended to `comments` for human visibility in SV3

---

## 9. Consequences

### 9.1 Positive

- Heimdall supports both CKL and CKLB — covers legacy and modern DISA workflows
- Round-trip editing with STIG Viewer 3 via the patching approach — field-level fidelity for unmodified rules
- CKL↔CKLB conversion via shared intermediate — lossless for the shared field set (status, severity, CCIs, comments, finding details, target data). CKLB-native fields (`display_name`, `group_tree`, timestamps) are lost on CKLB→CKL — documented.
- Shared domain layer eliminates ~400 lines of would-be duplication
- No DISA schema modification needed — passthrough is HDF-side
- Attestation engine (ADR-001) works with CKLB for all mapped fields
- CKLB is simpler than CKL (no XML/JSONIX) — the converter will be smaller and faster

### 9.2 Negative

- Extraction is a real disentangle of two files — `checklist-mapper.ts` has standalone free functions (clean lift), but `checklist-jsonix-converter.ts` has instance methods on a class (requires shared base class refactor, not just a move). Mitigated by CKL fixture regression gate.
- Domain enum + `Asset` type + base `Vuln` shape relocation from JSONIX types into shared layer requires updating `checklistJsonix.ts` imports and verifying no circular dependencies
- Two `IMPACT_MAPPING` sources must be consolidated during extraction (existing DRY violation)
- `third_party_tools` hijack for `hdfSpecificData` is carried forward from CKL — pragmatic but not ideal
- `unknown` severity + `open` status interaction requires conditional mapping logic
- `ControlAttestationStatus` enum lacks `not_applicable` — blocks a core ISSO attestation workflow until ADR-001 addresses it (needs dedicated card)
- Standalone `.cklb` file does not carry full attestation metadata (frequency, TTL, attribution) — annotation bundle must accompany it for complete audit trail

### 9.3 What's NOT in Scope

- Modifying the CKLB schema or proposing changes to DISA (unnecessary per §4)
- CKLB support in the backend DB (Phase 2 — after the converter exists)
- OSCAL integration (separate format, separate converter)
- Batch/library CKL→CKLB migration tooling (users script the CLI; acceptable for v1)
- CKLB round-trip detection / reimport-and-diff (deferred to Phase 2, §8.10)
- Target data editing in the GUI (read-only in passthrough for v1)
- Extending `ControlAttestationStatus` with `not_applicable` (ADR-001 scope)

---

## 10. Work Order

### Prerequisites (per-phase gates, not global blockers)

| Prerequisite | Blocks |
|---|---|
| SAF team decision: `unknown` severity → impact value | Phase 3+ (forward mapper severity logic) |
| SAF team decision: `hdfSpecificData` storage (third_party_tools vs passthrough) | Phase 4+ (reverse mapper) |
| Obtain real `.cklb` fixture files from STIG Viewer 3 | Phase 3+ (forward mapper tests) |

Phase 1 (extraction) and Phase 2 (types) need none of these and can start immediately.

### Implementation

| Phase | Scope | Depends on | Est | Notes |
|---|---|---|---|---|
| 1a | Relocate domain enums + `Asset` + base `Vuln` shape + transitive deps (`Status`, `StigdatumElement`, `Vulnattribute`) from `checklistJsonix.ts` to `checklist-common/types.ts`. Update `checklistJsonix.ts` to re-import. Verify CKL fixtures. | — | sp:3 | Resolves §5.4. Smallest move, highest risk. |
| 1b-i | Extract free functions from `checklist-mapper.ts` into `checklist-common/`: `parseComments`, `parseFindingDetails`, `checkMessage`, `transformImpact`, `computeSeverity`, `findSeverity`/`findSeverityOverride`, `cciRef`/`nistTag`, `getAttributes`, `getHdfSpecificDataAttribute`, `getChecklistObjectFromHdf`, regex constants, CCI_NIST_TWO_WAY_MAPPER. Export previously-private functions. Add re-exports. Verify CKL fixtures. | 1a | sp:3 | True lift — these are standalone functions. |
| 1b-ii | Extract `ChecklistJsonixConverter` instance methods into shared `ChecklistConverterBase` base class in `checklist-common/`. Both CKL converter and CKLB converter will extend this base. Methods: `controlsToVulns`, `computeImpact`, `getComments`, `getFindingDetails`, `severityMap`, `getStatus`, `matchNistToCcis`, `hdfToIntermediateObject`, `addHdfControlSpecificData`, `addHdfProfileSpecificData`, `getReleaseInfo`, `updateChecklistWithMetadata`. Consolidate `IMPACT_MAPPING` + `ImpactMapping` into one source. Verify CKL fixtures. | 1a | sp:5 | Heaviest extraction — class refactor, not just move. |
| 1c | Build status vocabulary normalization: CKLB snake_case ↔ `StatusMapping` enum ↔ HDF display strings. Dedicated tests covering all 3 vocabularies (§5.5). Wire `DEFAULT_PROFILE_FIELDS` into `ChecklistMapper`. | 1b | sp:2 | |
| 2 | CKLB TypeScript types generated from JSON schema via `json-schema-to-typescript` (§6.5) | — (parallel with Phase 1) | sp:1 | |
| 3 | CKLB forward mapper (CKLB → HDF) + fixtures + property-based + output-schema-validation tests. Add to regen tool registry. | Phase 1, 2, `.cklb` fixtures, severity decision | sp:5 | |
| 4 | CKLB reverse mapper (HDF → CKLB) — unconditional overlay patching for round-trip (§2.3). Output validates against CKLB schema. | Phase 3, hdfSpecificData decision | sp:5 | |
| 5 | CKLB reverse mapper — fresh export (template/synthesis approach, §8.9) + SV3 acceptance test | Phase 3 | sp:3 | Also covers `ckl2cklb` synthesis path. |
| 6 | Format detection + `index.ts` + `createHeimdallPassthrough('cklb')` + version handling (§6.2) | Phase 3 | sp:2 | |
| 7 | SAF CLI commands: `cklb2hdf`, `hdf2cklb`, `ckl2cklb`, `cklb2ckl` | Phase 3-5 | sp:3 | |
| 8 | Heimdall GUI: import/export CKLB options + CKLB export-with-attestations card. **ADR-001 dependency:** `ControlAttestationStatus` must include `not_applicable` before attestation→CKLB export works (create ADR-001 card). | Phase 3-5, ADR-001 | sp:5 | |
| 9 | Integration tests: CKLB round-trip (multi-cycle), attestation engine integration, CKL↔CKLB conversion | Phase 4, ADR-001 | sp:3 | |

**Total: ~sp:40, ~180 min Claude-pace**

---

## 11. Review Findings Log

This ADR was reviewed by 10 independent agents across 2 rounds on 2026-06-22. Roles: architecture, schema mapping, round-trip stress test, CKL code audit, compliance/ISSO workflow, adversarial doubter, external observer, KISS/minimizer, DRY/maintainability, best practices/standards.

### Round 1 (5 agents, 17 findings)

| # | Finding | Source | Resolution |
|---|---|---|---|
| 1 | `rule_version` matching ambiguous across STIGs | round-trip | §2.3: match by `control.id` ↔ `group_id` scoped by profile→STIG |
| 2 | `open` + `unknown` severity = hidden finding | schema | §3.2 + §8.6: conditional mapping based on status |
| 3 | Shared types depend back on JSONIX types | code audit | §5.4: relocate domain enums + Asset + base Vuln to `checklist-common/` |
| 4 | §5.1 wrong file locations | architecture + code audit | §5.1: corrected with actual line numbers |
| 5 | §3.1 "identical in both directions" wrong | schema | §3.1: reworded with reverse disambiguation |
| 6 | "CKL↔CKLB for free" oversold | architecture | §2.1: qualified — lossless for shared fields only |
| 7 | 4 passthrough fields missing | schema | §3.3 + §3.4: added `title`, `target_key`, `stig_ref`, per-rule `reference_identifier` |
| 8 | Patching must be conditional (dirty-tracked) | round-trip | §2.3: simplified to unconditional overlay (unchanged value = same value) |
| 9 | `passed\|failed` attestation enum lacks `not_applicable` | compliance | §7 item 5 + §10 Phase 8: ADR-001 dependency, needs own card |
| 10 | Checklist family outside BaseResults by design | architecture | §2.4: explicit statement |
| 11 | CKLB round-trip detection undefined | compliance | §8.10: deferred to Phase 2 |
| 12 | Prerequisites should be per-phase | architecture | §10: restructured as per-phase gates |
| 13 | Need explicit CKLB export-with-attestations card | compliance | §7 item 2 + §10 Phase 8 |
| 14 | `check_content_ref` → HDF `refs[]` | schema | §3.3: mapped to `refs[]` instead of passthrough |
| 15 | `legacy_ids` array vs string type mismatch | code audit | §5.6 + §8.7: normalize to array in intermediate |
| 16 | `StatusMapping` uses CKL vocabulary — CKLB needs translation | architecture | §5.5: three-vocabulary normalization with dedicated tests |
| 17 | Attestation metadata has no native CKLB field | round-trip | §8.11: standalone .cklb is not a complete attestation record |

### Round 2 (10 agents — added doubter, external observer, KISS/minimizer, DRY, best practices)

| # | Finding | Source | Resolution |
|---|---|---|---|
| 18 | Rule `uuid` is in passthrough only, not on HDF controls — can't match by uuid | doubter | §2.3: match by `control.id` ↔ `group_id`, not uuid |
| 19 | Field-level dirty-tracking doesn't exist, isn't needed | doubter + KISS | §2.3: unconditional overlay of 4 fields (unchanged = same value) |
| 20 | §4 "unnecessary" too strong re: attestation metadata through SV3 | doubter | §4: softened — "no schema change for v1; standalone .cklb drops attestation audit trail" |
| 21 | Instance methods on ChecklistJsonixConverter can't be "extracted" — need base class | architecture v2 | §5.4a: `ChecklistConverterBase` shared base class approach |
| 22 | `Asset` type, `checkMessage`, `getStatus`:172, regex constants missing from extraction | code audit v2 | §5.4b: all added with locations |
| 23 | Two `IMPACT_MAPPING`s (DRY violation within shared layer) | DRY | §5.4b: consolidate into one source in `status-severity.ts` |
| 24 | `StatusMapping` enum values are HDF words, not CKL words — ADR conflated them | compliance v2 | §5.5: three-vocabulary table with actual enum values |
| 25 | No `not_applicable` attestation enum card exists in either ADR | compliance v2 | §10 Phase 8: explicit ADR-001 card dependency |
| 26 | Specify type-generation tooling (json-schema-to-typescript) | standards | §6.5: added |
| 27 | Name error strategy (best-effort + warn, never silent drop) | standards | §6.4: added |
| 28 | Add CKLB version-handling policy | standards | §6.2: added |
| 29 | Add property-based + output-schema-validation tests | standards | §6.7: testing strategy added |
| 30 | Wire `DEFAULT_PROFILE_FIELDS` into ChecklistMapper + CklbMapper | DRY | §6.6: added |
| 31 | Add CKLB to regen tool registry | DRY | §6.6: added |
| 32 | Fresh CKLB export works for ALL HDF sources (not STIG-only) | domain review | §8.9: CKLB is a checklist format; `group_id` = control primary key in any scheme |

### Findings assessed and rejected

| Finding | Source | Why rejected |
|---|---|---|
| Skip extraction entirely (import from ckl-mapper directly) | KISS | User decision: do it right once, no follow-up refactors |
| Fresh CKLB export restricted to STIG-origin HDF | multiple | Incorrect — CKLB `group_id` is unconstrained; any control ID works |
| `legacy_ids` array normalization breaks CKL byte-for-byte | code audit | HDF tags are `additionalProperties: true`; string→array is non-breaking. Regen CKL fixtures. |
| Runtime ajv validation of input CKLB | standards | No other converter in the repo does this. Fingerprint detection + defensive access is consistent. |

---

## 12. References

- CKLB JSON Schema: `SV3_CKLB_1_0_JSON_SCHEMA.json` (in repo root, from [cyber.mil](https://www.cyber.mil/stigs/downloads))
- Existing CKL mapper: `libs/hdf-converters/src/ckl-mapper/`
- InSpec JSON schema: `libs/inspecjs/schemas/exec-json.json`
- ADR-001: GUI Attestation & Comment Engine (`docs/adr-001-attestation-comment-engine.md`)
- ADR-002: DRY hdf-converters (`docs/adr-002-dry-hdf-converters.md`)
- GitHub issues: #5603, #7271, #7733
- HDF Mapper Creation Guide: [SAF Wiki](https://github.com/mitre/saf/wiki/HDF-Mapper-and-Converter-Creation-Guide-(for-SAF-CLI-&-Heimdall2))
