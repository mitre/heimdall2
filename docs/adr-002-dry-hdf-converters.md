# ADR-002: DRY Refactoring of hdf-converters — Profile Defaults + Results Wrapper Standardization

**Status:** Proposed
**Date:** 2026-06-22
**Branch:** feature/attestation-comment-engine (lint cleanup track)
**Epic:** heimdall2-4qm (Full ESLint Compliance)

## Context

The `libs/hdf-converters` package has 29 forward mappers and 5 reverse mappers. Code review during lint cleanup (Session 5, 2026-06-18) revealed two layers of duplication:

### Layer 1: Profile Field Boilerplate (in progress)

Every mapper manually declares the same 5-10 InSpec JSON profile fields (`attributes: []`, `groups: []`, `supports: []`, `sha256: ''`, `status: 'loaded'`, and optionally `copyright: null`, `license: null`, `maintainer: null`, etc.). The InSpec JSON schema (`libs/inspecjs/schemas/exec-json.json`, definition `Exec_JSON_Profile`) defines 20 profile fields: 6 required, 14 optional.

**Current state:**
- `DEFAULT_PROFILE_FIELDS` constant created and tested against schema (card 4qm.2, committed)
- `satisfies Partial<ExecJSON.Profile>` type provides compile-time schema validation (card 4qm.7, committed)
- Fixture regeneration tool built with `--validate`, `--dry-run`, `--revert`, size guards (card 4qm.4, in progress)
- 14 of 29 forward mappers wired with spread (anchore-grype, asff, burpsuite, checkov, dbprotect, dependency-track, gosec, jfrog-xray, nikto, sarif, scoutsuite, snyk, trufflehog, twistlock, veracode done; conveyor reverted pending multi-profile fix)
- 36 per-file cards created (4qm.8–4qm.43) for complete coverage

### Layer 2: Results Wrapper Duplication (proposed)

14 mappers have a `*Results` wrapper class that follows the same pattern:

| Concern | Duplicated Pattern | Count |
|---------|-------------------|-------|
| Input parsing | `JSON.parse(input)` in constructor | 14 mappers |
| Input splitting | Split by host/service/product/array element | 5 mappers |
| Async initialization | `parseHtml = await buildParseHtmlFunc()` module-scope mutation | 6 mappers |
| Output shaping | Return single / array / object-keyed Execution | 3 distinct shapes |
| Mapper instantiation | `new *Mapper(subPart).toHdf()` for each sub-part | 14 mappers |

#### Output Shape Taxonomy (from spec file analysis)

| Shape | Return Type | Mappers | How Regen Tool Handles |
|-------|------------|---------|----------------------|
| Single | `ExecJSON.Execution` | burpsuite, cyclonedx, fortify, netsparker, trufflehog, twistlock, xccdf, zap, checklist | Direct result |
| Array | `ExecJSON.Execution[]` | nessus, msft-secure-score, snyk (when input is array) | `arrayIndex` field |
| Object | `Record<string, ExecJSON.Execution>` | ASFF, conveyor | `objectKey` field |

#### Async Init Pattern (module-scope mutation)

6 mappers mutate a module-scope `parseHtml` variable from inside `toHdf()`:
```ts
let parseHtml: (input: unknown) => string;  // module scope

class FooResults {
  async toHdf() {
    parseHtml = await buildParseHtmlFunc();  // mutation from function
    return new FooMapper(...).toHdf();       // mapper uses parseHtml
  }
}
```
This triggers `unicorn/no-top-level-assignment-in-function` lint errors and prevents concurrent usage.

**Files:** burpsuite, fortify, nessus, netsparker, xccdf-results, zap

## Decision

### Phase 1: Profile Defaults (in progress — cards 4qm.7–4qm.43)

Spread `DEFAULT_PROFILE_FIELDS` into every mapper's profile object. Each mapper overrides only the fields it actually sets (name, title, summary, controls, and mapper-specific fields like copyright paths).

**Validated by:** `--validate` flag on regen tool diffs current output against baseline — only `ALLOWED_NEW_FIELDS` (schema optional fields) may differ.

**Size guard:** Regen tool rejects output >3x original size (catches wrong constructor class — proven by snyk bug where raw string passed to parsed-object constructor produced 2.5M line file).

### Phase 2: BaseResults Standardization (proposed — new epic)

Extract the common `*Results` wrapper pattern into a `BaseResults<TInput, TOutput>` base class:

