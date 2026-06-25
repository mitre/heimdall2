# ADR-003: CKLB (STIG Viewer 3 JSON Checklist) Converter — Forward, Reverse, and CKL Adapter

**Status:** Draft (reviewed by 10 independent agents across 2 rounds + Amndeep7, wdower, ejaronne feedback incorporated)
**Date:** 2026-06-22 (revised 2026-06-25)
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
| **HDF / OHDF** | Heimdall Data Format / OASIS HDF — JSON output format from InSpec and other scanners |
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
- **#7271**: "Perform schema mapping between latest CKLB format and OHDF." Assigned, never completed. The mapping is provided in §3 of this ADR.
- **#7733** (RCramm123): "SAFcli to convert between cklb and ckl files." Answered by the CKLB-as-canonical architecture in §5.

### 1.3 The CKLB Schema (SV3 v1.0)

The schema defines a JSON structure with:
- **Top level:** `title` (filename, **required**), `id` (UUID, **required**), `cklb_version` ("1.0"), `target_data`, `stigs[]`, `active`, `mode`, `has_path`
- **Per STIG:** `stig_name`, `display_name`, `stig_id`, `release_info`, `uuid`, `reference_identifier`, `size`, `rules[]`
- **Per rule (`stig_rule`):** 35+ fields including `group_id`, `rule_id`, `rule_version`, `severity`, `status`, `comments`, `finding_details`, `overrides`, `ccis[]`, `legacy_ids[]`, `group_tree[]`, `createdAt`, `updatedAt`, `uuid`, `stig_uuid`, `group_id_src`, `rule_id_src`, `STIGUuid`
- **`additionalProperties: false`** at every level — strict schema, no extension points
- **No `required` fields on `stig_rule`** — all rule fields are optional. Converter must handle missing fields defensively.

> **Note:** The field lists above must be verified against the actual `SV3_CKLB_1_0_JSON_SCHEMA.json` during implementation (Phase 1). Amndeep7 flagged missing fields used internally by SV3 — the generated types (§6.5) will be authoritative.

**Schema bug:** `check_content` appears twice (lines 250 and 286). JSON forbids duplicate keys; parsers keep the last. Real CKLB files have a single field. Report upstream to DISA.

### 1.4 Key Insight

**CKLB is structurally the existing CKL intermediate object with renamed fields and no XML layer.** Every piece of format-agnostic logic the CKL mapper already has — status mapping, severity↔impact, CCI↔NIST, finding-details parsing, structured-comment parsing, multi-STIG parent-profile synthesis — applies unchanged to CKLB. The difference is serialization: CKL needs XML parsing; CKLB is `JSON.parse`/`JSON.stringify`.

