# Vuetify 2 → 3 Component Migration Map (2026-03-12)

## Key Facts

- Vuetify 2 CANNOT run on Vue 3, not even with @vue/compat
- No codemod or automated migration tool exists
- Vuetify 3 requires Vue 3.3+ and Node.js 18+
- Target: Vuetify 3.7.x (latest v3 LTS), not v4

## Initialization Changes

| Vuetify 2 | Vuetify 3 |
|-----------|-----------|
| `import Vuetify from 'vuetify/lib'` | `import { createVuetify } from 'vuetify'` |
| `Vue.use(Vuetify, {...})` | `app.use(vuetify)` |
| `new Vuetify({...})` | `createVuetify({...})` |
| Styles auto via vuetify-loader | `import 'vuetify/styles'` (explicit) |

Files: `main.ts`, `plugins/vuetify.ts`

## Theme System Changes

| Vuetify 2 | Vuetify 3 |
|-----------|-----------|
| `theme: { dark: true, themes: { dark: {...} } }` | `theme: { defaultTheme: 'dark', themes: { dark: { colors: {...} } } }` |
| `this.$vuetify.theme.dark = true` | `this.$vuetify.theme.global.name = 'dark'` |
| `<v-card dark>` | `<v-theme-provider theme="dark">` |
| `green--text` class | `text-green` class |
| `primary` background class | `bg-primary` class |
| `options: { customProperties: true }` | Always on (CSS vars default) |

Impact: plugins/vuetify.ts rewrite + 7 files with class renames + 17 files with `$vuetify` API

## SASS Variables

| Vuetify 2 | Vuetify 3 |
|-----------|-----------|
| `src/sass/variables.scss` (auto-detected) | `src/styles/settings.scss` (must configure) |
| `$material-dark-elevation-colors` map | Removed — use theme `surface` color |
| `$card-actions-padding` etc. | Mostly same names, verify each |
| `vuetify-loader` handles build | `vite-plugin-vuetify` or `webpack-plugin-vuetify` |

## Component Changes (by severity)

### MAJOR — Requires Restructuring

#### v-data-table (11 files, 29 occurrences) — HIGHEST EFFORT
| Change | Detail |
|--------|--------|
| Component split | Single → `v-data-table`, `v-data-table-server`, `v-data-table-virtual` |
| Headers | `{ text: 'Name', value: 'field' }` → `{ title: 'Name', key: 'field' }` |
| `:sort-by.sync` | → `v-model:sort-by` |
| `header-props` | Removed — use slots |
| `footer-props` | Removed — use `items-per-page-options` prop |
| `mobile-breakpoint` | Removed |
| Slot: `expanded-item` | → `expanded-row` |
| All `.sync` modifiers | → `v-model:propName` |

**Estimated: 12-18 hours**

#### v-tabs (5 files, 40 occurrences)
| Change | Detail |
|--------|--------|
| `v-tab-item` | REMOVED → `v-window-item` |
| `v-tabs-items` | REMOVED → `v-window` |
| `icons-and-text` | Removed |
| `centered`/`right` | → `align-tabs="center"` / `align-tabs="end"` |
| `background-color` | → `bg-color` |

Files: Admin, Compare, Login, ProfileInfo, UploadNexus, ControlRowDetails
**Estimated: 6-10 hours**

#### v-list sub-components (6 files, 44 occurrences)
| Change | Detail |
|--------|--------|
| `v-list-item-content` | REMOVED — content is default slot |
| `v-list-item-action` | REMOVED — use `append` slot |
| `v-list-item-icon` | REMOVED — use `prepend` slot or `prepend-icon` prop |
| `v-list-item-avatar` | REMOVED — use `prepend` slot |
| `v-list-item-group` | REMOVED — use `v-list` with `select-strategy` |
| `v-subheader` | → `v-list-subheader` |
| `two-line`/`three-line` | → `lines="two"` / `lines="three"` |

**Estimated: 6-8 hours**

### MODERATE — Prop/Slot Renames + Logic Changes

#### Activator Slot Pattern (23 files, 54 occurrences)
```html
<!-- Vuetify 2 -->
<template #activator="{on, attrs}">
  <v-btn v-bind="attrs" v-on="on">Click</v-btn>
</template>

<!-- Vuetify 3 -->
<template #activator="{props}">
  <v-btn v-bind="props">Click</v-btn>
</template>
```
Regex-replaceable with care. **Estimated: 4-6 hours**

#### v-btn (52 files, 113 occurrences)
| Vuetify 2 | Vuetify 3 |
|-----------|-----------|
| `flat` | `variant="flat"` |
| `outlined` | `variant="outlined"` |
| `text` (variant) | `variant="text"` |
| `depressed` | `variant="flat"` |
| `fab` | REMOVED — use `icon` prop + `size` |
| `small`/`large` | `size="small"` / `size="large"` |

