# ADR-001: GUI Attestation & Comment Engine

**Status:** Accepted
**Date:** 2026-06-16
**Author:** Aaron Lippold
**Epic:** heimdall2-9go
**Branch:** `feature/attestation-editing-engine`
**Supersedes:** PR #8278 (codex/editable-comments)

---

## Glossary

| Term | Definition |
|------|-----------|
| **HDF** | Heimdall Data Format — JSON output format from InSpec and other scanners, based on OHDF (Outcome-based HDF) |
| **CKL** | Checklist — XML format used by DISA STIG Viewer for recording STIG review results |
| **CKLB** | Checklist JSON — newer JSON-based checklist format (not yet supported in Heimdall) |
| **eMASS** | Enterprise Mission Assurance Support Service — DISA's system for managing security authorizations and POA&Ms |
| **ISSO/ISSM/AO** | Information System Security Officer / Manager / Authorizing Official — roles in the RMF authorization process |
| **POA&M** | Plan of Action and Milestones — formal document tracking remediation of security findings |
| **NR** | Not Reviewed — control status meaning the check requires manual verification |
| **XCCDF** | Extensible Configuration Checklist Description Format — XML standard for security checklists |
| **OSCAL** | Open Security Controls Assessment Language — NIST's standard for machine-readable security data |
| **SAF CLI** | MITRE SAF Command Line Interface — `saf attest` creates/applies attestation files to HDF results |
| **Passthrough** | CKL data preserved verbatim in HDF when importing from CKL — used for round-trip fidelity |
| **Lite mode** | Heimdall running without a backend server (frontend only, no DB, no auth) |
| **Server mode** | Heimdall running with NestJS backend, PostgreSQL, authentication, DB persistence |
| **FileID** | `string` type — unique identifier for a loaded file in the Vuex store |
| **ContextualizedControl** | inspecjs type — a control with computed HDF wrapper, status, severity, descriptions |

---

## 1. Context

### 1.1 The Problem

Heimdall users currently follow a painful manual workflow for compliance review:

1. Run InSpec scan → get HDF JSON
2. Import to STIG Viewer → produces CKL
3. Email CKL to reviewer
4. Reviewer opens in STIG Viewer, adds comments, changes statuses
5. Saves new CKL, emails back
6. Another reviewer repeats
7. Multiple CKL copies floating in email, Jira attachments
8. Nobody knows which version is latest
9. Eventually someone submits to eMASS

This produces confusion, lost work, and no audit trail.

### 1.2 PR #8278 Review Findings

PR #8278 attempted to solve this by adding an editable comments textarea inside the control Details tab. A multi-agent review identified fundamental issues:

- **Wrong UX**: editing buried 3 clicks deep (expand control → Details tab → scroll to Comments)
- **Triple-write pattern**: mutating `control.data.descriptions`, `control.hdf.descriptions.comments`, AND `passthrough.checklist.stigs[].vulns[].comments` — fighting inspecjs immutability design
- **CKL format logic duplicated**: `parseComments()`, `getComments()`, `controlsToVulns()` all reimplemented in the Vuex store instead of using hdf-converters
- **No debounce**: O(n) CKL vuln scan per keystroke
- **Fire-and-forget export**: `saveSingleOrMultipleFiles` resolves immediately after `saveAs` — cancelled downloads still clear dirty flags
- **globalThis.confirm()**: first native confirm in the entire codebase (app uses Vuetify dialogs)
- **Zero test coverage**, CI failing with `TypeError: Cannot read properties of undefined (reading 'find')`
- **Root cause**: CKL export trusts a pre-serialized passthrough blob as a second source of truth for comments

### 1.3 Prior Art: `checklistView` Branch

The `remotes/origin/checklistView` branch contains substantial prior work (~3,881 lines) on a checklist editor view. Key components that may be reusable or informative:

| Component | Lines | What |
|-----------|-------|------|
| `views/Checklist.vue` | 345 | Dedicated checklist view — table of rules with editing |
| `checklist/ChecklistRuleEdit.vue` | 115 | Editable rule component — status, comments, finding details |
| `checklist/ChecklistRuleInfoBody.vue` | 198 | Rule information display |
| `checklist/ChecklistRulesTable.vue` | 202 | Table of checklist rules with filtering |
| `checklist/ChecklistSeverityOverride.vue` | 66 | Severity override dropdown + justification |
| `checklist/ChecklistTargetDataModal.vue` | 178 | Target/asset data modal |
| `sidebaritems/DropdownFilters.vue` | 74 | Filter dropdowns for the sidebar |
| `sidebaritems/QuickFilters.vue` | 72 | Quick filter buttons |

This branch also significantly extended `data_filters.ts` (749 lines added) and `search.ts` (911 lines). The branch was never merged (has known bugs per commit messages) but contains proven UX patterns for checklist editing — severity override, rule editing, and table-based review — that should be evaluated before building new components.

**Why the branch was never merged:**
1. Saving bug was never fixed (commit `0abfafb` — "Add TODO comment for found saving bug")
2. Filtering remained broken (commit `b802140` — "try to fix ID filtering, but still broken")
3. Scope creep — 54 files changed, 3,881 lines. Grew from checklist view into search engine rewrite + sidebar overhaul + filter system redesign
4. CKL-only data model — everything typed against `ChecklistVuln`, incompatible with non-CKL files
5. Direct mutation via `v-model` on CKL vuln objects — same antipattern as PR #8278 (no records, no audit trail)

**What to reuse (widgets, not data model):**
- `ChecklistRuleEdit.vue` — status dropdown, Finding Details + Comments textareas, severity override flow (adapt for B1)
- `ChecklistSeverityOverride.vue` — justification-gate pattern (adapt for B1)
- `ChecklistRulesTable.vue` — selectable v-data-table with status chips, column picker (pattern reference for C)
- `SearchEntry<T>` with negation from `search.ts` — "filter to NR controls" is already built
- `controlStatusSwitches` — NR filter toggle for card E

**What to avoid:**
- Don't rewrite search/filters as part of the attestation engine — that's scope creep
- Don't type against `ChecklistVuln` — use `ContextualizedControl` (format-agnostic)
- Don't use `v-model` two-way binding on data objects — use store records
- Don't import CKL types into the store layer — keep store format-agnostic

**Action:** Before implementing cards B1/B2, read `ChecklistRuleEdit.vue` and `ChecklistSeverityOverride.vue` from this branch to adapt the form widgets. Discard the data model entirely.

### 1.4 What We Learned

The "editable comments" feature is really the first step of a **compliance review workflow** that the tool has always needed. Building it right means building the attestation and annotation engine that enables the full review lifecycle.

---

## 2. Decision

Build a GUI attestation and comment engine that:

1. Makes Heimdall Server the **single source of truth** for compliance review
2. Replaces the CKL-email-STIG-Viewer loop with a **URL-based collaborative workflow**
3. Uses the **existing attestation infrastructure** in hdf-converters and inspecjs
4. Preserves **scan data integrity** — attestation/comment records are stored separately as the source of truth; in-memory mutations are a display optimization (see §5.1)
5. Produces **SAF CLI compatible** attestation files for interoperability
6. Supports **iterative review cycles** including CKL round-trips through STIG Viewer
7. Provides **revision history** with Draft → In Review → Final lifecycle

---

## 3. Business Workflows

### 3.1 Two Operations at the Control Level

Controls are identified by a stable ID (e.g., V-2255). Individual test results within a control have no stable identifier and cannot be annotated individually.

#### 3.1.1 Attest (Status Change) — Not Reviewed Controls Only

A reviewer changes a control's status from Not Reviewed to Passed or Failed.

