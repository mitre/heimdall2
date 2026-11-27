# ADR-010: Export HDF v2 evaluations as OSCAL POA&M documents

**Date:** 2026-10-21
**Status:** Proposed for team review. User-established scope decisions are recorded separately from recommendations awaiting review.
**Deciders:** Heimdall and SAF CLI maintainers; individual reviewers to be assigned.
**Implementation branch:** `feat/poam-export`
**Related tracking:** `heimdall2-gt11`. The existing epic still describes the earlier spreadsheet proposal; leave it unchanged until the user requests reconciliation after ADR review.

## 1. Context

Heimdall users can review security evaluations and export several formats, but lack a POA&M export. SAF CLI supplies `convert ckl2poam`, which generates a template-based Excel workbook through code local to the SAF repository. Organizations often have different POA&M spreadsheets and field definitions. The user has selected an OSCAL Plan of Action and Milestones document as the pilot's output contract so the export has a recognizable, standardized structure instead of adopting one organization's spreadsheet conventions.

The pilot converts general HDF evaluations, including CKL-derived evaluations, using Heimdall's existing HDF v2 schemas. It must work in Lite and Server without changing SAF CLI or migrating Heimdall to the newer HDF schema under development in hdf-libs. This ADR proposes implementation details and a later SAF integration strategy for team review.

### 1.1 User-established scope

- Target an **OSCAL POA&M document**. This draft proposes JSON serialization as the concrete downloadable artifact; an OSCAL intermediate followed by a spreadsheet is not the pilot design.
- Support general HDF v2/ExecJSON evaluations, including inputs without CKL passthrough.
- Exclude output-column customization, custom field definitions, organization-specific formats and template customization. Provide one documented mapping to the selected OSCAL version.
- Keep Heimdall's HDF v2 schema and existing inspecjs contracts. Do not introduce hdf-libs's Amendments document type or make schema migration a dependency.
- SAF source may be copied/adapted where useful, but SAF CLI itself remains unchanged during the pilot.
- Prepare a proposed ADR for team debate before creating child cards. Leave the beads board unchanged for now.

### 1.2 Inspected implementation evidence

The investigation inspected Heimdall baseline `e0d6e4a1d2f26f6ab8d7705b4a6510caf571ba69` and SAF checkout `8037c3900b93c95c9cbcf230b682e0eefddcdc29`. These are local revisions, not claims about the latest release.