**Estimated: 4-6 hours**

#### v-text-field (21 files, 60 occurrences)
| Vuetify 2 | Vuetify 3 |
|-----------|-----------|
| `outlined` | `variant="outlined"` |
| `filled` | `variant="filled"` |
| `solo` | `variant="solo"` |
| `dense` | `density="compact"` |
| `append-icon` | `append-inner-icon` |
| `validate-on-blur` | `validate-on="blur"` |
| `background-color` | `bg-color` |

**Estimated: 3-4 hours**

#### v-form (10 files)
| Change | Detail |
|--------|--------|
| `validate()` return | `boolean` → `Promise<{valid, errors}>` — every call needs `await` |
| `lazy-validation` | Removed |

**Estimated: 2-3 hours**

#### v-select (6 files, 10 occurrences)
| Vuetify 2 | Vuetify 3 |
|-----------|-----------|
| `item-text` | `item-title` |
| `@input` | `@update:model-value` |
| `outlined`/`filled` | `variant="..."` |
| `dense` | `density="compact"` |

**Estimated: 2-3 hours**

#### v-dialog (20 files)
| Change | Detail |
|--------|--------|
| Activator slot | Same as activator pattern above |
| `scrollable` | Removed — use CSS `overflow` |

**Estimated: 3-4 hours**

#### v-tooltip (14 files, 23 occurrences)
| Vuetify 2 | Vuetify 3 |
|-----------|-----------|
| `top`/`bottom`/`left`/`right` | `location="top"` etc. |
| Activator slot | Same pattern change |

**Estimated: 2-3 hours**

#### v-app-bar / v-toolbar (3 files, 8 occurrences)
| Change | Detail |
|--------|--------|
| `app` prop | Removed — use within `v-layout` |
| `clipped-left`/`right` | Removed — use layout order |
| `flat` | `variant="flat"` |
| `fixed` | Removed — use layout |

**Estimated: 2-3 hours**

### TRIVIAL — Simple Renames

#### v-card (43 files, 177 occurrences)
`flat` → `variant="flat"`, `outlined` → `variant="outlined"`. Sub-components unchanged.
**Estimated: 2-3 hours**

#### v-icon (47 files, 102 occurrences)
`small`/`large` → `size="small"`/`size="large"`. Icon-as-child-text still works.
**Estimated: 2-3 hours**

#### v-chip (4 files, 14 occurrences)
`small` → `size="small"`, `outlined` → `variant="outlined"`, `close` → `closable`.
**Estimated: 1 hour**

#### v-checkbox (6 files, 10 occurrences)
`input-value` → `model-value`, `on-icon`/`off-icon` → `true-icon`/`false-icon`.
**Estimated: 1 hour**

#### v-simple-table (2 files, 4 occurrences)
`v-simple-table` → `v-table`. **Estimated: 30 min**

#### v-col / v-row / v-container (42 files, 202 occurrences)
Largely UNCHANGED. **Estimated: 1-2 hours** (verification only)

#### v-spacer, v-divider (31 + 40 occurrences)
NO CHANGES. **Estimated: 0**

## Global Find-and-Replace Candidates

These changes can be done with careful regex across the entire codebase:

```
outlined        → variant="outlined"      (on Vuetify components only)
filled          → variant="filled"
solo            → variant="solo"
dense           → density="compact"
flat            → variant="flat"           (on v-btn, v-card, v-app-bar)
item-text       → item-title              (on v-select, v-combobox)
append-icon     → append-inner-icon       (on v-text-field, v-select)
background-color → bg-color
v-simple-table  → v-table
v-tab-item      → v-window-item
v-tabs-items    → v-window
green--text     → text-green              (color utility classes)
close           → closable               (on v-chip)
input-value     → model-value            (on v-checkbox)
```

## Total Vuetify Migration Effort Estimate

| Category | Hours |
|----------|-------|
| Initialization + theme | 6-10 |
| SASS variables | 2-3 |
| v-data-table | 12-18 |
| v-tabs restructure | 6-10 |
| v-list sub-components | 6-8 |
| Activator slots | 4-6 |
| v-btn renames | 4-6 |
| v-text-field renames | 3-4 |
| v-form async validate | 2-3 |
| v-select/checkbox/radio | 3-4 |
| v-dialog + v-tooltip | 5-7 |
| v-card/icon/chip (trivial) | 4-5 |
| Layout components | 2-3 |
| Color class renames | 1 |
| Visual QA and polish | 20-30 |
| **Total Vuetify** | **80-120 hours** |