**Required fields:**
- `status`: `passed` or `failed` (ControlAttestationStatus enum)
- `explanation`: free-text justification (required, cannot be empty)
- `frequency`: review cadence — `daily`, `weekly`, `monthly`, `quarterly`, `semiannually`, `annually`, or custom `Nd`/`Nw`/`Nm`/`Ny`

**Auto-populated:**
- `updated`: ISO timestamp of when attestation was created
- `updated_by`: current user's display name or email
- `control_id`: from the control being attested

**Effect on display (immediate, in-memory):**
- Attestation record stored in annotation store
- Control row indicator updates (✓ attested)
- Compliance score does NOT update live in Phase 1 — score is computed by inspecjs from the original result segments, and `addAttestationToHDF` (which adds the segment that changes status) only runs at export time. Phase 2 can recompute by applying attestations to a display clone.

**Effect on export:**
- `addAttestationToHDF()` adds `attestation_data` field to the control
- `convertAttestationToSegment()` adds a new result segment that changes computed status
- Compliance score in exported output reflects attestations
- Auto-expires: `advanceDate(updated, frequency)` computes expiration. Past expiration → `convertAttestationToSegment` returns Skipped status instead of attested status

**HDF Spec Support (existing):**
- `ExecJSONControl.attestation_data?: AttestationData` field on every control
- `ControlAttestationStatus` enum: `passed | failed`
- `attestationCanBeAdded()`: validates only `skipped` (NR) controls can be attested
- `addAttestationToHDF()`: merges attestation records into an HDF Execution
- `convertAttestationToSegment()`: creates result entry; handles expiration → Skipped
- `advanceDate()`: computes expiration from all supported frequency strings
- Status computation in `compat_inspec_1_0.ts:195`: reads `attestation_data` for control status

#### 3.1.2 Comment/Annotate (No Status Change) — Any Control

A reviewer adds a note to any control regardless of its current status.

**Required fields:**
- `text`: the comment content

**Auto-populated:**
- `updated`: ISO timestamp
- `updated_by`: current user
- `control_id`: from the control being annotated

**Effect on display (immediate, in-memory):**
- Comment entry added to annotation store comment log (audit trail — append-only, accumulates across review cycles)
- `control.data.descriptions.comments` and `control.hdf.descriptions.comments` patched for live display (display optimization, see §5.1)
- Control row indicator updates (💬 has comments)
- Does NOT change status or compliance score

**Effect on export:**
- `descriptions.comments` already contains the latest comment text from live mutation
- CKL export: `getComments()` reads from descriptions automatically
- Comment log entries exported separately in the annotation bundle (§3.4.2)

**Comment log vs latest text:**
- The comment LOG is append-only (every entry preserved with who/when for audit)
- The DISPLAY and EXPORT use the latest entry's text (most recent comment)
- History is viewable in the side panel
- History is exported in the annotation bundle (not in the HDF itself)

**How comments differ from attestations:**
- No status change
- No frequency/TTL (comments are permanent documentation)
- Available for ALL controls, not just NR
- Maps to CKL `COMMENTS ::` section in structured comments

### 3.1.3 Domain Gaps to Address

These are real ISSO workflow items identified by compliance domain review. They should be included in Phase 1 or early Phase 2, not deferred to Phase 3.

**1. Failed → Not Applicable / Risk Acceptance**