```ts
export abstract class BaseResults<
  TInput = Record<string, unknown>,
  TOutput extends ExecJSON.Execution | ExecJSON.Execution[] | Record<string, ExecJSON.Execution> = ExecJSON.Execution
> {
  protected parsed: TInput;

  constructor(input: string) {
    this.parsed = this.parse(input);
  }

  // Override: how to parse raw input (default: JSON.parse)
  protected parse(input: string): TInput {
    return JSON.parse(input) as TInput;
  }

  // Override: async initialization (replaces module-scope parseHtml mutation)
  protected async init(): Promise<void> {}

  // Override: create mapper instance for a sub-part
  protected abstract createMapper(data: unknown): BaseConverter;

  // Override: how to split parsed input (default: single)
  protected split(parsed: TInput): TInput[] | Record<string, TInput> | TInput {
    return parsed;
  }

  async toHdf(): Promise<TOutput> {
    await this.init();
    const parts = this.split(this.parsed);

    if (Array.isArray(parts)) {
      return parts.map(p => this.createMapper(p).toHdf()) as TOutput;
    }
    if (typeof parts === 'object' && !Array.isArray(parts) && parts !== null && !(parts instanceof BaseConverter)) {
      return Object.fromEntries(
        Object.entries(parts).map(([k, v]) => [k, this.createMapper(v).toHdf()])
      ) as TOutput;
    }
    return this.createMapper(parts).toHdf() as TOutput;
  }
}
```

Each `*Results` class becomes:

```ts
export class NessusResults extends BaseResults<NessusInput[], ExecJSON.Execution[]> {
  protected async init() { parseHtml = await buildParseHtmlFunc(); }
  protected createMapper(data: NessusInput) { return new NessusMapper(data); }
  protected split(parsed: NessusInput[]) { return parsed; }  // array input → array output
}

export class ConveyorResults extends BaseResults<ConveyorInput, Record<string, ExecJSON.Execution>> {
  protected createMapper(data: ConveyorInput) { return new ConveyorMapper(data); }
  protected split(parsed: ConveyorInput) { return splitByService(parsed); }  // object output
}

export class BurpSuiteResults extends BaseResults {
  protected async init() { parseHtml = await buildParseHtmlFunc(); }
  protected parse(input: string) { return parseXml(input); }  // XML, not JSON
  protected createMapper(data: unknown) { return new BurpSuiteMapper(data); }
}
```

**Benefits:**
- Eliminates 14 near-identical wrapper classes (~30 lines each → ~5 lines each)
- Async init pattern centralized (no more module-scope mutation)
- Output shape declared in type parameter (regen tool reads it instead of `arrayIndex`/`objectKey` hacks)
- `parse()` override handles XML/CSV/JSON input differences
- Testable: `BaseResults` itself gets unit tests for all three output shapes

### Phase 3: Async Init Refactor (part of Phase 2)

The `parseHtml` module-scope variable is replaced by an instance method:

```ts
protected async init(): Promise<void> {
  this.parseHtml = await buildParseHtmlFunc();
}
```

Each mapper that uses `parseHtml` receives it as a constructor parameter or reads it from `this.results.parseHtml`, eliminating:
- Module-scope mutable state
- `unicorn/no-top-level-assignment-in-function` lint errors (6 files)
- Concurrency bugs (parallel calls overwrite the shared variable)

## Consequences

### Positive
- ~420 lines of duplicated wrapper code eliminated
- Module-scope mutation removed from 6 mappers
- Output shape is type-safe and inspectable
- Regen tool simplifies (reads output shape from class metadata, no registry hacks)
- New mappers inherit correct behavior — just implement `createMapper()` and optionally `split()`
- Lint errors from async pattern resolved structurally, not with disables

### Negative
- Phase 2 touches 14 mapper files + base-converter — moderate risk
- Existing `*Results` classes have test coverage that validates current behavior — tests catch regressions but need updating for new base class
- XML-input mappers (burpsuite, netsparker, dbprotect, veracode, xccdf) override `parse()` — need careful handling

### Risks
- `split()` semantics vary: nessus splits by host count, conveyor by service name, ASFF by product ARN. The base class `split()` is called once but the split logic may need the full input context.
- Checklist mapper has TWO profiles (ChecklistMapper + parent profile in ChecklistResults) — doesn't fit the simple split pattern.

## Work Order

| Phase | Cards | Scope | Depends On |
|-------|-------|-------|------------|
| 1a | 4qm.7 ✅ | `DEFAULT_PROFILE_FIELDS` + `satisfies` type | — |
| 1b | 4qm.4 (in progress) | Fixture regen tool | 4qm.7 |
| 1c | 4qm.8–4qm.43 | Wire spread into 36 mapper files + lint + fixtures | 4qm.4 |
| 2a | NEW | `BaseResults` abstract class + unit tests | 1c |
| 2b | NEW (per-file) | Migrate each `*Results` to extend `BaseResults` | 2a |
| 2c | NEW | Async init refactor (parseHtml as instance method) | 2b |
| 3 | 7ci | Type scanner inputs (replace `_.get()` with typed access) | 1c |
| 4 | 4qm (parent) | Remove `|| true` from lint:ci | 3 |

## References

- InSpec JSON schema: `libs/inspecjs/schemas/exec-json.json`, `Exec_JSON_Profile`
- ESLint config decisions: `docs/development/eslint-config-decisions.md`
- Fixture regen tool: `libs/hdf-converters/scripts/regenerate-fixtures.mts`
- Regen tool plan: `libs/hdf-converters/REGEN-TOOL-PLAN.md`
- Phase 1 cards: heimdall2-4qm.7 through 4qm.43
