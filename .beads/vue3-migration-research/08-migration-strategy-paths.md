# Migration Strategy Analysis (2026-03-12)

Research from 4 expert agents evaluating migration paths for the frontend.

## Path Analysis Summary

### Path 1: Incremental @vue/compat — REJECTED

Agent finding: **"The incremental path is a fantasy that falls apart at step 1."**

Reasons:
- Vuetify 2 CANNOT run on Vue 3 even with @vue/compat (uses internal VNode APIs)
- vuex-module-decorators is abandoned, incompatible with Vuex 4
- Stores, router, and Vuetify theme are deeply coupled — changing any one forces all
- The minimum atomic changeset is ~80-100 files
- The things you CAN defer (class→composition conversion) are the easiest parts
- The things that MUST change upfront (stores, Vuetify, third-party libs) are the hard parts

### Path 2: Clean Scaffold — RECOMMENDED

Agent finding: **"The app is simpler than the component count suggests."**

Component breakdown (93 .vue files):
- **41 trivial** (< 1 hour each): simple display, few props, minimal store
- **28 medium** (1-4 hours): store interaction, multiple Vuetify components
- **16 complex** (4-8 hours): d3, multi-step wizards, deep Vuetify usage
- **8 hard** (8+ hours): ControlTable (450 lines), Results (596), Compare (614), ExportCKLModal (752)

What can be COPIED directly (zero rewrite):
- 13 utility files (framework-agnostic TypeScript)
- inspecjs and @mitre/hdf-converters (npm packages)

Weekend sprint MVP (login → upload → view results): ~32 hours
Full port: ~280-300 hours (7-8 weeks for one developer)

### Path 3: Strangler Fig — REJECTED

Agent finding: **"Over-engineered for an 85-component app."**

All three sub-patterns fail for the same reason: shared in-memory state (loaded evaluation files). Any runtime boundary (separate SPA, Web Components, micro-frontends) breaks the core workflow of loading files and viewing them across routes.

### Path 4: Automated Codemods + AI — SUPPLEMENT TO PATH 2

Agent finding: **"Claude Code itself may be the fastest migration tool."**

Key tool: `vue-class-style-codemod` (DB Fernverkehr) handles ~60-70% of script conversion.
Claude Code handles ~70-80% first-pass with the remaining 20-30% needing minor fixes.

Hybrid approach (codemod + Claude Code): 38-56 hours total
Claude Code only: 40-60 hours total
The difference is only 2-4 hours — pattern consistency makes AI nearly as reliable as AST transforms.

**No tool exists for Vuetify 2→3 template migration (40-50% of total effort).**

## Recommended Path: Clean Scaffold + AI-Assisted Conversion

1. Scaffold new frontend with vitify-next patterns
2. Convert Pinia stores first (foundation for everything)
3. Copy 13 utilities verbatim
4. Port pages in priority order: Results → Landing → Login → Compare → Admin → Groups
5. Use Claude Code to batch-convert components (5-10 per session)
6. Replace libraries during port (ECharts, VeeValidate+Zod, etc.)

This approach:
- Avoids the compat mode fantasy
- Avoids strangler-fig over-engineering
- Leverages AI for the mechanical conversion work
- Gets MVP in a weekend sprint, full port in 7-8 weeks