ISSOs routinely mark failed controls as Not Applicable (system doesn't have the component) or risk-accepted (finding is real but accepted with mitigation). This is NOT an edge case. The current `attestationCanBeAdded()` restricts attestation to `skipped` (NR) controls only. Phase 1 should at minimum support Failed→NA by extending the status check in the side panel UI (the store can accept any status; the restriction is in the validator). Full risk-acceptance with POA&M fields is Phase 3.

**2. Severity Override**

CKL carries `SEVERITY_OVERRIDE` + `SEVERITY_JUSTIFICATION` — a standard ISSO action where a CAT I finding is downgraded to CAT II with documented mitigation. The ADR does not model this. The side panel should include an optional Severity Override dropdown + justification textarea. Maps directly to existing CKL fields and `control.data.tags.severityoverride` / `severityjustification`.

**3. FINDING_DETAILS (Evidence Field)**

CKL has TWO free-text fields per vuln: `COMMENTS` (reviewer notes) and `FINDING_DETAILS` (assessor evidence — scan output, screenshots, verification steps). The ADR currently maps all structured descriptions into COMMENTS only. FINDING_DETAILS is where assessors put evidence — leaving it unwritten makes exports look incomplete to a DISA reviewer. The side panel should expose FINDING_DETAILS as a separate editable field, mapped to `control.hdf.finding_details` and the CKL `findingdetails` vuln field.

### 3.2 The Review Lifecycle

```
                    ┌──────────────────────────────────────┐
                    │            SCAN                       │
                    │  InSpec / other scanner → HDF JSON    │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │       LOAD INTO HEIMDALL              │
                    │  Upload or load from DB               │
                    │  State: DRAFT                         │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │       SAVE TO DB (Phase 2)            │
                    │  Get permanent URL                    │
                    │  Share in Jira / Slack / email        │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │       REVIEW CYCLE (repeatable)       │
                    │                                       │
                    │  Reviewer opens URL                   │
                    │  → sees current state + history       │
                    │  → attests NR controls                │
                    │  → adds comments to any control       │
                    │  → Save (creates new revision)        │
                    │                                       │
                    │  Can include CKL round-trip:          │
                    │  Export CKL → STIG Viewer → Reimport  │
                    │                                       │
                    │  State: IN REVIEW                     │
                    └──────────────┬───────────────────────┘
                                   │ (repeat as needed)
                    ┌──────────────▼───────────────────────┐
                    │       FINALIZE (Phase 2)               │
                    │  ISSO marks FINAL                     │
                    │  Evaluation locked — no more edits    │
                    │  State: FINAL                         │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │       SUBMIT (Phase 3)                │
                    │  Export to eMASS (CKL/XCCDF/POA&M)   │
                    │  Canonical record stays in Heimdall   │
                    └──────────────────────────────────────┘
```

**State machine:**
```
DRAFT ──save──▸ IN REVIEW ──mark final──▸ FINAL
                    │                        │
                    │◂──save (new revision)───│ (not allowed)
                    │                        │
                    │◂──CKL round-trip───────│ (not allowed)
```

- **DRAFT**: initial state after loading. No review actions taken yet.
- **IN REVIEW**: at least one save/attestation/comment has been made. Multiple reviewers can contribute. Each save creates a new revision.
- **FINAL**: locked. No more edits. Ready for eMASS submission. Export only.

Phase 1 implements DRAFT and IN REVIEW (without DB persistence). Phase 2 adds FINAL and revision history.

### 3.3 CKL Round-Trip Support

Users may export CKL, edit in STIG Viewer, and reimport:

```
Heimdall → Export CKL → STIG Viewer (reviewer edits) → Import back → more edits → Export again → ...
```

**On CKL import, Heimdall must:**

1. Parse structured comments via existing `parseComments()`:
   - `CAVEAT :: text` → `descriptions.caveat`
   - `JUSTIFICATION :: text` → `descriptions.justification`
   - `RATIONALE :: text` → `descriptions.rationale`
   - `COMMENTS :: text` → `descriptions.comments`

2. Detect status changes vs the loaded original:
   - Compare CKL status (`NotAFinding`, `Open`, `Not_Applicable`, `Not_Reviewed`) against the original HDF control status
   - If status changed (e.g., `Not_Reviewed` → `NotAFinding`), offer to create an attestation record

3. Detect new/changed comments:
   - Compare CKL comments against existing `descriptions.comments`
   - If different, offer to create a comment entry with "imported from CKL" attribution

4. Preserve existing comment history — imported comments append, don't replace

**On CKL export, the existing flow plus our additions:**

- For **CKL-passthrough files** (originally imported from CKL): call `syncChecklistVulnComments()` to push description edits into passthrough vuln comments before serialization
- For **non-passthrough files** (HDF-native): `getComments()` regenerates from `descriptions` automatically — no special handling needed
- Attestation status changes appear as CKL status values (`NotAFinding` for passed, `Open` for failed)

### 3.4 Export Artifacts

Two distinct export types:

#### 3.4.1 Export Results (existing EXPORT button)

Full HDF/CKL/CSV/XCCDF with attestations and comments **baked into the output**. This is the snapshot for submission.

**Flow:**
1. Clone the evaluation data (don't modify original)
2. Apply attestation records: `addAttestationToHDF(clone, attestations)` — adds `attestation_data` to controls, appends result segments, changes computed status
3. Comments are already in `control.data.descriptions` via `updateControlDescription`
4. For CKL: run `syncChecklistVulnComments()` on passthrough files
5. Serialize in chosen format (HDF JSON, CKL XML, CSV, XCCDF)
6. Mark files saved (clear dirty state)

#### 3.4.2 Export Attestations (new, on notification bar)

Just the attestation/comment records as a standalone file. SAF CLI compatible.

**Formats:**
- JSON — array of records, compatible with `saf attest apply`
- YAML — same structure, YAML serialized
- XLSX — spreadsheet for human review (uses existing column format from `parseXLSXAttestations`)

**Attestation file format** (SAF CLI compatible — attestations only):
```json
[
  {
    "control_id": "V-2255",
    "status": "passed",
    "explanation": "Verified manually — htpasswd configured correctly",
    "frequency": "annually",
    "updated": "2026-06-16T21:00:00Z",
    "updated_by": "Aaron Lippold"
  }
]
```

**Comment file format** (Heimdall extension — separate file, NOT mixed with attestations):
```json
{
  "comments": [
    {
      "control_id": "V-2256",
      "text": "See JIRA-1234 for remediation plan",
      "updated": "2026-06-16T21:05:00Z",
      "updated_by": "Aaron Lippold"
    }
  ]
}
```

**Why separate files:** `ControlAttestationStatus` is a strict enum (`passed | failed`). Mixing comments into attestation records with `status: ""` violates the type and may cause SAF CLI errors. Attestation files contain only valid `AttestationData` records. Comment files use a separate `CommentEntry` format. Both can be exported together as a combined Heimdall annotation bundle (JSON with `{attestations: [...], comments: [...]}`).

**Portability:** Export attestation file from Server A → `saf attest apply` to HDF files from servers B, C, D running the same profile. One review covers the whole fleet.

### 3.5 Import Attestation Files

Users load previously exported attestation files into Heimdall.

**Supported formats** (parsers already exist in hdf-converters):
- XLSX: `parseXLSXAttestations()` — built and tested
- YAML: `yaml.parse()` — tested in attestation specs
- JSON: `JSON.parse()` — trivial

**Import flow:**
1. Upload attestation file via new tab in UploadNexus (alongside Local Files, Database, Samples, etc.)
2. Parse → validate format
3. Preview: show table of attestation records with "Control ID | Status | Explanation | Match?" — indicate which controls exist in the currently loaded files
4. User confirms → apply matching records to the appropriate files
5. Non-matching records (control not found in any loaded file) are reported but not discarded
6. Applied attestations appear in the side panel history

---

## 4. UX Design

### 4.1 Overview Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Result View (NGINX With Failing Tests)  🔍Search  CLEAR  LOAD  EXPORT  │
├──────────────────────────────────────────────────────────────────────────┤
│ Filename: NGINX With Failing Tests                                      │
│ Tool Version: 1.37.6  Platform: centos7  Duration: 29.29s  File Info ↓ │
├──────────────────────────────────────────────────────────────────────────┤
│ ✓ Passed:34 │ ✗ Failed:3 │ ⊘ N/A:1 │ ! NR:3 [Attest ▸]              │  ← 4.4
├──────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────────────┐│
│ │ 📝 2 attestations, 1 comment pending                               ││  ← 4.5
│ │ [Review All]  [Export Attestations ↓]                               ││
│ └──────────────────────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────────────────────┤
│ Status Counts │ Severity Counts │ Compliance Level                      │
├──────────────────────────────────────────────────────────────────────────┤
│ Tree Map                                                                │
├──────────────────────────────────────────────────────────────────────────┤
│ Results View Data                                         Actions ← 4.3 │
│ ┌────────┬──────────────────────┬───────┬──────┬───────────────────┐   │
│ │Status  │ Title                │ ID    │ NIST │ Actions           │   │
│ ├────────┼──────────────────────┼───────┼──────┼───────────────────┤   │
│ │NR   ▾  │ htpasswd files...    │V-2255 │ AC-3 │ [Attest 📝]       │   │
│ │Pass ▾  │ access control...    │V-2256 │ AC-3 │ [Comment 💬]      │   │
│ │Pass ▾💬│ admin users...       │V-2257 │ AC-2 │ [Comment 💬]      │   │
│ │Fail ▾  │ nginx must limit...  │V-2259 │ AC-3 │ [Comment 💬]      │   │
│ │NR   ▾✓ │ web server must...   │V-2260 │ AC-3 │ [Attest 📝]       │   │
│ └────────┴──────────────────────┴───────┴──────┴───────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Review Side Panel

**Component: `ReviewPanel.vue`** — mounted in `Results.vue` (NOT inside ControlTable). A deep-mounted `app` drawer fights the layout. ControlTable emits events; Results.vue owns the panel state.

Vuetify `v-navigation-drawer` with `right` and `app`:
- **lgAndUp (≥1264px):** persistent drawer, pushes content left (`app` prop). Width 400px. Results table remains visible and interactive.
- **mdAndDown (<1264px):** temporary overlay, full width. Scrim covers results (acceptable on small screens).
- **Drawer coordination:** opening ReviewPanel closes the left Sidebar (and vice versa) to prevent stacked scrims and competing focus traps. Managed via a `ui` store flag (`activeDrawer: 'sidebar' | 'review' | null`) — testable in vitest, no event bus.

```
┌──────────────────────────────────────────┬──────────────────────────────┐
│                                          │  ✕ Close                     │
│  (main results view stays visible,       │                              │
│   narrowed to make room for panel)       │  V-2255 — htpasswd files     │
│                                          │  Status: Not Reviewed        │
│                                          │  Severity: LOW  │ AC-3       │
│                                          │  ─────────────────────────── │
│                                          │                              │
│                                          │  ATTEST (change status)      │
│                                          │  ┌─────────────────────────┐ │
│                                          │  │ New Status: [Passed ▾]  │ │
│                                          │  │                         │ │
│                                          │  │ Explanation: (required) │ │
│                                          │  │ ┌─────────────────────┐ │ │
│                                          │  │ │ Verified manually   │ │ │
│                                          │  │ │ by ISSO on site     │ │ │
│                                          │  │ └─────────────────────┘ │ │
│                                          │  │                         │ │
│                                          │  │ Review Freq: [Annual ▾] │ │
│                                          │  │ Reviewed by: A.Lippold  │ │
│                                          │  └─────────────────────────┘ │
│                                          │                              │
│                                          │  ─── or ──────────────────── │
│                                          │                              │
│                                          │  💬 ADD COMMENT               │
│                                          │  ┌─────────────────────────┐ │
│                                          │  │                         │ │
│                                          │  └─────────────────────────┘ │
│                                          │                              │
│                                          │  [Save]                      │
│                                          │                              │
│                                          │  ─── Comment History ──────── │
│                                          │  📅 2026-06-15 Reviewer1:    │
│                                          │     "Needs documentation"    │
│                                          │  📅 2026-06-10 Engineer:     │
│                                          │     "Docs added — see wiki"  │
│                                          │                              │
│                                          │  [◀ Prev]          [Next ▶] │
└──────────────────────────────────────────┴──────────────────────────────┘
```

**Component: `ReviewPanel.vue`**

Props:
- `control: ContextualizedControl` — the control being reviewed
- `fileId: FileID` — which loaded file this control belongs to
- `visible: boolean` — controls drawer open/close (v-model)

Behavior:
- **Attest section** only renders when `control.root.hdf.status === 'Not Reviewed'`
- **Comment section** always renders for all controls
- **History section** shows accumulated comment log entries, newest first
- **Save** button commits attestation and/or comment to the annotation store, marks file dirty
- **Cancel** button discards unsaved form changes, closes drawer
- **Prev/Next** emits events to parent (ControlTable) to navigate through `ControlTable.items` array (respects current filter and sort). Disabled at first/last control. If form has unsaved changes, prompts "Discard changes?" before navigating.
- **Close (✕)** — if form has unsaved text, shows "Discard changes?" confirmation. Otherwise closes immediately.
- **Click-away** — same behavior as Close
- **Security:** All user-supplied text (explanation, comment text, history entries) MUST render via Vue mustache `{{ }}` interpolation (auto-escaped), NOT `v-html`. The existing `sanitize_html` mixin is for control metadata display only. User-authored attestation/comment text is untrusted input.
- Explanation textarea has validation: required for attestation, empty check
- Frequency dropdown populated from `advanceDate()` supported values: daily, weekly, monthly, quarterly, semiannually, annually
- **Expiration indicator:** if an attestation exists for this control, show computed expiration date (`advanceDate(updated, frequency)`). If expired, show "⚠ Expired — re-attest" with warning color. This is display-only (computed client-side), not a live status change.
- `updated_by` auto-populated from `ServerModule.userInfo.email` (server mode) or `'local user'` (lite mode)

### 4.3 Control Row Actions + Indicators

**Modifications to `ControlRowHeader.vue`:**

Add to the row (after the existing columns):
- **Action button**: `v-btn` icon button
  - NR controls: `mdi-clipboard-check-outline` with tooltip "Attest"
  - All others: `mdi-comment-plus-outline` with tooltip "Add Comment"
  - Click emits `open-review-panel` with the control

- **Indicators** (shown in the status area or after filename):
  - `mdi-comment-text` (💬) — shown when `annotationStore.hasComments(fileId, controlId)` is true
  - `mdi-check-decagram` (✓) — shown when `annotationStore.hasAttestation(fileId, controlId)` is true
  - Both can be present simultaneously

**Modifications to `ControlTable.vue`:**
- Add `reviewPanelControl` data property (currently selected control for review)
- Add `reviewPanelVisible` data property
- Handle `open-review-panel` event from ControlRowHeader
- Include `<ReviewPanel>` component in template
- Handle prev/next navigation events from ReviewPanel

### 4.4 NR Status Card Attest Action

**Modifications to `StatusCardRow.vue`:**

The "Not Reviewed" card currently shows:
```
! Not Reviewed: 3
Can only be tested manually at this time
```

Change subtitle to include action link:
```
! Not Reviewed: 3
[Attest ▸] Can only be tested manually at this time
```

The [Attest ▸] link:
- Filters the Results View to show only NR controls
- Opens the review panel on the first NR control
- User can then use Prev/Next to move through all NR controls

### 4.5 Notification Bar

**New component: `AnnotationBar.vue`**

Positioned between the status cards row and the charts/treemap. Only visible when there are pending (unsaved) annotations.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 📝 2 attestations, 1 comment pending  [Review All] [Export Attestations ↓]│
└──────────────────────────────────────────────────────────────────────────┘
```

- **Counts** read from `annotationStore.attestationCount` and `annotationStore.commentCount`
- **Review All** opens the side panel starting at the first annotated control
- **Export Attestations ↓** dropdown with JSON / YAML / XLSX options
- **Hidden** when counts are both zero
- **Styling**: matches existing Heimdall info bar pattern (subtle background, not intrusive). Use theme variables (`var(--v-secondary-lighten1)` etc.), not hardcoded colors.

### 4.6 Changelog Sidebar Entry (Phase 2)

> **Deferred to Phase 2.** This feature requires `applyAttestationsToHdf` to build a display clone for diffing, baseline status snapshots, and the ComparisonContext extension. All three reviewers (architecture, implementer, compliance) agreed this is the weakest-justified Phase 1 item. Ship the core attest/comment engine first; add the changelog when revision history exists in the DB.

**Design (for Phase 2 implementation):**

Add a "Changelog" toggle in the left sidebar below "Comparison View." When enabled:
- Diffs original scan data vs a clone with attestations applied (via `applyAttestationsToHdf`)
- Reuses `ComparisonContext`/`ControlDelta` from `delta_util.ts`
- Extends `ControlDelta.headerChanges` with "Attestation" and "Comments" change groups
- Renders using `CompareRow.vue` (or adapted version)

### 4.7 Accessibility

- **Keyboard navigation:** `j`/`k` or arrow keys to step through controls when side panel is open. `Enter` to open panel on focused row. `Esc` to close panel. Tab order follows logical flow (form fields → Save → Cancel → Prev/Next).
- **ARIA:** Side panel has `role="complementary"` and `aria-label="Control Review Panel"`. Action buttons have `aria-label` ("Attest control V-2255" / "Comment on control V-2256").
- **Focus management:** Opening the panel moves focus to the first form field. Closing returns focus to the row that triggered it.
- **Screen reader:** Notification bar is `role="status"` with `aria-live="polite"` so count changes are announced.

---

## 5. Data Architecture

### 5.1 Data Integrity Model

**Two representations exist at runtime:**

1. **In-memory contextualized objects** — the live controls that Vue components render from. These ARE mutated when a user adds a comment or attestation (via `updateControlDescription` which patches `control.data.descriptions` and `control.hdf.descriptions`). This is necessary because inspecjs builds `control.hdf` once at intake and the display reads from it.

2. **Attestation/Comment records** — stored separately in the annotation Vuex store. These are the canonical audit trail (who/when/what). They also drive the export overlay.

**On export:**
- The evaluation data is deep-cloned
- Attestation records are applied to the clone via `addAttestationToHDF()` (adds `attestation_data` fields + result segments)
- Comments are already in `control.data.descriptions` from live mutation
- The clone is serialized — the in-memory objects are not further modified

**What "immutable" means in this design:**
- The **attestation/comment records** are the source of truth, not the mutations to in-memory objects
- The in-memory mutations are a **display optimization**, not a persistence mechanism
- On page refresh (Phase 1), in-memory state is lost — the records in the annotation store are what matter
- On DB save (Phase 2), the original scan data + attestation records are saved separately — the original can always be reconstructed

**This differs from PR #8278** which had no separate records — mutations to `control.data` WERE the only representation, with no audit trail, no separation of concerns, and no way to reconstruct the original.

```
In-memory objects (mutated for display)     ← display optimization
         +
Annotation Store records (source of truth)  ← audit trail, export overlay
         =
Exported Output (clone + apply attestations + serialize)
```

### 5.2 Data Structures

#### 5.2.1 Attestation Record

Uses the existing `AttestationData` type from inspecjs:

```typescript
// From libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts
interface AttestationData {
  control_id: string;           // "V-2255"
  status: ControlAttestationStatus; // "passed" | "failed"
  explanation: string;           // required justification text
  frequency: string;             // "annually", "quarterly", "1y", etc.
  updated: string;               // ISO 8601 timestamp
  updated_by: string;            // who attested
}

enum ControlAttestationStatus {
  Failed = "failed",
  Passed = "passed",
}
```

#### 5.2.2 Comment Log Entry

New type for annotations without status change:

```typescript
interface CommentEntry {
  control_id: string;           // "V-2256"
  text: string;                 // the comment content
  updated: string;              // ISO 8601 timestamp
  updated_by: string;           // who commented
}
```

#### 5.2.3 Per-File Annotation State

```typescript
interface FileAnnotationState {
  fileId: FileID;
  attestations: AttestationData[];     // one per attested control (latest wins)
  commentLog: CommentEntry[];          // accumulates across review cycles
  originalStatuses: Record<string, string>;  // control_id → original status at load time
    // Captured once when file is first annotated. Used by CKL round-trip detection (§5.6)
    // to distinguish "status changed by attestation" from "status changed externally."
}
```

### 5.3 Vuex Annotation Store Module

**New file: `apps/frontend/src/store/annotation_store.ts`**

```typescript
@Module({namespaced: true, dynamic: true, store: Store, name: 'annotations'})
export class AnnotationStore extends VuexModule {
  // State — Vue 2 reactive arrays (same pattern as data_filters.ts)
  fileAnnotations: FileAnnotationState[] = [];

  // Indexed lookups — maintained by mutations via OBJECT REPLACEMENT, NOT property addition.
  // Vue 2 cannot detect new property additions on plain objects. Mutations MUST replace
  // the entire index: `this.attestationIndex = {...this.attestationIndex, [key]: record}`
  // This is the same reactive pattern as array replacement in data_filters.ts.
  // Writes are O(n) spread but rare (user clicks Save); reads are O(1) and happen per-row per-render.
  attestationIndex: Record<string, AttestationData> = {};   // `${fileId}:${controlId}` → record
  commentIndex: Record<string, boolean> = {};               // `${fileId}:${controlId}` → has comments

  // Getters (O(1) lookups via index, not O(n) array scans)
  get annotationsForFile(): (fileId: FileID) => FileAnnotationState | undefined
  get attestationsForFile(): (fileId: FileID) => AttestationData[]
  get commentsForControl(): (fileId: FileID, controlId: string) => CommentEntry[]
  get hasAttestation(): (fileId: FileID, controlId: string) => boolean
    // Returns attestationIndex[`${fileId}:${controlId}`] !== undefined — O(1)
  get hasComments(): (fileId: FileID, controlId: string) => boolean
    // Returns commentIndex[`${fileId}:${controlId}`] === true — O(1)
  get attestationCount(): number    // total pending attestations across all files
  get commentCount(): number        // total pending comments across all files
  get pendingFiles(): FileID[]      // files with any pending annotations

  // Mutations
  @Mutation ADD_ATTESTATION(payload: {fileId: FileID, attestation: AttestationData})
  @Mutation ADD_COMMENT(payload: {fileId: FileID, comment: CommentEntry})
  @Mutation REMOVE_ATTESTATION(payload: {fileId: FileID, controlId: string})
  @Mutation CLEAR_FILE_ANNOTATIONS(fileId: FileID)
  @Mutation IMPORT_ANNOTATIONS(payload: {fileId: FileID, state: FileAnnotationState})

  // Actions
  @Action addAttestation(payload: {fileId, controlId, status, explanation, frequency})
  @Action addComment(payload: {fileId, controlId, text})
  @Action removeAttestation(payload: {fileId, controlId})
  @Action importAttestationFile(payload: {fileId, records: AttestationData[]})
  @Action exportAttestations(payload: {fileId, format: 'json' | 'yaml' | 'xlsx'})
  @Action applyAttestationsToHdf(payload: {fileId}): ExecJSON.Execution
    // Clones evaluation data, calls addAttestationToHDF, returns merged result
}

export const AnnotationModule = getModule(AnnotationStore);
```

**Vue 2 reactivity:** All state uses arrays with replacement (same pattern as `data_filters.ts` `selectedEvaluationIds`). No `Set`, no `Map`, no `Vue.set`.

### 5.4 How Attestations Flow to Export

#### 5.4.1 HDF/JSON Export

```
User clicks EXPORT → Export as OHDF JSON
  1. Get evaluation data for selected files
  2. For each file with annotations:
     a. Deep clone evaluation.data
     b. Apply comment descriptions: for each CommentEntry,
        call setControlDescription(clone.profiles[].controls[], 'comments', latestCommentText)
     c. Apply attestations: addAttestationToHDF(clone, attestations)
        → this adds attestation_data to matching controls
        → this appends result segments (passed/failed/expired)
        → this changes the control's computed status
  3. Serialize as JSON
  4. saveSingleOrMultipleFiles()
  5. .then(() => markFilesSaved(ids))
  6. .catch((error) => SnackbarModule.failure(error))
```

#### 5.4.2 CKL Export

```
User clicks EXPORT → Export as CKL
  1. Get evaluation data for selected files
  2. For each file with annotations:
     a. Apply comment descriptions (same as 5.4.1 step 2a)
     b. Apply attestations (same as 5.4.1 step 2b-c)
     c. For CKL-passthrough files:
        call syncChecklistVulnComments(passthrough.checklist.stigs[].vulns, editsMap)
        → uses existing typed infrastructure from hdf-converters
        → pushes description edits into passthrough vuln comments
     d. For non-passthrough: getComments() regenerates from descriptions automatically
  3. Serialize as CKL XML via ChecklistResults.toCkl()
  4. saveSingleOrMultipleFiles()
  5. .then/.catch (same as above)
```

#### 5.4.3 Attestation/Comment File Export

```
User clicks Export Attestations ↓ → format menu
  Option A: "Attestations (SAF CLI)" → JSON/YAML with only AttestationData records
    1. Collect attestation records for selected files
    2. Serialize as SAF CLI compatible array (valid ControlAttestationStatus only)
    3. Compatible with `saf attest apply`

  Option B: "Full Annotations (Heimdall)" → JSON with attestations + comments
    1. Collect all attestation records + comment log entries
    2. Serialize as Heimdall annotation bundle:
       { "attestations": [AttestationData...], "comments": [CommentEntry...] }
    3. Can be reimported into Heimdall; comments section ignored by SAF CLI

  Option C: "Spreadsheet" → XLSX with all records for human review
    1. All attestations + comments in tabular format
    2. Columns: Control ID, Type (attest/comment), Status, Text, Frequency, Updated, Updated By

  All options: save file (no dirty state change — exports the overlay, not the results)
```

### 5.5 How Import Works

```
User opens LOAD → Attestations tab → uploads file
  1. Detect format by extension (.json, .yaml, .yml, .xlsx)
  2. Parse + detect payload shape:
     - XLSX: parseXLSXAttestations() → AttestationData[] (existing, tested)
     - JSON/YAML: parse, then detect shape:
       a. Array of objects with `status` field → SAF CLI attestation file → AttestationData[]
       b. Object with `{attestations: [...], comments: [...]}` → Heimdall annotation bundle
          → split into AttestationData[] + CommentEntry[]
       c. Object with `{comments: [...]}` only → comment-only file → CommentEntry[]
  3. Show preview table (includes eligibility check for attestations):
     | Control ID | Type    | Status/Text  | Matched File | Eligible | Reason |
     |------------|---------|--------------|--------------|----------|--------|
     | V-2255     | Attest  | passed       | NGINX...     | ✓ Yes    | Control is NR |
     | V-2256     | Attest  | passed       | NGINX...     | ✗ No     | Already Passed |
     | V-2257     | Comment | "See JIRA…"  | NGINX...     | ✓ Yes    | Any control |
     | V-9999     | Attest  | passed       |              | ✗ No     | Not found |
  4. User clicks Apply
  5. For each eligible attestation: annotationStore.addAttestation()
     For each comment: annotationStore.addComment()
  6. Mark affected files dirty
  7. Report: "Applied N attestations, M comments. X ineligible, Y not found."
```

### 5.6 CKL Round-Trip Detection

```
User imports a CKL file that was previously exported and edited in STIG Viewer:
  1. Normal CKL import runs (checklist-mapper.ts) → produces HDF
  2. After import, if the file was previously loaded in Heimdall:
     a. Compare new control statuses vs stored original statuses
     b. Compare new comments vs stored comments
     c. Dedup check: if an attestation already exists for the same control_id with the same status, skip (idempotent — re-importing the same CKL doesn't create duplicate records)
     d. For each NEW change detected:
        - Status change: create attestation record with
          explanation: "Status changed in external tool (STIG Viewer)"
          updated_by: "Imported from CKL"
        - Comment change: create comment entry with
          text: new comment text
          updated_by: "Imported from CKL"
     e. Show notification: "Detected N status changes and M comment updates from CKL import (X duplicates skipped)"
  3. If file was NOT previously loaded (fresh CKL import):
     - Parse comments normally (existing behavior)
     - No attestation records created (no baseline to compare against)
```

---

## 6. Existing Code Inventory

### 6.1 Already Built (this branch, committed)

| File | What | Card |
|------|------|------|
| `libs/hdf-converters/src/utils/description-editing.ts` | `setControlDescription()` — write-side complement to `getDescription()`, handles both array-form and object-form descriptions. `sanitizeCklSectionMarkers()` — prevents CKL section injection. `syncChecklistVulnComments()` — export-time CKL passthrough sync using existing typed ChecklistVuln/ChecklistObject types. | 9go.1 ✓ |
| `libs/hdf-converters/test/utils/description-editing.spec.ts` | 21 tests covering array-form, object-form, marker escaping, multi-field edits, structured comment preservation | 9go.1 ✓ |
| `libs/hdf-converters/src/utils/global.ts` | `HeimdallToolsVersion` centralized constant (DRY refactor of 31 mapper files) | cleanup ✓ |
| `apps/frontend/src/store/data_store.ts` | `updateControlDescription()` mutation — calls `setControlDescription` from hdf-converters, patches `control.hdf.descriptions` cache. `dirtyFileIds: FileID[]` tracking. Getters: `hasUnsavedFiles`, `isFileDirty`. Actions: `markFileDirty`, `markFileSaved`, `clearDirtyFiles`. Also: `UNSAVED_CHANGES_MESSAGE` constant, `getFileForControl()` helper, `databaseIdForFile`/`fileIdForDatabaseId` getters (refactored from async Actions). | 9go.2 ✓ |
| `apps/frontend/tests/unit/data_store_editing.spec.ts` | 6 tests for dirty tracking (concurrent-safe with unique IDs) | 9go.2 ✓ |

### 6.2 Already Built (uncommitted, valid wiring for dirty tracking)

| File | What |
|------|------|
| `apps/frontend/src/App.vue` | `beforeunload` event listener — checks `InspecDataModule.hasUnsavedFiles`, shows `UNSAVED_CHANGES_MESSAGE`. Added in `mounted()`, removed in `beforeDestroy()`. |
| `apps/frontend/src/components/global/ExportJson.vue` | `.then(() => InspecDataModule.markFileSaved(ids))` after `saveSingleOrMultipleFiles()`. `.catch()` with `SnackbarModule.failure()`. |
| `apps/frontend/src/components/global/sidebaritems/SidebarFileList.vue` | `isDirty` computed reads `InspecDataModule.isFileDirty(file.uniqueId)`. `mdi-content-save-alert` warning icon when dirty. `update_database_file()` method for save-back of dirty DB-backed files using `EvaluationModule.updateEvaluation()`. `file_data()` DRY helper. `disable_saving` allows save when dirty. `save_to_database()` calls `markFileSaved` after success. |

### 6.3 Existing in hdf-converters (to reuse, NOT reimplement)

| Function | File | What | Used By |
|----------|------|------|---------|
| `addAttestationToHDF(hdf, attestations)` | `src/utils/attestations.ts` | Merges attestation records into HDF. Adds `attestation_data` to controls, appends result segments via `convertAttestationToSegment()` (which handles expiration → Skipped). | Export flow (5.4.1) |
| `convertAttestationToSegment(attestation)` | `src/utils/attestations.ts` | Creates `ControlResult` from attestation. Active → passed/failed status. Expired → Skipped with "Expired Attestation" message. | Called by `addAttestationToHDF` |
| `advanceDate(date, frequency)` | `src/utils/attestations.ts` | Computes expiration. Supports: daily, every3days, weekly, every2weeks, fortnightly, monthly, quarterly, semiannually, annually, custom Nd/Nw/Nm/Ny. | Side panel frequency dropdown, expiration display |
| `createAttestationMessage(attestation, expired)` | `src/utils/attestations.ts` | Formats display message for attestation result segments | Called by `convertAttestationToSegment` |
| `attestationCanBeAdded(attestation, control)` | `src/utils/attestations.ts` | Validates: control_id matches, control has results, first result status is 'skipped'. Returns boolean. **Note: this is a private (non-exported) function.** Side panel should use `control.root.hdf.status === 'Not Reviewed'` for the UI gate instead (see §4.2). The function is still used internally by `addAttestationToHDF`. |
| `parseXLSXAttestations(xlsxData)` | `src/utils/attestations.ts` | Parses XLSX file → `Attestation[]`. Handles date objects and string dates. Column mapping is flexible (control_id/id/control, etc.). | Import flow (5.5) |
| `getComments(descriptions)` | `src/ckl-mapper/checklist-jsonix-converter.ts` | Serializes descriptions → CKL structured comment string (`CAVEAT :: ...\nCOMMENTS :: ...`) | CKL export for non-passthrough files |
| `parseComments(input)` | `src/ckl-mapper/checklist-mapper.ts` | Parses CKL structured comment string → `ControlDescription[]`. Splits on `/\n(?=[A-Z]+ ::)/`. | CKL import |
| `getDescription(descriptions, key)` | `src/utils/global.ts` | Reads from array-form `[{label, data}]` or object-form `{key: value}` descriptions. Case-insensitive. | Read-side complement to `setControlDescription` |

### 6.4 Existing in inspecjs (to reuse)

| Item | File | What |
|------|------|------|
| `AttestationData` interface | `generated_parsers/v_1_0/exec-json.ts:204` | `{control_id, explanation, frequency, status, updated, updated_by}` |
| `ControlAttestationStatus` enum | `generated_parsers/v_1_0/exec-json.ts:216` | `passed \| failed` |
| `ExecJSONControl.attestation_data` | `generated_parsers/v_1_0/exec-json.ts:152` | Optional field on every control |
| Status computation | `compat_impl/compat_inspec_1_0.ts:195` | Constructor reads `control.attestation_data` and uses `attestation_data.status` for control status computation |
| `ControlDescription` interface | `generated_parsers/v_1_0/exec-json.ts:224` | `{label: string, data: string}` |

### 6.5 Existing Frontend Components (to modify/extend)

| Component | File | Modification |
|-----------|------|-------------|
| `ControlRowHeader.vue` | `components/cards/controltable/ControlRowHeader.vue` | Add action button ([Attest]/[Comment]) in the existing `#viewed` slot area (no new column — `ResponsiveRowSwitch` has no `#actions` slot and the row is already 8 dense columns). Add indicators (💬/✓) next to status. All action buttons use `@click.stop` to prevent event bubbling to the row toggle handler. Emit `open-review-panel` event. |
| `ControlTable.vue` | `components/cards/controltable/ControlTable.vue` | Add ReviewPanel component. Handle `open-review-panel` event. Manage panel state (which control, visible). Handle prev/next navigation from ReviewPanel (navigate through `items` array). |
| `StatusCardRow.vue` | `components/cards/StatusCardRow.vue` | Add [Attest ▸] action link to Not Reviewed card. Current NR subtitle is "Can only be tested manually at this time" (line 160) — replace with actionable link. (Note: "Consider using an overlay or manual attestation" is the Waived card at line 189, not NR.) **Hidden when NR count = 0** (no controls to attest). |
| `Results.vue` | `views/Results.vue` | Add `AnnotationBar` component between status cards and charts. |
| `ExportCKLModal.vue` | `components/global/ExportCKLModal.vue` | Add `syncChecklistVulnComments()` call before `toCkl()` for CKL-passthrough files. Add `markFilesSaved` + `.catch()`. |
| `ExportJson.vue` | `components/global/ExportJson.vue` | Already wired (uncommitted). Add attestation application before export. |
| `App.vue` | `App.vue` | Already wired (uncommitted) with `beforeunload` guard. |
| `SidebarFileList.vue` | `components/global/sidebaritems/SidebarFileList.vue` | Already wired (uncommitted) with dirty indicator + save-back. |
| `UploadNexus.vue` | `components/global/UploadNexus.vue` | Add "Attestations" tab for importing attestation files. |
| `Sidebar.vue` | `components/global/Sidebar.vue` | Reference for `v-navigation-drawer` pattern (existing left-side drawer). Changelog toggle deferred to Phase 2. Coordinate with ReviewPanel via `ui` store flag (opening one closes the other). Note: `checklistView` branch has significant Sidebar changes (268 lines) — review before modifying. |

### 6.6 Comparison/Delta Utilities (to reuse in Phase 2-3)

| Item | File | Reuse For |
|------|------|-----------|
| `ComparisonContext` | `utilities/delta_util.ts` | Matches controls by ID across two evaluations. Feed revision pairs (before/after attestation) to show "what changed in this review cycle." |
| `ControlDelta` | `utilities/delta_util.ts` | Tracks header changes (ID, Status, Severity, NIST Tags) between matched controls. Extend with attestation status and comment count. |
| `ControlChange` | `utilities/delta_util.ts` | Represents a single property change with `name` and `values[]`. Reuse as-is. |
| `ControlChangeGroup` | `utilities/delta_util.ts` | Groups related changes. Add "Attestation" and "Comments" groups. |
| `CompareRow.vue` | `components/cards/comparison/CompareRow.vue` | Renders diff between matched controls. Extend to show attestation/comment changes. |
| `Compare.vue` | `views/Compare.vue` | Comparison view. Extend or create parallel "Revision History" view using same delta infrastructure. |

---

## 7. Phases and Build Order

### 7.1 Phase 1: Core Attest/Comment Engine (this PR)

**Goal:** Enable attestation and commenting in the GUI with export/import of attestation files.

**Prerequisites completed:**
- 9go.1: hdf-converters description editing helpers (21 tests) ✓
- 9go.2: Store mutation + dirty tracking (6 tests) ✓
- Dev environment cleanup: 0 warnings, 0 errors, clean startup ✓

**Cards:**

| ID | Title | sp | Depends On | Files |
|----|-------|-----|-----------|-------|
| A | Attestation/Comment Vuex Store | 5 | 9go.2 | Create: `store/annotation_store.ts`, `tests/unit/annotation_store.spec.ts`. Includes `originalStatuses` baseline snapshot, O(1) index via object-replacement. |
| A2 | Expose `fileIdForControl` public getter | 1 | — | Modify: `store/data_store.ts` + spec. Unblocks B1/C. |
| B1 | Review Side Panel — forms + save | 5 | A, A2 | Create: `components/cards/controltable/ReviewPanel.vue`, `tests/unit/ReviewPanel.spec.ts`. Mount in Results.vue. Attest (NR + Failed→NA) + Comment + Severity Override + Finding Details forms. Required-validation. Save commits to store. XSS: all text via `{{ }}`, never `v-html`. |
| B2 | Review Side Panel — history + nav + a11y | 5 | B1 | History display (newest-first). Prev/next through `ControlTable.items`. Unsaved-changes guard. Cancel/Discard. Keyboard nav (j/k/Enter/Esc). ARIA. Focus management. |
| C | Control Row Actions + Indicators | 3 | A, B1 | Modify: `ControlRowHeader.vue` (action in `#viewed` slot area, `@click.stop`), `ControlTable.vue` (event handling). NR→Attest icon, else Comment. 💬/✓ indicators from store index getters. |
| D | Notification Bar Component | 3 | A, B1 (Review All wiring) | Create: `components/cards/AnnotationBar.vue`. Modify: `views/Results.vue`. Theme vars. `role=status`. Hidden when counts=0. |
| E | NR Status Card Attest Action | 2 | B1 | Modify: `StatusCardRow.vue`. Hidden when NR count=0. Opens panel filtered to NR. |
| F | Wire dirty tracking to UI | 2 | 9go.2 | Commit uncommitted App.vue/SidebarFileList/ExportJson wiring. Verify + test. |
| G | CKL export-time sync | 3 | 9go.1, A | Modify: `ExportCKLModal.vue`. `syncChecklistVulnComments` + markSaved + `.catch`. |
| H | Export attestation files (MUST-HAVE) | 3 | A | SAF CLI JSON/YAML + Heimdall annotation bundle + XLSX. Only Phase 1 persistence — without this, refresh = total loss. |
| I | Import attestation files | 5 | A | Create: `upload_tabs/AttestationImport.vue`. Modify: `UploadNexus.vue`. Bundle/array/comment-only format detection. Eligibility preview. |
| J | CKL round-trip detection (DEFERRED) | — | — | Moved to Phase 2. Requires baseline snapshot + file identity matching that benefits from DB persistence. Complex, edge-case-heavy, low frequency. |
| K | Integration tests + fixtures + CI | 5 | All above | Adapt existing CKL/HDF fixtures. Fixtures from `libs/hdf-converters/sample_jsons/` and `apps/frontend/tests/hdf_data/`. |

**Total Phase 1:** ~42 sp, ~200 min Claude-pace

**Critical path:** A → A2 → B1 → B2/C/E. D/F/G/H/I parallel off A.

**Build order (dependency graph):**
```
9go.1 [DONE] ──────────────────────────────────┐
9go.2 [DONE] ─── A (store) ─── B (side panel) ─┤── C (row actions)
                    │              │             │── E (NR card)
                    │              │             │
                    ├── D (notif bar)            │
                    ├── H (export attestations)  │
                    ├── I (import attestations)  │
                    ├── J (CKL round-trip)       │
                    │                            │
                    F (dirty wiring) ────────────┤
                    G (CKL sync) ────────────────┤
                                                 │
                                              K (integration tests)
```

### 7.2 Phase 2: Server Persistence + Collaboration

**Goal:** Persist attestation/comment records in the DB. Revision history. Final state.

| ID | Title | Depends On |
|----|-------|-----------|
| L | DB schema: evaluation_revisions + attestation_records tables | Phase 1 |
| M | Backend API: attestation CRUD endpoints | L |
| N | Save revision (not overwrite) — each save creates a new revision | L, M |
| O | Draft / In Review / Final state machine on evaluation | L, M |
| P | Lock on Final — no edits allowed, export only | O |
| Q | Revision diff view using ComparisonContext/ControlDelta | L, N |

### 7.3 Phase 3: Enterprise Workflows

**Goal:** Approval chains, bulk operations, advanced export, notifications.

| ID | Title | Depends On |
|----|-------|-----------|
| R | Approval workflows (reviewed_by, review_status distinct from updated_by) | Phase 2 |
| S | POA&M / eMASS export format (FedRAMP fields, milestone dates) | Phase 2 |
| T | Bulk attestation (select multiple NR controls, attest all with same explanation) | Phase 1 B |
| U | Expiring attestation dashboard (controls nearing re-review) | Phase 1 A |
| V | Notification when someone else edits a shared evaluation | Phase 2 |
| W | Extend attestationCanBeAdded for failed controls (false positive, risk acceptance) | Phase 1 A |

---

## 7.4 Approval Flow Design (Phase 3, Card R)

The approval flow adds a **review gate** between an attestation being submitted and it taking effect. This is required for DISA/FedRAMP compliance where attestations must be approved by an authorized official (ISSO, ISSM, AO).

### 7.4.1 Roles

| Role | Can Attest | Can Comment | Can Approve | Can Mark Final |
|------|-----------|-------------|-------------|----------------|
| Viewer | No | Yes (read + comment) | No | No |
| Reviewer | Yes | Yes | No | No |
| Approver (ISSO) | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes |

These map to Heimdall's existing RBAC roles. Phase 3 extends the role model with approval permissions.

### 7.4.2 Attestation States

```
                    ┌─────────┐
    Reviewer        │ PENDING │  Attestation submitted but not yet approved
    submits    ────▸│         │
                    └────┬────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
         ┌────▼────┐ ┌──▼───┐ ┌───▼────┐
         │APPROVED │ │REJECT│ │REVISION│  Approver requests changes
         │         │ │      │ │REQUESTED│
         └────┬────┘ └──┬───┘ └───┬────┘
              │         │         │
              │    ┌────▼────┐    │
              │    │ REMOVED │    │──▸ Reviewer revises → back to PENDING
              │    │         │    │
              │    └─────────┘    │
         ┌────▼────┐
         │ ACTIVE  │  Applied to compliance score
         │         │  Visible in exports
         │         │  Has expiration date
         └────┬────┘
              │ advanceDate() past expiration
         ┌────▼────┐
         │ EXPIRED │  Reverts to Not Reviewed
         │         │  Needs re-attestation
         └─────────┘
```

### 7.4.3 Extended Attestation Record (Phase 3)

```typescript
interface AttestationRecordV2 extends AttestationData {
  // Phase 1 fields (from AttestationData):
  control_id: string;
  status: ControlAttestationStatus;
  explanation: string;
  frequency: string;
  updated: string;
  updated_by: string;

  // Phase 3 approval fields:
  review_status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  reviewed_by?: string;           // who approved/rejected
  reviewed_at?: string;           // when
  review_comment?: string;        // approval/rejection reason

  // Phase 3 classification fields (from research):
  reason_type?: 'manual_verification' | 'false_positive' | 'risk_acceptance'
              | 'operational_requirement' | 'compensating_control' | 'not_applicable';

  // Phase 3 risk fields (for eMASS/FedRAMP):
  residual_risk_level?: string;
  mitigations?: string;
  scheduled_completion_date?: string;  // for risk acceptance with remediation plan
}
```

### 7.4.4 Approval Workflow

```
Reviewer opens control → attests (Passed, explanation, frequency)
  → attestation saved with review_status: 'pending'
  → NOT applied to compliance score yet
  → visible in side panel with ⏳ pending indicator

Approver opens same evaluation → sees pending attestations in notification bar
  → "3 attestations pending approval"
  → opens Review All → sees each pending attestation
  → for each: [Approve] [Reject] [Request Revision]
  → Approve: review_status → 'approved', reviewed_by/at populated
    → attestation becomes ACTIVE, applied to compliance score
  → Reject: review_status → 'rejected', review_comment required
    → attestation removed from pending, reviewer notified
  → Request Revision: review_status → 'revision_requested', review_comment required
    → reviewer sees "revision requested" with feedback, can revise and resubmit
```

### 7.4.5 How This Maps to Industry Standards

| Heimdall | eMASS | FedRAMP | OSCAL |
|----------|-------|---------|-------|
| `review_status: pending` | Not Approved | Pending | open |
| `review_status: approved` | Approved | Approved | deviation-approved |
| `review_status: rejected` | Not Approved (with comment) | Rejected | deviation-rejected |
| `reason_type: false_positive` | N/A | FP column | deviation-type: FP |
| `reason_type: risk_acceptance` | Risk Accepted | RA column | deviation-type: RA |
| `reason_type: operational_requirement` | N/A | OR column | deviation-type: OR |
| `scheduled_completion_date` | scheduledCompletionDate | Scheduled Completion | deadline |
| `residual_risk_level` | residualRiskLevel | Adjusted Risk Rating | characterization |

### 7.4.6 Phase 1 Foundation for Approval

Phase 1 builds the data structures to support approval without implementing it:

- `AttestationData` records are stored in the annotation store — Phase 3 adds `review_status` field
- The side panel shows attestation history — Phase 3 adds approval actions
- The notification bar shows pending counts — Phase 3 distinguishes "pending my review" from "pending approval"
- Export includes attestation records — Phase 3 includes review_status in the export

**The key architectural decision:** attestation records are separate entities, not embedded in the HDF. This means adding approval fields later is a non-breaking extension — just add columns to the attestation record.

---

## 8. Consequences

### 8.1 Positive

- Heimdall becomes the single source of truth for compliance review
- Replaces error-prone CKL-email-STIG-Viewer loop with URL-based collaboration
- Full audit trail: who attested/commented what, when, with what explanation
- SAF CLI interoperable: export/import attestation files for `saf attest apply`
- Immutable original preserves scan integrity for audit
- Existing attestation infrastructure fully reused (addAttestationToHDF, advanceDate, parseXLSXAttestations, etc.)
- Comment log accumulates across review cycles — nothing lost
- CKL round-trip supported — users can still use STIG Viewer when needed

### 8.2 Risks

- **Phase 1 durability is weak:** Attestation/comment records live in Vuex only — lost on page refresh, browser crash, or SPA navigation that remounts the app. `beforeunload` fires on tab close but NOT on all loss scenarios. Users MUST export attestation files to preserve work. The notification bar should warn prominently when there are unsaved annotations. This is acceptable for MVP validation but unacceptable for production use — Phase 2 DB persistence is critical.
- CKL round-trip comment detection may have edge cases with non-standard CKL formats or CKLs from tools other than STIG Viewer.
- The side panel UX is a new pattern for Heimdall — needs Playwright testing with real compliance workflows to validate usability.
- `attestationCanBeAdded()` only allows NR controls — users wanting to mark Failed as false positive must wait for Phase 3 card W.
- **Compliance score does not update live in Phase 1** — attestations are applied at export time via `addAttestationToHDF`. The in-browser score/status display shows the original scan status. Phase 2 can recompute by applying attestations to a display clone.

### 8.3 Tradeoffs

| Decision | Chosen | Alternative | Why |
|----------|--------|-------------|-----|
| Review UI | Right-side panel | Modal dialog | Panel keeps results visible, supports prev/next navigation through controls, matches STIG Viewer workflow |
| Attestation format | SAF CLI 6-field format | Extended format with reason_type, reviewed_by | Interoperability with existing `saf attest apply` toolchain; extended fields added in Phase 3 |
| Phase 1 persistence | Vuex store + exportable files | DB from the start | Ship faster, validate UX before building DB schema; file export ensures no data loss |
| Data integrity | Separate annotation records + display mutations | Pure immutability (overlay-only at export) | Pure immutability would require re-contextualizing controls after every edit (expensive) or showing stale data. Display mutations + separate records gives both live display AND audit trail. See §5.1. |
| Comment model | Append-only log | Single editable string | Audit trail — every comment from every reviewer preserved with timestamp |
| CKL sync timing | Export time | Edit time | No per-keystroke cost; CKL format knowledge stays in hdf-converters, not in Vuex store |
