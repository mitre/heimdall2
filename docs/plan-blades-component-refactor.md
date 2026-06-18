# Plan: Refactor Templates to Use Blades Components Idiomatically

**Date:** 2026-06-18
**Problem:** The HTML export templates use custom wrapper divs and custom CSS classes instead of Blades/Pico's built-in component patterns. This means we're fighting the framework — writing CSS to replicate behavior Blades provides for free, and missing responsive/a11y features the framework already handles.

---

## Audit: Every element vs Blades component

### ❌ WRONG — Must refactor

| Element | Current (wrong) | Blades component (correct) | Custom CSS to delete |
|---|---|---|---|
| **Nav bar** | `<nav><div class="nav-row"><ul class="nav-links">...<div class="nav-actions">` | `<nav><ul><li>links</li></ul><ul><li>search+buttons</li></ul></nav>` — two `<ul>` groups, Blades handles flex/spacing | `.nav-row`, `.nav-links`, `.nav-actions`, `.nav-search`, all mobile nav overrides |
| **NIST dropdown** | `<details class="chip-dropdown"><summary class="chip"><div class="dropdown-body"><label>` | `<details class="dropdown"><summary><ul><li><label><input>` — Blades provides positioning, backdrop, click-outside, border-radius | `.chip-dropdown`, `.dropdown-body`, all dropdown CSS (~10 lines) |
| **Filter bar** | `<div class="report-filters"><div class="chip-row" role="group">` | `<div role="group">` directly — Blades handles horizontal stacking, no wrapper needed | `.chip-row`, `.report-filters` layout (keep bg/border) |
| **Profile Info table overflow** | Custom mobile `display:block` stack-to-card | Blades provides `.overflow-auto` for responsive tables. Our data-label stack IS better for this data shape, but should ALSO wrap in `.overflow-auto` as fallback | None (keep stack-to-card, add `.overflow-auto` wrapper) |

### ✅ CORRECT — Already using Blades components

| Element | Blades component | Notes |
|---|---|---|
| Cards | `<article>` with `<header>/<footer>` | ✓ summary-hero, control cards |
| Accordion | `<details>/<summary>` | ✓ control expand/collapse |
| Tooltips | `data-tooltip` + `data-placement` | ✓ on buttons and titles |
| Button groups | `role="group"` | ✓ status/severity chip rows |
| Striped tables | `<table class="striped">` | ✓ test results, profile info |
| Search input | `<input type="search">` in `role="search"` form | ✓ Pico search icon |
| Semantic landmarks | `<header>`, `<main>`, `<footer>` inside body | ✓ via .report-wrapper |

### ⚠️ CUSTOM BUT JUSTIFIED — No Blades equivalent

| Element | Why custom | Notes |
|---|---|---|
| `.badge` / `.tag` | No badge/pill/chip component in Blades | Keep — verified in source |
| `.chip` (filter buttons) | No filter chip component in Blades | Keep — but remove overlap with `.chip-dropdown` |
| `.compliance-ring` | No gauge/ring component | Keep |
| `.status-bar` (segmented bar) | No progress-bar-with-segments | Keep |
| `.skip-link` / `.sr-only` | Blades has `utilities/accessibility` but no skip-link class | Keep |
| `.filtered-out` | App-specific filter state | Keep |
| `.active-token` / `.active-tokens` | Cloudscape-pattern dismissable tokens | Keep |
| Status/severity color tokens | `--st-*`, `--sv-*`, `--compliance-*` | Keep — Blades has no opinion on these |
| Emphasis overlay system | `--report-emphasis-rgb`, `--report-*-bg` | Keep — Bootstrap pattern adapted for Blades |

---

## Refactor Plan (ordered by impact)

### Phase 1: Nav — biggest violation, most custom CSS to delete

**Before:**
```html
<nav class="report-nav no-print" aria-label="Report controls">
  <div class="nav-row">
    <ul class="nav-links">
      <li><a href="#summary">Summary</a></li>
      ...
    </ul>
    <div class="nav-actions">
      <form role="search" class="nav-search">
        <input type="search" ...>
      </form>
      <button class="outline btn-sm">▼ Expand</button>
      <button class="outline btn-sm">▲ Collapse</button>
      <button class="btn-icon mobile-only">☰</button>
    </div>
  </div>
</nav>
```