- SAF's `src/commands/convert/ckl2poam.ts` parses CKL, prompts for organization/device metadata and fills a bundled `.xlsm`. `src/utils/ckl2poam.ts` contains severity/status/control mapping and text helpers. Those spreadsheet-specific choices are reference behavior, not this pilot's output requirements.
- The original SAF feature was [PR #40](https://github.com/mitre/saf/pull/40), [commit 7293b26c](https://github.com/mitre/saf/commit/7293b26c44dee145dba9f7cf11452714fa5afe24), authored by `camdenmoors` on 2022-01-18. If code is copied, record the actual copied revision and applicable attribution/license information.
- Heimdall's `libs/hdf-converters/src/converters-from-hdf/caat/reverse-caat-mapper.ts` demonstrates accepting HDF strings, execution objects and contextualized evaluations. `apps/frontend/src/components/global/ExportCaat.vue` supplies filtered controls to a library converter.
- SAF's `src/commands/convert/hdf2caat.ts` imports that shared converter from `@mitre/hdf-converters`. This is the existing package-consumption pattern for future SAF integration.
- `apps/frontend/src/views/Results.vue` hosts exports; `apps/frontend/src/utilities/export_util.ts` downloads strings/binary data and ZIPs multiple outputs. Existing Vue 2/Vuetify dialogs and Vitest tests provide implementation patterns.
- `libs/inspecjs/src/compat_wrappers.ts` defines HDF statuses and severity accessors. Its NIST convenience methods may introduce synthetic `UM-1`; the export must distinguish actual source mappings from that fallback.

The initial investigation also inspected SAF's macro-enabled workbook and performed a limited browser-bundle experiment under Node. Workbook fidelity, VBA, cell formatting, spreadsheet engines and template packaging are no longer implementation requirements for this pilot. Do not carry that earlier feasibility work into the acceptance criteria.

### 1.3 OSCAL reference and schema boundary

Use NIST's [OSCAL 1.2.3 release](https://github.com/usnistgov/OSCAL/releases/tag/v1.2.3) and its `oscal_poam_schema.json` as the proposed pinned validation target. This is a reproducible proposed version, not a claim that every consumer supports it or that it is the latest version. Confirm the team's required consumer/version before accepting this ADR. OSCAL standardizes structure; it does not guarantee organizational acceptance or eliminate the need to validate mapping semantics.

The schema inspected for 1.2.3 requires a top-level POA&M UUID, metadata and POA&M items. Risk objects require UUID, title, description, statement and status. Metadata requires title, last-modified, document version and OSCAL version. Related-object references must also be semantically consistent; JSON Schema validation alone does not prove that UUID references resolve or that a risk statement accurately reflects source evidence.

The beta [mitre/hdf-libs repository](https://github.com/mitre/hdf-libs), inspected at main revision `085013b6053ae32a993d155f6fa358a922727984`, contains:

- A [TypeScript HDF-to-OSCAL POA&M converter](https://github.com/mitre/hdf-libs/blob/085013b6053ae32a993d155f6fa358a922727984/hdf-converters/converters/hdf-to-oscal-poam/typescript/converter.ts), with a Go peer, that maps HDF Amendments overrides into OSCAL POA&M JSON.
- Mapping for linked risks/items, milestones, evidence, attribution, CVSS and review dates.
- [Schema/round-trip tests](https://github.com/mitre/hdf-libs/blob/085013b6053ae32a993d155f6fa358a922727984/hdf-converters/converters/hdf-to-oscal-poam/typescript/schema-validation.test.ts) against vendored OSCAL 1.1.2 and 1.2.3 schemas. These tests were inspected, not executed in this investigation.
- A reverse OSCAL POA&M importer and `dev-docs/adr-0014-oscal-namespace-and-prose-carriage.md`, which must be read before adopting that implementation's conventions.

The user confirmed that hdf-libs's updated HDF schema is under active development and its Amendments type does not exist in Heimdall's HDF v2. Sharing the OSCAL output target does not remove this input-schema incompatibility. Use that code for conceptual and test-design reference; do not synthesize amendment overrides from evaluation findings or import its dependency graph without a separately justified compatibility assessment. No hdf-libs changes or direct adoption are planned in this pilot.

### 1.4 ADR numbering

A review of 184 local and remote-tracking refs on 2026-10-21, after fetching origin, found the highest existing number was ADR-009. ADR-008 (frontend data loading) and ADR-009 (Tenable proxy SSRF controls) appear on origin/feature/fips-compliant-password-hashing and origin/feat/rpm-integrated-install. This draft follows their `docs/adrs/adr-NNN` convention. Two distinct ADR-002 documents already exist; resolving that collision is outside this proposal.

## 2. Decision proposed

Implement an HDF v2-to-OSCAL POA&M converter in `@mitre/hdf-converters`, with one fixed mapping contract and JSON output validated against a pinned NIST schema. Add a Heimdall export dialog that supplies selected evaluations/options, presents diagnostics and downloads the generated documents locally.

Separate normalization, policy, OSCAL object construction and serialization so mapping is testable without Vue or filesystem access. Treat SAF's generator as useful CKL-related reference and hdf-libs's generator as useful OSCAL reference; neither is a drop-in implementation of HDF v2 evaluation-to-OSCAL conversion.

### 2.1 Proposed public contract

Proposed facade: `FromHDFToOSCALPOAMMapper`, exported from `libs/hdf-converters/index.ts`. Accept HDF JSON, `ExecJSON.Execution` or a contextualized evaluation, plus explicit selected controls and validated export metadata. An undefined subset means all eligible controls; an empty subset means none. Validate that selected controls belong to the supplied evaluation.

Return a typed OSCAL document, serialized JSON, diagnostics and included/excluded counts. Finalize exact signatures before implementation. Keep UUID generation and the export clock injectable for deterministic tests. The facade must not expose Vue, Oclif, terminal prompts or Node filesystem requirements.

Generate one `.oscal-poam.json` per evaluation, and ZIP documents for multiple evaluations using the existing download utility. Do not merge evaluations/hosts or change the user's stored results. If no eligible items remain, show an explanation rather than manufacturing an empty or misleading POA&M.

### 2.2 Mapping to OSCAL

The following mapping rules are recommendations for team review, constrained by the user-established OSCAL target:

- **Metadata:** use a user-confirmed document title, an exporter document version, the pinned OSCAL version and export timestamp. Distinguish the export timestamp from assessment collection time. Supply actual preparer/organization information only when available or explicitly entered; do not invent approval or authorization.
- **Scope:** create one item per distinct eligible control/root within an evaluation. Preserve owning profile and source identity. Resolve overlays through contextual relationships; never collapse unrelated controls because they share a textual ID.
- **Items, risks and observations:** build POA&M items linked to risks and supporting observations using valid UUID references. A failed assessment supports an open assessment-derived risk; it does not establish a quantified business impact or approved remediation plan. Descriptions/statements must identify source facts and explicitly describe missing impact analysis when necessary, rather than fabricate it.
- **Source authority:** use current contextualized HDF values. CKL passthrough can fill otherwise missing provenance and original checklist detail, but must not overwrite later edits.
- **Evidence:** preserve structured result details, meaningful comments and available evidence references in appropriate OSCAL fields. Do not parse inspecjs's unstable display message as a data format. Use actual collection dates where available; if required dates need user input, request it rather than assigning the export date as though it were assessment evidence.
- **Control references:** prefer real explicit NIST references; otherwise map all CCIs with existing mapping data and preserve source identifiers. Never emit `UM-1` as a genuine mapping. Preserve multiple references without creating duplicate risks solely for each mapping. Use native OSCAL structures where their semantics fit; retain source identifiers in fixed source-provenance remarks when formal references cannot be established. Do not manufacture SSP statement/objective IDs to populate an optional finding object.
- **System context:** include a real system identifier or SSP reference when supplied and appropriate to the selected OSCAL version. Omit optional unavailable context; do not emit a fictitious SSP URL or `#` as a claimed imported system plan.
- **Severity and assessment:** retain effective HDF severity, including supported overrides. Do not collapse critical into high just because SAF's spreadsheet did, or derive likelihood/residual risk from severity. Use standards-defined characterizations only when source data supports them; otherwise preserve severity as factual source detail in native remarks. Do not invent CVSS scores or organizational risk decisions.
- **Remediation and deadlines:** map actual fix descriptions and available remediation information. Collect a deadline only if the user chooses to provide one; do not silently set every item one year ahead. No milestone editing or manufactured milestones are included.
- **Missing fields:** omit optional absent fields and report actionable diagnostics. If a required OSCAL value cannot be supplied truthfully, block export with an explanation or obtain explicit user input. Define and test fixed missing-description wording where source-derived fallback text is appropriate.
- **Text:** preserve Unicode and useful punctuation/newlines with safe JSON serialization and correct handling of OSCAL prose constraints. No spreadsheet escaping, cell-length truncation or SAF punctuation substitutions apply.

Use OSCAL's native schema fields and a fixed documented mapping. Arbitrary properties, field-definition editors, organization-specific profiles and configurable extension vocabularies are excluded. If a source field lacks a truthful native representation, document the fixed provenance/remarks treatment or report an omission instead of adding a custom field definition.

### 2.3 Proposed status policy

Use OSCAL risk statuses rather than SAF spreadsheet labels. Proposed defaults:

- `Failed`: include, with risk status `open`, linked assessment evidence and source status retained.
- `Passed`: exclude from the open-risk export; do not create closed risks without tracked risk history.
- `Not Applicable`: exclude with a count/diagnostic. Inapplicability alone does not establish an open risk, and OSCAL risk status must not be set to a spreadsheet's Not Applicable label.
- `Not Reviewed`: exclude with an explicit count/diagnostic; absence of assessment is not a confirmed vulnerability.
- `Profile Error`: exclude with a distinct visible diagnostic; an execution error is not an assessed vulnerability.
- `From Profile`: reject guidance-only input because it lacks evaluated results.
- Waivers/attestations: trace existing HDF v2 behavior and settle treatment in Phase 1. Preserve explanations; do not infer OSCAL `deviation-approved` from an unverified waiver label or equate a waiver with remediation.

The change from SAF's inclusion of Not Applicable is intentional proposed OSCAL policy. Confirm it during review and keep counts visible. This pilot is a snapshot exporter, not a system for managing risk lifecycle or reconciling previous exports.

### 2.4 UI and packaging

Follow current Vue 2/Vuetify export-dialog patterns. Show selected evaluations, eligible/excluded counts and diagnostics. Offer an explicit choice between the current filter scope and entire selected evaluations, defaulting to the current filter scope. Collect only actual document/system/preparer metadata and optional remediation deadline needed by the fixed contract. No template selector, column editor, field mapping editor, spreadsheet spacing option or organization-specific preset is included.

Generate and validate locally in Lite and Server, including offline use after application loading. Package the pinned schema and validator without runtime downloads. First inspect existing validation facilities and choose a browser-compatible JSON Schema validator that supports the pinned schema dialect; reuse existing dependencies where suitable. Explain any new dependency and measure its bundle impact. NIST's schema supplies the structure; schema validation and semantic reference checks are both required.

### 2.5 SAF CLI integration after the pilot

Recommend eventual consumption of the shared converter through SAF's existing package mechanism, subject to separate team authorization and a converter release. Keep SAF unchanged during the pilot.

The output change makes the earlier idea of replacing SAF's existing generator directly inappropriate: `ckl2poam` currently promises a spreadsheet. **Do not silently change that command to emit OSCAL JSON.** Team options are:

1. Add separately named HDF-to-OSCAL-POA&M and optionally CKL-to-OSCAL-POA&M commands that import the shared HDF v2 converter. Existing spreadsheet commands continue unchanged.
2. Add an explicitly selected OSCAL output option, preserving the existing spreadsheet default and its flags. Document how format-specific options are validated.
3. Make a documented breaking output change only through an explicit versioning/deprecation decision outside this pilot.

Prefer a new, clearly named OSCAL command initially. A future CKL adapter should use the existing CKL-to-HDF v2 path and prove preservation of findings, comments, multiple CCIs, severity overrides and per-STIG provenance before calling the shared converter.

An OSCAL converter does not replace the Excel renderer. Keep SAF spreadsheet code/template while that command remains supported; remove duplicated helpers only when actual callers have migrated and no other command needs them. The realistic shared ownership goal is one OSCAL implementation across products, not a claim that all spreadsheet-specific code disappears. No SAF code or release changes are authorized here.

## 3. Alternatives considered

### 3.1 Standard OSCAL POA&M JSON from HDF v2 — recommended

Benefits: a defined public model, schema-based validation, recognizable risk/item/evidence structures, and reusable output across tools. Costs: evaluation-to-risk semantics still require decisions; organizational consumers may impose additional constraints. Schema-valid output is not proof of acceptance by every agency or eMASS instance.

### 3.2 Port SAF's spreadsheet generator as the pilot output

Benefits: matches the original CLI artifact and existing user workflows. Costs: adopts a particular workbook contract, adds template/engine fidelity work and does not address varying organizational definitions. Not selected: the user chose OSCAL as the target. SAF code remains reference material where applicable.

### 3.3 OSCAL intermediate with customizable spreadsheet output

Benefits: could support multiple organizations later. Costs: requires renderer/template configuration and creates another output contract. Not selected for this pilot; both spreadsheet rendering and output column/field customization are excluded.

### 3.4 Directly import hdf-libs's converter

Benefits: existing OSCAL mapping and schema-oriented tests. Costs: it consumes newer-schema Amendments, not HDF v2 evaluations. Manufacturing amendments or migrating the application would change scope and meaning. Use conceptual/test reference; adapt compatible ideas and attributed code only after verifying their contracts. Direct package adoption is outside this pilot.

### 3.5 Call SAF through a backend endpoint

Benefits: reuses the existing command. Costs: produces the wrong pilot artifact, excludes standalone Lite and adds server processing/dependencies. Existing client-side library/export patterns meet the goal without a new API.

### 3.6 Separate POA&M-only package or permanent per-product copies

A new package could isolate releases but adds another ownership/release surface without demonstrated need. Permanent copies allow independent shipping but duplicate OSCAL semantics and fixes. Start in `@mitre/hdf-converters` and propose eventual SAF adoption; revisit package boundaries only if actual dependency/ownership constraints justify it.

### 3.7 Do nothing

No implementation cost, but Heimdall still cannot produce POA&M output and users must leave the application for a CKL-specific spreadsheet workflow. Retain as a fallback if the team does not approve the effort.

## 4. Consequences and risks

The pilot delivers an OSCAL JSON artifact rather than an Excel workbook. Template ownership, macros, formatting and column customization drop out of implementation. The remaining responsibility is an honest, documented HDF v2-to-OSCAL mapping with schema/semantic validation, clear missing-data handling and offline packaging.

- General HDF assessment results do not necessarily contain risk statements, system plans, deadlines or approvals. Preserve evidence and distinguish missing analysis from asserted facts; do not fill fields with organizational assumptions.
- Shared output does not make hdf-libs's newer input schema backportable. Keep the HDF v2 boundary explicit and test input without Amendments or CKL passthrough.
- Incorrect references can survive JSON Schema validation. Check UUID uniqueness, reference resolution, source ownership and actual SSP/objective references separately.
- Consumers may require an OSCAL version or profile different from the pilot. Pin one version, name the representative consumer and record tested limits; do not add per-organization field customization to satisfy every variation.
- Schema/validator code and batch generation can affect bundle size and responsiveness. Measure representative workloads; lazy-load the feature where feasible. Introduce a worker only if measurements justify it.
- SAF's existing spreadsheet behavior is not compatible with silent format replacement. Keep future OSCAL adoption explicit and separately authorized.

## 5. Quality standards

All implementation phases and eventual child cards inherit these constraints:

- Use existing mapper/input-normalization/export-dialog/download patterns; extend shared utilities instead of copying variants. No backend, database or HDF-schema migration is planned.
- Write failing tests before production code. Assert actual OSCAL fields, excluded statuses, diagnostics and references, not just file existence or JSON parseability.
- Vendor the exact official NIST schema with version, source URL, digest and required attribution/license information. Keep references resolvable offline and validate using the declared JSON Schema dialect. Do not weaken the schema or disable checks to make output pass.
- Use a fixed OSCAL contract. No custom columns, field definitions, template plugins or organization-specific schemas. Test unknown/unmapped inputs through the documented fixed policy.
- Validate HDF input, control membership, metadata, dates, identifiers and options at the library boundary. Do not log findings, execute source content, fetch source URLs/SSPs, or send assessments externally. UI rendering must escape imported text.
- Export a snapshot without changing Vuex records or stored evaluations. Test stale CKL passthrough against current values, duplicate IDs across profiles, overlays and input immutability.
- Use Vuetify components and current design conventions. Verify keyboard operation, focus return, labels, screen reader/error announcements, busy state and light/dark screenshots.
- Run unit/component tests and actual builds: Vitest transpilation alone does not typecheck Vue or establish browser compatibility. Shared-store component tests must run sequentially.
- Measure compressed bundle delta and generation/validation time for 100, 1,000 and 10,000 controls and batch ZIP output. Proposed target: within five seconds for 1,000 controls on a recorded reference machine, with visible busy/error feedback. Agree final budget in Phase 1.
- Inject UUID/clock sources for reproducible tests, use independent schema and semantic checks, and verify Node plus actual browser operation. Package schema/validation assets offline.
- No persisted data migration is needed. Reverting the export UI and converter is the rollback path.

## 6. Shared abstractions

Build once before UI integration:

- HDF v2 adapter: normalize evaluation/control selection and preserve source identity/current values.
- Typed `OSCALPOAMOptions` and diagnostics: document metadata, optional actual system/deadline data, fixed policy, actionable errors and counts.
- OSCAL POA&M document types/object builder: native items, risks, observations, metadata and references; do not introduce an Amendments intermediate.
- Validator: pinned schema validation plus semantic UUID/reference checks, usable from browser and Node.
- Fixture/test helpers: fixed clock/UUID sources, general and CKL-derived HDF v2 inputs, expected OSCAL documents and adversarial cases independent of builder internals.

Prefer small modules over a generalized export plugin framework. Finalize signatures and exact dependency choices in Phase 1.

## 7. Implementation plan

### 7.1 Scope and sequencing

Phases 1–4 modify Heimdall only. Phase 5 describes future SAF options requiring separate authorization. Do not create child cards or reconcile the epic during this documentation-only task.

In scope: HDF v2 evaluation-to-OSCAL POA&M, JSON serialization, local frontend export, selection/metadata/diagnostics, schema and semantic validation, tests and usage documentation. Out of scope: Excel/CSV rendering, template work, column or field customization, organization-specific profiles, HDF schema migration, Amendments, direct hdf-libs adoption, POA&M editing/persistence, milestone management, OSCAL import/XML/YAML variants, direct eMASS submission and unrelated refactors.

### 7.2 Phase 1: Establish the OSCAL contract and validation

Dependencies: team review of unresolved Section 8 questions; user-established scope is already fixed. Start with a failing schema test accepting a minimal valid reference POA&M and rejecting missing required fields/dangling references.

Files: update this ADR; create `libs/hdf-converters/src/converters-from-hdf/poam/oscal-poam-types.ts`, `libs/hdf-converters/src/converters-from-hdf/poam/oscal-poam-validation.ts`, `libs/hdf-converters/schemas/oscal/1.2.3/oscal_poam_schema.json`, `libs/hdf-converters/schemas/oscal/1.2.3/provenance.json`, `libs/hdf-converters/test/mappers/reverse/oscal_poam_schema.spec.ts` and fixtures under `libs/hdf-converters/sample_jsons/oscal_poam_reverse_mapper/`. Versioned paths change only if review selects a different OSCAL version. Modify converter package/lockfile only for justified validator/type dependencies and offline schema packaging.

Acceptance criteria:

- [ ] Pin approved NIST schema/version/dialect and record provenance. Prove standalone package and browser/Node validation without network fetches or hdf-libs runtime dependencies.
- [ ] Define native-field mapping, required metadata/fallbacks, status policy, waiver treatment and missing-data diagnostics for HDF v2. Consult hdf-libs's tests/design without requiring Amendments.
- [ ] Independent tests reject missing required fields, malformed identifiers, duplicate UUIDs and unresolved local references. No custom field definitions or organization-specific schema are introduced.

Verification: `yarn hdf-converters test:ci && yarn hdf-converters build && yarn frontend build`; inspect package contents in a temporary consumer using a protected packaging workflow, because existing packaging hooks rewrite the working manifest.

### 7.3 Phase 2: Implement HDF v2-to-OSCAL conversion

Dependencies: Phase 1 contract. First failing converter test: a failed HDF v2 control without CKL passthrough produces a schema-valid POA&M item, open risk and supporting observation with resolving references.

Files: create `libs/hdf-converters/src/converters-from-hdf/poam/reverse-oscal-poam-mapper.ts` and `libs/hdf-converters/test/mappers/reverse/oscal_poam_reverse_mapper.spec.ts`; extend Phase 1 types/validation and fixtures; modify `libs/hdf-converters/index.ts` to expose the agreed facade.

Acceptance criteria:

- [ ] General and CKL-derived HDF v2 use one fixed mapping and return a typed document, JSON, diagnostics and counts. No Amendments, workbook renderer, terminal prompts or filesystem dependency enter the converter.
- [ ] Test all supported statuses/severities, overrides, multiple/unknown mappings, Unicode, missing metadata, absent descriptions, stale passthrough, overlays and duplicate control IDs across profiles. Preserve critical severity and source provenance without invented assessments or SSP references.
- [ ] Empty subsets stay empty; invalid membership/options fail predictably; source data is unchanged. UUID/clock injection yields stable semantic expectations.
- [ ] Schema and semantic checks pass against expected fields/references. Required data gaps block or request input according to documented policy; exclusions and optional omissions remain visible.

Verification: `yarn hdf-converters test:ci && yarn hdf-converters build` plus public-entry-point invocation from a temporary Node consumer.

### 7.4 Phase 3: Integrate Heimdall export

Dependencies: Phase 2 public contract. First failing component test: selected evaluation/options produce a validated `.oscal-poam.json` download and visible diagnostics.

Files: create `apps/frontend/src/components/global/ExportPOAMModal.vue` and `apps/frontend/tests/unit/ExportPOAMModal.spec.ts`; modify `apps/frontend/src/views/Results.vue` and `apps/frontend/tests/unit/Results.spec.ts`. Reuse `saveSingleOrMultipleFiles`; extend the shared utility only for a demonstrated requirement, with regression tests.

Acceptance criteria:

- [ ] The menu names OSCAL POA&M, supports fixed metadata/filter scope and shows eligible/excluded counts, blocking errors and actionable warnings. It contains no column/field customization or template options.
- [ ] Single selection downloads one `.oscal-poam.json`; multiple selections create a ZIP with safe unique names. Empty eligible sets explain why export is unavailable. Busy state prevents duplicate requests; errors preserve entered values.
- [ ] Tests cover selection, invalid metadata, cancellation/failure and actual validation/download integration. Shared-store tests run sequentially; stored evaluations remain unchanged.
- [ ] Keyboard, screen reader, light/dark and real-browser verification pass in Lite and Server without new endpoints or network generation.

Verification: `yarn frontend test:ci && yarn frontend build`; live exports of general and CKL-derived HDF v2 fixtures with validation of downloaded JSON and every ZIP member.

### 7.5 Phase 4: Validate and document the pilot

Dependencies: Phases 1–3. Extend existing phase tests for any remaining acceptance gaps. Create `docs/poam-export-pilot.md` after confirming documentation placement; update this ADR and preceding fixtures/tests as needed.

Acceptance criteria:

- [ ] Downloaded single/batch documents pass pinned schema and semantic checks. A named representative OSCAL consumer/tool is exercised when available; document exactly which interoperability claims were tested.
- [ ] General HDF v2, CKL-derived, multi-profile and batch cases work in Lite/Server. Existing exports regress neither behavior nor builds.
- [ ] Record bundle/performance measurements against the agreed budget and resolve gaps before acceptance.
- [ ] Usage documentation states the OSCAL version, fixed mapping, missing-data/exclusion behavior and limits. No claim of universal organizational/eMASS acceptance or SAF spreadsheet parity is made.

Verification: `yarn hdf-converters test:ci && yarn hdf-converters build && yarn frontend test:ci && yarn frontend build`, changed-file lint and live download validation. Use CI's service setup where existing converter integration tests need it; do not omit failures to claim a full regression pass.

### 7.6 Phase 5: Separately authorized SAF integration

Dependencies: accepted shared API, published converter release and team selection of a command/output compatibility strategy. Outside pilot completion.

Potential future SAF files: new `src/commands/convert/hdf2oscalpoam.ts`, optional CKL adapter, matching command tests, `package.json` and actual lockfile. These are proposed command names/paths, not existing interfaces. Existing `ckl2poam` files change only under a separately approved compatibility decision.

Acceptance criteria:

- [ ] SAF imports the released converter and produces equivalent OSCAL content for equivalent HDF v2 inputs/options; validates commands with real files and independent schema/reference checks.
- [ ] Existing spreadsheet command behavior remains unchanged unless an explicit breaking-change decision authorizes otherwise. Preserve spreadsheet-only code/template while still needed.
- [ ] Record command names, flags, package version, source/CLI compatibility and migration ownership before implementation.

Future verification: SAF `npm run test:ci`, `npm run prepack`, changed-file lint and live command invocations in a temporary output directory. Refine exact commands in future authorized cards.

### 7.7 Verification and LOE

Heimdall converter/frontend CI supplies the automated test/build commands above. Run `yarn exec eslint --max-warnings 0` on exact changed files, including Markdown. Root `lint:ci` currently ends with `|| true`; its exit code alone does not prove lint passed. For this ADR-only change, run document lint and inspect the diff; application tests/builds apply during implementation.

The previous 10–15-day estimate covered a spreadsheet pilot and must not be presented as a measured OSCAL estimate. A revised provisional range is **8–13 hands-on engineering days**, excluding SAF work, release scheduling and team-review turnaround: 1–2 days for contract/schema/validation proof, 3–4 for HDF v2 mapping, 2–3 for UI, and 2–4 for interoperability/regression/documentation. Workbook complexity is removed, but truthful risk/evidence mapping and semantic validation remain substantial work. Re-estimate after Phase 1, particularly if consumer-required metadata or waiver semantics expand the contract.

## 8. Team review agenda and acceptance record

The OSCAL target, HDF v2 boundary and exclusion of customization are established by the user. Resolve the following proposed details before child-card creation:

- [ ] Confirm OSCAL JSON serialization and pinned version (proposed 1.2.3), required validation dialect and named representative consumer. Do not reopen custom columns/fields as pilot scope.
- [ ] Approve risk/item/observation mapping, status exclusions, waiver treatment and handling of required data that HDF v2 may lack.
- [ ] Approve fixed native-field/provenance treatment for NIST/CCI/rule IDs and severity without inventing SSP objectives, CVSS or custom field definitions.
- [ ] Decide required user-entered document/system/preparer metadata and truthful missing-description/date behavior. Organizational risk defaults and one-year deadlines are not automatic.
- [ ] Confirm current-filter versus whole-evaluation selection, per-evaluation files, batch ZIPs and behavior when every item is excluded.
- [ ] Select compatible validator/types/schema packaging and performance budget. Direct hdf-libs input-schema adoption and Amendments remain excluded.
- [ ] Name shared-converter maintainers and choose a future SAF command strategy that respects its existing spreadsheet output. SAF migration is separately authorized, not a pilot prerequisite.
- [ ] After ADR agreement and user instruction, reconcile `heimdall2-gt11` and create child cards from this OSCAL plan. The epic's earlier spreadsheet criteria must not be used unchanged to judge the OSCAL implementation.

Acceptance record: pending team review. Keep status Proposed while recommendations are debated. User-established scope is binding for this pilot. After acceptance, supersede the ADR if its architectural decision changes.