> *"This is what I've been saying this entire time. So instead of having to continue dealing with the intermediate object let's replace it outright with just CKLB instead."* — Amndeep7 (PR #8283 review, 2026-06-25)

The logical conclusion: **CKLB should BE the canonical intermediate format.** The CKL mapper becomes a thin XML adapter that converts CKL XML to/from CKLB objects, then uses the shared CKLB→HDF path. No custom third intermediate needed.

---

## 2. Decision

Build a CKLB converter (forward + reverse) where **CKLB is the canonical checklist intermediate format**. The CKL mapper becomes a thin XML adapter that converts CKL XML ↔ CKLB objects, then delegates to the shared CKLB↔HDF conversion path. This eliminates the need for a custom intermediate type system or complex class extraction.

### 2.1 Architecture: CKLB as Canonical Intermediate (Option D)

```
FORWARD (to HDF):

  CKLB file ──→ JSON.parse ──→ CKLB object ──→ CKLB→HDF mapper ──→ HDF
                                                    ▲
  CKL file  ──→ XML parse  ──→ CKL→CKLB    ────────┘
                (fast-xml-      adapter
                 parser)       (field rename +
                                restructure)

REVERSE (from HDF):

  HDF ──→ HDF→CKLB mapper ──→ CKLB object ──→ JSON.stringify ──→ CKLB file
                                    │
                                    └──→ CKLB→CKL  ──→ XML build ──→ CKL file
                                          adapter      (fast-xml-
                                         (field rename   parser or
                                          + restructure)  JSONIX)
```

**CKL↔CKLB conversion:** Falls out naturally — `CKL→adapter→CKLB object→JSON.stringify` and `CKLB object→adapter→CKL XML`. No HDF round-trip needed for format conversion.

### 2.2 Why This Architecture (and Why Not the Alternatives)

**Option A (fully standalone CKLB mapper):** Duplicates ~400 lines of validated severity/status/CCI/comment logic. Guarantees the two mappers drift over time. Violates DRY. Rejected.

**Option B (custom shared intermediate extracted from CKL mapper):** Creates a THIRD format — neither CKL nor CKLB but a TypeScript abstraction of both. Requires extracting ~20 functions from `checklist-jsonix-converter.ts` into a shared base class, relocating JSONIX-coupled domain enums, and solving the instance-method extraction problem (instance methods on `ChecklistJsonixConverter` can't be moved without a shared base class refactor). Amndeep7 called this "a massive headache during the refactor process." The ADR's own §1.4 says CKLB already IS this intermediate — so why create a third one? Rejected.

**Option C (CKLB→CKL→HDF, convert internally):** Forces CKLB through XML's lossy `STIG_DATA` key-value representation. Discards CKLB-native fields. Strictly more lossy and more fragile. Rejected.

**Option D (CKLB as canonical intermediate — chosen):** CKLB IS the intermediate that Option B would have created. CKL becomes a thin adapter. No custom type system, no class extraction, no JSONIX dependency in the shared layer. CKL is DISA's legacy format; CKLB is the going-forward format. When CKL eventually sunsets, drop the XML adapter — the core stays clean.

### 2.3 Round-Trip Export: The Patching Approach

For CKLB files that were imported into Heimdall and are being exported back:

1. Read the original CKLB from `passthrough.source` (stored at import time)
2. For each HDF profile, identify the corresponding STIG by `profile.name` → `stig.stig_id`. Guard: if a checklist contains the same `stig_id` twice (re-imported benchmark), warn and match by array position.
3. Within that STIG, match HDF controls to CKLB rules by `control.id` ↔ `rule.group_id` (scoped within the STIG). Note: rule `uuid` is in passthrough only, not on the HDF control — it cannot be used as a matching key. `group_id` is unique within a STIG.
4. **Unconditionally overlay the 4 mutable fields** from current HDF state onto the matched CKLB rule: `status`, `comments`, `finding_details`, `overrides.severity`. An unchanged value overlaid = the same value, so per-field dirty-tracking is not needed for the overlay itself. This avoids coupling the export path to the annotation store's dirty-tracking granularity.
5. For override **removal** (no `severityoverride` tag on the HDF control): delete `overrides.severity` from the CKLB rule. Do not leave stale overrides.
6. `JSON.stringify()` — valid CKLB, correct values for all 4 fields, no reconstruction needed.

**Multi-cycle invariant:** On reimport, the patched CKLB output becomes the next `passthrough.source`. Each cycle's overlay is idempotent (same HDF state → same CKLB values), so divergence does not accumulate.

This is simpler and more reliable than reconstructing a CKLB from HDF fields. The full HDF→CKLB path is only needed for "fresh export" (HDF that was never CKLB).

### 2.4 Relationship to BaseResults (ADR-002)

The checklist mapper family is **bidirectional** — both `toHdf()` and `toCklb()`/`toCkl()`. ADR-002's `BaseResults<TInput, TOutput>` is forward-only (`toHdf()`). The checklist family sits outside the BaseResults pattern by design. Under Option D this is even cleaner: the CKLB mapper has its own `CklbResults` entry point, the CKL adapter wraps it with XML handling. Neither needs `BaseResults`.

### 2.5 Backward Compatibility

> *"If someone loads an old OHDF derived from an old CKL, will the process be backward compatible?"* — ejaronne (PR #8283, 2026-06-25)

**Yes.** Option D changes the *internal implementation* of the CKL mapper, not the HDF output format. Existing HDF files produced by the old CKL mapper import identically into Heimdall — they are valid HDF with CKL passthrough data. The CKL adapter produces the same HDF output as the current CKL mapper; only the internal pipeline changes (XML → CKLB object → HDF instead of XML → JSONIX intermediate → HDF). The CKL fixture regression tests (§6.7) enforce byte-for-byte output equivalence.

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
| `legacy_ids[]` | `tags.Legacy_ID` | keep as array (see §5.5 for type handling) |
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
| `check_content_ref` | `refs[]` | map `{name, href}` → HDF `refs` entry |
| `target_key` | `tags.TargetKey` | direct |
| `stig_ref` | `tags.STIGRef` | direct |
| `reference_identifier` (per-rule) | `tags.reference_identifier` | direct |

### 3.4 Fields with No HDF Equivalent (Passthrough)

These fields are preserved in `passthrough.source` for round-trip fidelity. **All fields present in the CKLB schema must be brought through** — we do not selectively drop data.

**Top level:** `title` (**required** — round-trip produces invalid CKLB without it), `id`, `cklb_version`, `active`, `mode`, `has_path`

**Per STIG:** `display_name`, `uuid`, `reference_identifier` (STIG-level), `size`

**Per rule:** `uuid`, `stig_uuid`, `group_id_src`, `rule_id_src`, `group_tree[]`, `createdAt`, `updatedAt`, full `overrides` object (preserves future override keys beyond `severity`), `STIGUuid`

> **Implementation note:** The generated CKLB types (§6.5) are authoritative for the complete field list. If the schema has fields not listed above, they MUST be brought through in passthrough — no silent drops.

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
         → Export: read passthrough.source, patch mutable fields, JSON.stringify
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
  raw?: CklbDocument,          // entire original (shouldIncludeRaw mode only)
}
```

### 4.1 Passthrough Key Contract (Cross-ADR Requirement)

**CKL and CKLB use different passthrough keys. This is intentional and must not be unified.**

| Source format | Passthrough key | Structure | Consumers |
|---|---|---|---|
| CKL (XML) | `passthrough.checklist` | `{asset: {...}, stigs: [{vulns: [...]}]}` | ExportCKLModal.vue (13 direct accesses), checklist-mapper.ts `hasChecklist` |
| CKLB (JSON) | `passthrough.source` | `{target_data: {...}, stigs: [{rules: [...]}]}` | CKLB reverse mapper (§2.3 patching) |

**Dispatch:** `passthrough.heimdall.sourceFormat` (set by `createHeimdallPassthrough`) tells export code which key to read. CKL export reads `passthrough.checklist`. CKLB export reads `passthrough.source`. No format checks shape-incompatible data.

**Backward compatibility:** Existing HDF files with `passthrough.checklist` from the current CKL mapper continue working unchanged. The CKL adapter (1af.17) does NOT change the passthrough key for CKL-origin files — it keeps `passthrough.checklist` with the existing shape. Only CKLB-origin files use `passthrough.source`.

### 4.2 `hdfSpecificData` Strategy

The existing CKL mapper stores HDF-specific data (impact precision, critical/none severity, control code) as a JSON blob inside the `third_party_tools` string field. This allows HDF data to survive a CKL round-trip.

CKLB has the same `third_party_tools` field (string, per rule). **For v1, use the same mechanism** — one code path for both formats. This is a pragmatic choice, not an ideal one; `third_party_tools` is described as "Third_Party_Tools from origin STIG" and we're repurposing it.

**Decision for SAF team:** Should v2 store `hdfSpecificData` in passthrough instead, keeping `third_party_tools` clean? The tradeoff: cleaner CKLB output vs. diverging from the CKL code path.

---

## 5. Architecture Under Option D

### 5.1 CKLB as Canonical — What This Means

Under Option D, CKLB is the canonical checklist format. The domain logic (status mapping, severity conversion, CCI→NIST, comment parsing, finding details parsing, hdfSpecificData handling) lives with the CKLB mapper. The CKL mapper becomes an adapter: it converts CKL XML ↔ CKLB objects and delegates all domain logic to the CKLB path.

**This eliminates:**
- The custom `ChecklistObject`/`ChecklistVuln`/`ChecklistStig` intermediate types
- The `checklist-common/` shared extraction (Option B's ~sp:11 of risky refactoring)
- The `ChecklistConverterBase` shared base class
- JSONIX type coupling in shared logic (domain enums no longer need to be relocated)
- Two separate `IMPACT_MAPPING` sources (consolidate into one in the CKLB mapper)

**This preserves:**
- All existing domain logic (status/severity/CCI/comment functions) — code moves, not rewrites
- CKL fixture regression tests as the backward-compat gate
- JSONIX for CKL XML output (reverse path only — see §5.4)

### 5.2 File Structure

```
libs/hdf-converters/src/
  cklb-mapper/                         # NEW — canonical checklist converter
    cklb-types.ts                      # Generated from CKLB JSON schema (§6.5)
    cklb-mapper.ts                     # CklbMapper: CKLB object ↔ HDF conversion
                                       # Contains all domain logic:
                                       #   status mapping, severity↔impact,
                                       #   CCI↔NIST, comment parsing,
                                       #   finding details, hdfSpecificData
    cklb-results.ts                    # CklbResults: entry point (toHdf + toCklb)
    index.ts                           # re-exports
  ckl-mapper/                          # EXISTING — becomes a thin XML adapter
    ckl-to-cklb-adapter.ts             # NEW: CKL XML → CKLB object
                                       #   fast-xml-parser for XML reading
                                       #   field rename + STIG_DATA restructure
    cklb-to-ckl-adapter.ts             # NEW: CKLB object → CKL XML
                                       #   JSONIX or fast-xml-parser builder
    checklist-mapper.ts                # MODIFIED: delegates to cklb-mapper
    checklist-jsonix-converter.ts      # RETAINED for CKL XML output (Phase 2 removal candidate)
    checklistJsonix.ts                 # RETAINED for CKL XML output
    jsonixMapping.ts                   # RETAINED for CKL XML output
```

### 5.3 Domain Logic Migration

The domain logic currently lives in two CKL mapper files. Under Option D, it moves to `cklb-mapper/` where it operates on CKLB types directly:

**From `checklist-jsonix-converter.ts` → `cklb-mapper.ts`:**
- `StatusMapping` enum → operates on CKLB snake_case statuses directly
- `IMPACT_MAPPING` → consolidated with `ImpactMapping` from checklist-mapper.ts
- `computeImpact`, `addHdfControlSpecificData`, `addHdfProfileSpecificData`
- `controlsToVulns` → `controlsToRules` (CKLB naming)
- `getComments`, `getFindingDetails`, `getStatus` (reverse)
- `severityMap`, `matchNistToCcis`, `getReleaseInfo`
- `hdfToIntermediateObject` → `hdfToCklbObject`
- `updateChecklistWithMetadata`

**From `checklist-mapper.ts` → `cklb-mapper.ts`:**
- `transformImpact`, `computeSeverity`, `findSeverity`/`findSeverityOverride`
- `cciRef`, `nistTag`
- `parseComments`, `parseFindingDetails`, `checkMessage`
- `getAttributes`, `getHdfSpecificDataAttribute`
- `getChecklistObjectFromHdf` → `getCklbObjectFromHdf`
- `ChecklistMapper` → core logic absorbed into `CklbMapper`
- Module-level regex constants, `CCI_NIST_TWO_WAY_MAPPER` singleton

**Stays in `ckl-mapper/`:**
- `ChecklistJsonixConverter` class (XML↔JSONIX — only for CKL reverse export)
- JSONIX type definitions, mapping config
- `ChecklistResults` — modified to: parse CKL XML → adapter → CKLB object → delegate to `CklbMapper`

**Already format-agnostic (no move needed):**
- `description-editing.ts` — `setControlDescription`, `syncChecklistVulnComments`, etc.
- `CciNistMapping.ts` — already standalone

### 5.4 CKL XML Adapter Design

#### 5.4.1 Forward: CKL XML → CKLB Object

The CKL XML structure uses `<STIG_DATA>` key-value pairs for rule attributes, while CKLB uses direct JSON properties. The adapter handles this structural transformation:

```
CKL XML:
  <VULN>
    <STIG_DATA>
      <VULN_ATTRIBUTE>Vuln_Num</VULN_ATTRIBUTE>
      <ATTRIBUTE_DATA>V-257777</ATTRIBUTE_DATA>
    </STIG_DATA>
    <STATUS>NotAFinding</STATUS>
  </VULN>

CKLB Object:
  { group_id: "V-257777", status: "not_a_finding" }
```

**Implementation:**
1. Parse CKL XML with `fast-xml-parser` (same library as XCCDF, BurpSuite, and 30+ other mappers)
2. Extract `<ASSET>` → `target_data` (field rename map)
3. Extract `<STIG_INFO>/<SI_DATA>` key-value pairs → STIG header fields
4. Extract `<VULN>/<STIG_DATA>` key-value pairs → rule direct properties
5. Map status vocabulary: `NotAFinding` → `not_a_finding`, `Open` → `open`, etc.
6. Map `<SEVERITY_OVERRIDE>` + `<SEVERITY_JUSTIFICATION>` → `overrides.severity`
7. Output: valid CKLB object (passes CKLB schema validation)

**Why fast-xml-parser, not JSONIX:** JSONIX is only used by CKL — every other XML mapper uses fast-xml-parser. The `isArray` option handles the arrays-vs-single-element quirk. This eliminates a dependency that only one mapper uses.

#### 5.4.2 Reverse: CKLB Object → CKL XML

For HDF→CKL export, the CKLB object must be serialized as CKL XML. Two options:

**Option 1 (Phase 1 — retain JSONIX for reverse):** Keep the existing `ChecklistJsonixConverter` for XML output. The CKLB→CKL adapter maps CKLB fields to the JSONIX intermediate, then JSONIX serializes to XML. Lower risk — the XML output is unchanged.

**Option 2 (Phase 2 — fast-xml-parser builder for reverse):** Replace JSONIX entirely. Build CKL XML from a template using fast-xml-parser's `XMLBuilder`. Higher risk but eliminates the JSONIX dependency completely.

**Decision:** Option 1 for the main CKLB epic (cards 1af.14–1af.17). Option 2 is carded as follow-on **1af.18** (sp:5, P2) — replaces JSONIX with fast-xml-parser for both CKL forward (XMLParser) and reverse (XMLBuilder), removes `@mitre/jsonix` dependency entirely. CKL fixture regression tests gate correctness in both phases. This is a dependency cleanup, not an architecture change — JSONIX is already isolated inside the CKL adapter by the time 1af.18 runs.

### 5.5 Status Vocabulary and Type Handling

CKL and CKLB use the same DISA vocabulary — both come from the same agency. The only difference is casing:

| CKL (XML) | CKLB (JSON) | Meaning |
|-----------|-------------|---------|
| `NotAFinding` | `not_a_finding` | Passed |
| `Open` | `open` | Failed |
| `Not_Applicable` | `not_applicable` | Not Applicable |
| `Not_Reviewed` | `not_reviewed` | Not Reviewed |

The CKLB mapper uses CKLB vocabulary natively. The CKL adapter translates on entry/exit.

**`legacy_ids` type handling:** CKL's `legacyId` is `string` (`;`-joined). CKLB's `legacy_ids` is `string[]`. The CKLB mapper normalizes to `string[]` internally. The CKL adapter splits by separator on input and re-joins on output.

### 5.6 Migration Discipline

The CKL adapter produces the same HDF output as the current CKL mapper — the existing CKL test fixtures are the regression gate. This is a pipeline change, not a behavior change.

**External call sites are minimal:** `ChecklistResults` is imported in `apps/frontend/src/store/report_intake.ts`, `ExportCKLModal.vue`, and tests — all via `index.ts` `export *`. Re-exports preserve them.

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
- Composed commands: `ckl2cklb` (CKL→adapter→CKLB object→serialize), `cklb2ckl` (CKLB→adapter→CKL XML)

### 6.4 Error Strategy

**Best-effort with warnings, never silent drop.** A converter that silently swallows malformed rules can hide compliance findings — unacceptable for a security tool.

- **Fail-fast:** Missing required top-level fields (`title`, `id`) on export = error with clear message
- **Best-effort + warn:** Missing optional rule fields = default + log warning (e.g., missing `status` defaults to `not_reviewed` with warning "Rule {group_id} has no status — defaulting to not_reviewed")
- **Never silent drop:** A rule with unrecognized fields or unexpected values is still converted — unknown fields go to passthrough, unexpected enum values are preserved as-is with a warning
- **Validation on import:** Verify the two required top-level fields (`title`, `id`). Validate `status` enum values against the known set; warn on unrecognized but don't reject.

### 6.5 CKLB Type Generation

Generate TypeScript types from the CKLB JSON schema using `json-schema-to-typescript` (or `quicktype`). Do NOT hand-type the 35+ field interface — hand-typed types drift from the schema silently. The generated types ARE the canonical intermediate types under Option D.

```bash
npx json-schema-to-typescript SV3_CKLB_1_0_JSON_SCHEMA.json -o src/cklb-mapper/cklb-types.ts
```

Check the generated file into source control. Regenerate when DISA publishes a new schema version. Handle the duplicate `check_content` key (§1.3) by pre-processing the schema before generation.

> **Regen tool** (ADR-002): The fixture regeneration tool at `libs/hdf-converters/scripts/regenerate-fixtures.mts` supports `--validate`, `--dry-run`, `--revert`, and size guards for safe mapper refactoring. Add CKLB fixtures to the registry. Use the same `omitVersions + toEqual` fixture-comparison pattern as all other mappers.

### 6.6 DRY Integration

- **`DEFAULT_PROFILE_FIELDS`** (ADR-002): Wire into `CklbMapper` and the CKL adapter's HDF output path.
- **`createHeimdallPassthrough('cklb', ...)`** (ADR-002 / 9go.52): Use the standard passthrough helper.
- **Regen tool** (ADR-002): Add CKLB fixtures to the `regenerate-fixtures.mts` registry.

### 6.7 Testing Strategy

- **Fixture-based regression tests** (primary): CKLB→HDF output compared against known-good baseline via `omitVersions + toEqual`. Same pattern as CKL and all other mappers.
- **CKL regression gate**: After every change to the CKL adapter or domain logic, ALL existing CKL fixture tests must pass unchanged. This enforces §2.5 backward compatibility.
- **Property-based invariant tests**: "every CKLB status maps to a valid HDF status," "every severity maps to a valid impact," "round-trip preserves all 4 mutable fields." These catch enum/mapping gaps fixtures won't.
- **Output schema validation**: Forward mapper output validates against `exec-json.json`. Reverse mapper output validates against `SV3_CKLB_1_0_JSON_SCHEMA.json`.

---

## 7. Attestation Engine Integration (ADR-001)

> **Scope note (per Amndeep7 review):** The CKLB converter is a standalone feature. Attestation integration is wired through the existing export infrastructure (ADR-001 §5.4) and does not add CKLB-specific complexity. This section documents the integration points, not the attestation design — see ADR-001 for that.

1. **Import:** CKLB `comments` and `finding_details` fields populate the same HDF `descriptions` that the attestation engine reads. The structured comment format (`CAVEAT :: text\nCOMMENTS :: text`) is identical to CKL — reuse `parseComments`.

2. **Export with attestations:** Same clone→apply→serialize pattern as all other formats (ADR-001 §5.4.2c). `addAttestationToHDF(clone, attestations)` runs before `toCklb()` serialization. **Needs a dedicated card** — ADR-001 §5.4.2c lists CKL (9go.27) but not CKLB.

3. **Source format badge:** `passthrough.heimdall.sourceFormat === 'cklb'` drives the format badge (9go.48/9go.52).

4. **`ControlAttestationStatus` gap:** The enum has only `passed | failed`. CKLB has `not_applicable` as a first-class status. An ISSO attesting NR→N/A cannot be represented. This must be resolved in ADR-001 before CKLB attestation export works correctly.

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

CKLB uses free strings for `role`, `technology_area`, `target_type` where CKL has fixed enums. On CKLB→HDF: validate against CKL enum values, use if match, else passthrough as-is. On HDF→CKLB: write directly (CKLB accepts any string). Never silently coerce.

### 8.6 `unknown` Severity + `open` Status Interaction

An `open` rule with `severity: unknown` must NOT get impact 0 — that renders as Not Applicable in Heimdall, hiding a live finding. The severity mapping (§3.2) is conditional on status: `open` + `unknown` → impact 0.1 (visible as a finding); all other statuses + `unknown` → impact 0.

### 8.7 `legacy_ids` Array vs String

See §5.5. The CKLB mapper normalizes to `string[]`. CKL adapter splits by separator on input. CKL adapter re-joins with `; ` on output. CKLB uses the array directly.

### 8.8 Empty/Missing Rule Fields

CKLB `stig_rule` has no `required` fields. A rule with no `status` defaults to `not_reviewed`. A rule with no `comments` or `finding_details` is empty string. The converter must handle all fields defensively with `_.get(rule, field, defaultValue)` style access.

### 8.9 Fresh Export and CKL→CKLB Synthesis (No Passthrough)

**CKLB is a checklist format, not a STIG-only format.** Its structure — rules with a primary key, status, severity, comments, finding details — maps to ANY assessment results. The `group_id` field is an unconstrained string in the schema; it's the rule's primary key, whether that key is `V-230221` (STIG), `1.1` (CIS), `CKV_AWS_41` (Checkov), `CVE-2021-43529` (Twistlock), or `Config.1` (AWS Security Hub). Every HDF source has `control.id` which fills this role.

**Synthesis for required fields:**
- Top-level: `title` (use profile name or filename), `id` (generate UUIDv4), `cklb_version: "1.0"`
- Per STIG (6 required): `stig_name` (from `profile.title`), `display_name` (abbreviated), `stig_id` (from `profile.name`), `release_info` (from `profile.version` or synthesized), `uuid` (generate UUIDv4), `size` (= rules.length)
- Per rule: `uuid` (generate UUIDv4), `group_id` (from `control.id`), `rule_id` (from `tags.rid` or `control.id`), `rule_version` (from `tags.stig_id` or `control.id`)

**The `ckl2cklb` composed command** uses the CKL→adapter→CKLB object path directly. No HDF round-trip. CKLB-native fields (`display_name`, `uuid`, `group_tree`) are synthesized for CKL-origin data. Add a JSON-schema validation test on output.

### 8.10 CKLB Round-Trip Detection (Deferred)

ADR-001's CKL round-trip detection (reimport after external SV3 editing, detect status/comment changes, create attestation records) is deferred to Phase 2 (ADR-001 card J). **CKLB round-trip detection is similarly deferred.** In v1, when a user reimports a CKLB that was edited in SV3, the edits import as raw description text with no attestation records and no attribution. This is acceptable for MVP but must be addressed in Phase 2.

### 8.11 Attestation `explanation` / `frequency` in CKLB

Attestation structured metadata (`explanation`, `frequency`, `updated_by`) has no native CKLB field. On CKLB export, this metadata:
- Survives in the separate annotation bundle export (ADR-001 §3.4.2)
- Impact precision survives via `hdfSpecificData` in `third_party_tools`
- `explanation` can optionally be appended to `comments` for human visibility in SV3

---

## 9. Consequences

### 9.1 Positive

- Heimdall supports both CKL and CKLB — covers legacy and modern DISA workflows
- CKLB as canonical intermediate eliminates custom type system — uses the official DISA format
- CKL becomes a thin XML adapter — simpler, less code, lower risk than class extraction
- No JSONIX dependency in the CKLB path — standard `JSON.parse`/`JSON.stringify`
- Round-trip editing with STIG Viewer 3 via the patching approach
- CKL↔CKLB conversion falls out of the architecture — no HDF round-trip needed
- Generated types from DISA schema — no hand-typed drift
- Backward compatible — existing CKL→HDF users see identical output
- When CKL eventually sunsets, drop the XML adapter — the core stays clean
- Aligns with DISA's direction (CKLB is the going-forward format)

### 9.2 Negative

- CKL adapter must handle `STIG_DATA` key-value pair extraction (structural, not just rename)
- CKL reverse path retains JSONIX dependency in Phase 1 (can be removed in Phase 2)
- `third_party_tools` hijack for `hdfSpecificData` is carried forward from CKL
- `unknown` severity + `open` status interaction requires conditional mapping logic
- `ControlAttestationStatus` enum lacks `not_applicable` — blocks a core ISSO workflow (ADR-001 scope)
- Standalone `.cklb` file does not carry full attestation metadata — annotation bundle must accompany it

### 9.3 What's NOT in Scope

- Modifying the CKLB schema or proposing changes to DISA (unnecessary per §4)
- CKLB support in the backend DB (Phase 2 — after the converter exists)
- OSCAL integration (separate format, separate converter)
- Batch/library CKL→CKLB migration tooling (users script the CLI; acceptable for v1)
- CKLB round-trip detection / reimport-and-diff (deferred to Phase 2, §8.10)
- Target data editing in the GUI (read-only in passthrough for v1)
- Extending `ControlAttestationStatus` with `not_applicable` (ADR-001 scope)
- Full JSONIX removal from CKL reverse path (Phase 2 candidate)
- Attestation engine design (ADR-001 scope — this ADR documents integration points only)

---

## 10. Work Order

### Prerequisites (per-phase gates, not global blockers)

| Prerequisite | Blocks |
|---|---|
| SAF team decision: `unknown` severity → impact value | Phase 3 (forward mapper severity logic) |
| SAF team decision: `hdfSpecificData` storage (third_party_tools vs passthrough) | Phase 4 (reverse mapper) |
| Obtain real `.cklb` fixture files from STIG Viewer 3 | Phase 3 (forward mapper tests) |

Phase 1 (types) needs none of these and can start immediately. Phase 3 (CKL adapter) does not need `.cklb` fixtures.

### Implementation

| Phase | Scope | Depends on | Est | Notes |
|---|---|---|---|---|
| 1 | Generate CKLB TypeScript types from JSON schema. These are the canonical intermediate types for Option D. | — | sp:1 | `json-schema-to-typescript`. Handle duplicate `check_content` key. |
| 2 | CKLB→HDF forward mapper + domain logic migration. Move status/severity/CCI/comment functions from ckl-mapper into cklb-mapper, operating on CKLB types directly. Fixture tests. | Phase 1, `.cklb` fixtures, severity decision | sp:5 | Primary path. All domain logic lives here. |
| 3 | CKL forward adapter (XML→CKLB object). Parse CKL XML with fast-xml-parser, map STIG_DATA key-value pairs to CKLB properties, translate status vocabulary. **CKL fixture regression gate.** | Phase 2 | sp:3 | Replaces JSONIX for CKL forward path. |
| 4 | HDF→CKLB reverse mapper — round-trip patching (§2.3) + fresh export (§8.9). Output validates against CKLB schema. | Phase 2, hdfSpecificData decision | sp:5 | |
| 5 | CKL reverse adapter (CKLB object→CKL XML). Uses existing JSONIX infrastructure for XML output (Phase 1 approach — §5.4.2). **CKL fixture regression gate.** | Phase 4 | sp:3 | JSONIX removal is a follow-up. |
| 6 | Format detection + `index.ts` + `createHeimdallPassthrough('cklb')` + version handling (§6.2) | Phase 2 | sp:2 | |
| 7 | SAF CLI commands: `cklb2hdf`, `hdf2cklb`, `ckl2cklb`, `cklb2ckl` | Phase 2-5 | sp:3 | |
| 8 | Heimdall GUI: import/export CKLB options + CKLB export-with-attestations. | Phase 2-5, ADR-001 | sp:3 | |
| 9 | Integration tests: CKLB round-trip (multi-cycle), CKL↔CKLB conversion, CKL regression suite | Phase 3-5 | sp:3 | |

**Total: ~sp:28, ~140 min Claude-pace**

Compared to Option B (sp:40, ~180 min): **sp:12 savings (30%), and dramatically lower risk** — no class hierarchy refactoring, no type relocation, no JSONIX dependency in shared logic.

### Follow-on (not blocking CKLB support)

| Card | Scope | Depends on | Est | Notes |
|---|---|---|---|---|
| 1af.18 | Remove JSONIX — replace with fast-xml-parser for CKL XML read (XMLParser) and write (XMLBuilder). Delete checklistJsonix.ts + jsonixMapping.ts. Remove @mitre/jsonix dependency. | 1af.17 (CKL delegation) | sp:5 | Dependency cleanup. CKL fixture regression gate. See §5.4.2 decision. |

---

## 11. Review Findings Log

### Rounds 1-2 (10 agents, 2026-06-22)

This ADR was reviewed by 10 independent agents across 2 rounds. Roles: architecture, schema mapping, round-trip stress test, CKL code audit, compliance/ISSO workflow, adversarial doubter, external observer, KISS/minimizer, DRY/maintainability, best practices/standards. **32 findings incorporated** — see prior revision for full detail.

Key findings that survive into Option D:
- `open` + `unknown` severity = hidden finding (§3.2 + §8.6)
- Rule matching by `group_id` not `uuid` (§2.3)
- Unconditional overlay for patching — no dirty-tracking (§2.3)
- `ControlAttestationStatus` lacks `not_applicable` (§7)
- `third_party_tools` repurposing is pragmatic, not ideal (§4.1)
- Fresh export works for all HDF sources, not STIG-only (§8.9)
- `legacy_ids` normalize to array (§5.5)
- Three-vocabulary status normalization (§5.5)

### Round 3: Reviewer Feedback (2026-06-22 to 2026-06-25)

| # | Finding | Source | Resolution |
|---|---|---|---|
| 33 | "the O in OHDF does not stand for 'outcome-based'" | Amndeep7 | Fixed: OHDF = OASIS HDF |
| 34 | Missing three fields used by SV internally | Amndeep7 | §1.3: noted, generated types (§6.5) are authoritative. All schema fields brought through. |
| 35 | Missing a field in per-rule listing | Amndeep7 | §1.3 + §3.4: expanded field lists. Generated types are the final source. |
| 36 | Where is Option A? | Amndeep7 | §2.2: Option A added (standalone, rejected — DRY violation) |
| 37 | **No Option D — ckl→cklb→hdf, replace intermediate with CKLB** | Amndeep7 | **Accepted as chosen architecture.** §2.1 revised. |
| 38 | Attestation/comment stuff should be separate from CKLB converter | Amndeep7 | §7: reduced to integration points only. CKLB converter is standalone. |
| 39 | Slight misunderstanding of JSONIX type origin | Amndeep7 | §5.3: clarified — JSONIX derives from original CKL XSD, types are XSD-derived not invented |
| 40 | Type refactor = massive headache | Amndeep7 | **Eliminated by Option D** — no extraction needed |
| 41 | What is the regen tool? | Amndeep7 | §6.5: explained with link to ADR-002 |
| 42 | "CKLB IS the intermediate — replace it outright" | Amndeep7 | §1.4: cited directly. Core motivation for Option D. |
| 43 | Backward compatibility with old OHDF from old CKL? | ejaronne | §2.5: yes — internal pipeline change, same HDF output. CKL fixtures enforce. |
| 44 | Not single source of truth; Heimdall is day-to-day view | wdower | ADR-001 scope (§7 references simplified). |
| 45 | Phase 3 POA&M should consume HDF Libs, not reimplement | wdower | ADR-001 scope. |

### Findings assessed and rejected

| Finding | Source | Why rejected |
|---|---|---|
| Skip extraction entirely (import from ckl-mapper directly) | KISS (Round 1) | Superseded by Option D — CKLB IS the primary, not a consumer of ckl-mapper |
| Fresh CKLB export restricted to STIG-origin HDF | multiple (Round 1) | Incorrect — CKLB `group_id` is unconstrained; any control ID works |
| Runtime ajv validation of input CKLB | standards (Round 2) | No other converter in the repo does this. Fingerprint detection + defensive access is consistent. |

---

## 12. References

- CKLB JSON Schema: `SV3_CKLB_1_0_JSON_SCHEMA.json` (in repo root, from [cyber.mil](https://www.cyber.mil/stigs/downloads))
- Existing CKL mapper: `libs/hdf-converters/src/ckl-mapper/`
- InSpec JSON schema: `libs/inspecjs/schemas/exec-json.json`
- ADR-001: GUI Attestation & Comment Engine (`docs/adr-001-attestation-comment-engine.md`)
- ADR-002: DRY hdf-converters (`docs/adr-002-dry-hdf-converters.md`)
- GitHub issues: #5603, #7271, #7733
- PR #8283 review comments: Amndeep7, wdower, ejaronne (2026-06-22 to 2026-06-25)
- HDF Mapper Creation Guide: [SAF Wiki](https://github.com/mitre/saf/wiki/HDF-Mapper-and-Converter-Creation-Guide-(for-SAF-CLI-&-Heimdall2))