**After (Blades-idiomatic):**
```html
<nav class="no-print" aria-label="Report controls">
  <ul>
    <li><a href="#summary"><strong>Summary</strong></a></li>
    <li><a href="#profile-info">Profile Info</a></li>
    <li><a href="#file-{{ resultSet.fileID }}">{{ resultSet.filename }}</a></li>
  </ul>
  <ul>
    <li>
      <form role="search">
        <input type="search" id="control-search" placeholder="Search controls..." aria-label="Search controls">
      </form>
    </li>
    <li><button class="outline" id="btn-expand-all" data-tooltip="Expand all">▼ Expand</button></li>
    <li><button class="outline" id="btn-collapse-all" data-tooltip="Collapse all">▲ Collapse</button></li>
    <li><button class="btn-icon mobile-only" id="nav-filter-toggle" aria-label="Toggle filters">☰</button></li>
  </ul>
</nav>
```

**CSS to delete:** `.nav-row`, `.nav-links`, `.nav-actions`, `.nav-search`, all mobile nav flex overrides (~15 lines).
**CSS to keep:** `.no-print`, `.btn-icon`, `.btn-sm`, `.mobile-only`, sticky + backdrop-filter on `nav` (but target the element, not `.report-nav`).

### Phase 2: NIST dropdown — wrong HTML structure

**Before:**
```html
<details id="nist-family-filter" class="chip-dropdown" role="listbox">
  <summary class="chip" id="nist-family-trigger">NIST Family</summary>
  <div class="dropdown-body" id="nist-family-list">
    <label><input type="checkbox" value="AC"> AC (42)</label>
    ...
  </div>
</details>
```

**After (Blades-idiomatic):**
```html
<details id="nist-family-filter" class="dropdown" role="listbox">
  <summary id="nist-family-trigger">NIST Family</summary>
  <ul id="nist-family-list">
    <li><label><input type="checkbox" value="AC"> AC (42)</label></li>
    ...
  </ul>
</details>
```

**CSS to delete:** `.chip-dropdown`, `.chip-dropdown > summary`, `.chip-dropdown > summary::after`, `.chip-dropdown .dropdown-body`, `.chip-dropdown label`, `.chip-dropdown label:hover`, `.chip-dropdown input[type="checkbox"]` (~10 lines).
**CSS to keep:** Max-height scroll on the `<ul>` if needed (Blades dropdown doesn't scroll by default).

**JS to update:** Selectors `#nist-family-list` still work. The `familyList.appendChild(lbl)` in scripts.liquid needs to wrap labels in `<li>`.

### Phase 3: Filter bar wrapper cleanup

**Before:**
```html
<div class="report-filters no-print" id="filter-bar" hidden>
  <div role="group" class="chip-row">...</div>
  <div role="group" class="chip-row">...</div>
  <div class="nist-row">...</div>
  ...
</div>
```

**After:**
```html
<div class="no-print" id="filter-bar" hidden>
  <div role="group">status chips</div>
  <div role="group">severity chips</div>
  <div class="nist-row">dropdown</div>
  ...
</div>
```

**CSS to delete:** `.chip-row` (Blades' `role="group"` handles the flex layout). Keep `.chip` class (no Blades equivalent for filter chips).
**CSS to keep:** `#filter-bar` background/border/padding, `.nist-row` alignment, `.chip` styling.

### Phase 4: Verify & clean dead CSS

After Phases 1-3, grep report.css for any rules targeting deleted classes. Delete orphans:
- `.nav-row`, `.nav-links`, `.nav-actions`, `.nav-search`
- `.chip-row` (replaced by `role="group"`)
- `.chip-dropdown`, `.dropdown-body`
- `.report-nav` (replaced by bare `nav`)
- `.report-filters` layout (keep bg/border only)
- Any mobile overrides for deleted classes

### Phase 5: Update tests

Every test that references deleted classes needs updating:
- `nav-actions fills the row` → test that Blades nav has two `<ul>` groups
- `chip-dropdown` references → test for `class="dropdown"` (Blades native)
- `nav-links horizontal scroll` → Blades handles this natively
- Mobile tests → verify Blades' responsive behavior

---

## Expected outcome

| Metric | Before | After |
|---|---|---|
| Custom CSS lines in report.css | ~310 | ~220 (estimate -90 lines) |
| Custom classes | 55 | ~35 |
| Framework-fighting overrides | 15+ | 0 |
| Mobile-specific CSS lines | ~30 | ~15 (Blades handles more natively) |

---

## Risk

- **JS selectors:** Scripts.liquid uses `document.querySelectorAll('.chip')`, `getElementById('nist-family-list')`, etc. Most target IDs (safe) but some target classes that will change.
- **CSS specificity:** Blades' nav/dropdown selectors have specific specificity. Our remaining overrides (sticky, bg color) must match or exceed.
- **Test count:** ~20 tests reference the old class names and need updating.

---

## NOT in scope

- Liquid partial decomposition (already correct — partials ARE our component layer)
- Executive summary layout changes (separate card)
- Search upgrade / CCI facet (separate cards)
- Custom components that Blades has no equivalent for (badges, chips, compliance ring, status bar)
