# Vue 3 Migration Research (2026-03-12)

Research conducted by 7 parallel agents analyzing the Heimdall2 frontend for Vue 2/Vuetify 2 → Vue 3/Vuetify 3 migration.

## Documents

| File | Contents |
|------|----------|
| `01-codebase-inventory.md` | Full frontend architecture map: 96 components, 16 Vuex stores, routes, dependencies, previous migration attempts |
| `02-vulnerability-assessment.md` | Active CVEs (Vuetify 2 CVSS 8.6), EOL status, blocked upgrades |
| `03-vuetify-component-migration-map.md` | Component-by-component Vuetify 2→3 changes with effort estimates |
| `04-vue3-compat-mode-analysis.md` | @vue/compat capabilities, limitations, real-world LOE data |
| `PLAN-A-incremental-compat-mode.md` | Incremental migration plan using @vue/compat bridge (10-14 weeks) |
| `PLAN-B-clean-rewrite.md` | Clean frontend rewrite in new directory (12-16 weeks) |

## Key Findings

1. **Vuetify 2 cannot run on Vue 3** — not even with @vue/compat. Must migrate to Vuetify 3.
2. **All 96 components use class decorators** (vue-class-component) — abandoned, no Vue 3 version.
3. **Vuetify 2 has 2 unpatched HIGH CVEs** — prototype pollution (CVSS 8.6) and XSS.
4. **Previous attempts exist** — `feature/vue3-migration` (3 files done), `feature/nuxt-ui-modernization` (ground-up rewrite started).
5. **Good news**: No event bus, no filters, no .native, minimal .sync usage.

## Recommendation

**Plan A (incremental)** if goal is minimal disruption and shipping intermediate states.
**Plan B (rewrite)** if team wants clean architecture and has 12-16 weeks budget.

Both plans resolve all identified CVEs.

## Location

These files are in `.claude/` which is gitignored — they survive branch switches. Move to a tracked location when ready to share with the team.
