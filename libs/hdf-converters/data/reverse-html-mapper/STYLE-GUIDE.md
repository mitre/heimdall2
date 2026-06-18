# HTML Export Style Guide

**For:** `libs/hdf-converters` HTML report export (Blades CSS + LiquidJS)
**Last updated:** 2026-06-17
**Framework:** Blades CSS (`@anyblades/pico` v2.4.2) — Pico CSS successor, MIT licensed

---

## 1. Design System Foundation

### 1.1 Framework: Blades/Pico CSS

Blades is a classless/class-light CSS framework. It styles semantic HTML elements automatically via ~1095 `--pico-*` CSS custom properties. Our custom layer (report.css) appends after the framework — never edits the vendored file.

**Rules of engagement (from Pico docs + blades.ninja):**
1. Append, never edit the vendored Blades file
2. Prefer `--pico-*` variable overrides over re-declaring Blades selectors
3. Add new tokens/classes rather than repurposing Blades classes
4. Scope dark overrides to BOTH `@media only screen and (prefers-color-scheme: dark) { :root:not([data-theme]) { ... } }` AND `[data-theme="dark"] { ... }` — this is how Pico itself does it (verified in source)
5. Keep the custom layer small and inline after the Blades `<style>` block

### 1.2 No Hardcoded Colors — Ever

Every color in report.css MUST be a `var()` reference to either:
- A `--pico-*` variable (framework-provided)
- A `--st-*` / `--sv-*` / `--compliance-*` / `--control-*` / `--print-*` variable (our tokens in `:root`)

**Zero hardcoded hex/rgb values outside of variable declarations.** Enforced by grep.

---

## 2. Background Layering & Emphasis Overlay System

### 2.1 The Problem

Pico's card background equals the page background in light mode — zero contrast:
- Light: card = `var(--pico-background-color)` = `#fff`, page = `#fff` (**identical**)
- Dark: card = `#181c25`, page ≈ `#13171f` (small delta, ~+5 per channel)

Card separation in light mode relies entirely on border + box-shadow. Zebra striping on same-bg cards is invisible without an explicit overlay system.

### 2.2 Cross-System Research (2026-06-17)

Four major design systems were studied to find the proven, production-scale solution.

#### Bootstrap 5.3

**3 background tiers** (source: `scss/_variables.scss` + `scss/_variables-dark.scss`):

| Tier | Light | Dark | SCSS source |
|------|-------|------|-------------|
| body-bg | `#fff` | `#212529` ($gray-900) | `$body-bg` |
| secondary-bg | `#e9ecef` ($gray-200) | `#343a40` ($gray-800) | `$body-secondary-bg` |
| tertiary-bg | `#f8f9fa` ($gray-100) | `#2b3035` (mix) | `$body-tertiary-bg` |

**Key insight — tertiary is LIGHTER than secondary in light mode.** "Tertiary" means "subtlest tint away from body," not "third darkest."

**Card-bg defaults to body-bg** (same color as page). Separation via translucent border only. Cards that need to "float" must explicitly set a tier bg.

**Emphasis overlay system** — the keystone pattern:

| Token | Light | Dark |
|-------|-------|------|
| `--bs-emphasis-color-rgb` | `0, 0, 0` | `255, 255, 255` |

All layered surfaces use `rgba(var(--bs-emphasis-color-rgb), <factor>)`:

| State | Factor | Light effect | Dark effect |
|-------|--------|-------------|-------------|
| card cap | `.03` | 3% black darkening | 3% white lightening |
| stripe | `.05` | 5% black darkening | 5% white lightening |
| hover | `.075` | 7.5% black darkening | 7.5% white lightening |
| active | `.10` | 10% black darkening | 10% white lightening |

**One set of factors, auto-adapts to both themes.** This is exactly how Bootstrap keeps one set of table rules working across light/dark.

Bootstrap gray scale:
```
$gray-100: #f8f9fa    $gray-600: #6c757d
$gray-200: #e9ecef    $gray-700: #495057
$gray-300: #dee2e6    $gray-800: #343a40
$gray-400: #ced4da    $gray-900: #212529
```

#### GitHub Primer

**3 neutral surface tiers** (source: `primer/primitives` token files):

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `bgColor-default` | `#ffffff` | `#0d1117` | Page / card fill |
| `bgColor-muted` | `#f6f8fa` | `#151b23` | Secondary areas, table headers, code |
| `bgColor-inset` | `#f6f8fa` | `#010409` | Recessed wells, inputs |
| `bgColor-emphasis` | `#25292e` | `#3d444d` | Tooltips, inverted chips |

**Borders do the heavy lifting.** The default→muted bg delta is tiny (~1.04:1). Primer relies on a consistently-darker 1px border (neutral steps 6-8) to separate surfaces:

| Border token | Light | Dark |
|-------------|-------|------|
| `borderColor-default` | `#d1d9e0` | `#3d444d` |
| `borderColor-muted` | default @ alpha 0.7 | default @ alpha 0.7 |

**Zebra striping** (from live `github-markdown.css`): alternates `bgColor-default` ↔ `bgColor-muted` on odd/even rows, plus cell borders. DataTable component uses hover instead of stripes.

**Inset flips direction:** in light mode, inset = muted = greyer. In dark mode, inset goes DARKER than default (toward true black). Recession = "away from the page mid-tone."

#### Material Design 3

**5 discrete surface container tiers** (source: `material-color-utilities` tone numbers + AndroidX Compose `PaletteTokens.kt`):

| Role | Light (tone → hex) | Dark (tone → hex) |
|------|-------------------|-------------------|
| surfaceContainerLowest | 100 → `#FFFFFF` | 4 → `#0D0F13` |
| surface | 98 → `#FEF7FF` | 6 → `#121218` |
| surfaceContainerLow | 96 → `#F7F2FA` | 10 → `#1D1B20` |
| surfaceContainer | 94 → `#F3EDF7` | 12 → `#211F26` |
| surfaceContainerHigh | 92 → `#ECE6F0` | 17 → `#2B2930` |
| surfaceContainerHighest | 90 → `#E6E0E9` | 22 → `#36343B` |

Light mode darkens from ~white (tone 98→90). Dark mode lightens from ~black (tone 6→22). In BOTH, "higher container" = more separation from the page. Tone steps are deliberately small (2-5) so one `onSurface` text color stays legible across all tiers.

**Card surfaces:** Elevated = `surfaceContainerLow` + shadow. Filled = `surfaceContainerHighest`. Outlined = `surface` + border.

**No zebra striping.** M3 uses row dividers + state-layer overlays: hover @ 8%, focus @ 10%, pressed @ 10%.

**Current spec (2023+) uses discrete tiers, NOT overlay math.** The older tonal-elevation overlay system was deprecated.

#### Pico/Blades CSS

**2 surface tiers** (source: compiled `pico.css` via jsdelivr, CSS variables docs):

| Variable | Light | Dark |
|----------|-------|------|
| `--pico-background-color` | `#fff` | ≈ `#13171f` |
| `--pico-card-background-color` | `#fff` (**same**) | `#181c25` |
| `--pico-card-sectioning-background-color` | ≈ `#fbfbfc` | ≈ `#1a1f28` |

Light: card = page = **zero contrast**. Dark: card ~+5 per channel lighter (Material-style elevation).

**Table stripe:** `--pico-table-row-stripped-background-color: rgba(111, 120, 135, 0.0375)` — zinc-500 at 3.75%, same in both modes.

**Separation:** Light = border + box-shadow. Dark = background contrast (border set to card-bg = invisible).

### 2.3 Cross-System Summary

| System | Page bg (light) | Card bg (light) | Card separation | Zebra method | # tiers |
|--------|----------------|-----------------|-----------------|-------------|---------|
| Bootstrap 5.3 | `#fff` | `#fff` (same) | Translucent border | `rgba(emphasis, .05)` | 3 |
| Primer | `#fff` | `#fff` (same) | 1px border + radius | default↔muted alt | 3 |
| Material 3 | `#FEF7FF` | `#F7F2FA` (different) | Tonal tier + shadow | Dividers (no zebra) | 5 |
| Pico/Blades | `#fff` | `#fff` (same) | Border + shadow | `rgba(zinc, .0375)` | 2 |

**Universal finding:** Card-bg = page-bg is the norm in 3 of 4 systems. Only Material uses a distinct card tier.

### 2.4 Our Solution: Bootstrap Emphasis Overlay (adapted for Pico)

We adopt Bootstrap's emphasis-rgb pattern — the most proven approach, used at massive scale. Adapted to work within Pico's variable system and dark mode scoping.

**Core mechanism:**
```css
:root {
  --report-emphasis-rgb: 0, 0, 0;          /* black in light → darkening overlays */
  --report-cap-bg:    rgba(var(--report-emphasis-rgb), 0.03);
  --report-stripe-bg: rgba(var(--report-emphasis-rgb), 0.05);
  --report-hover-bg:  rgba(var(--report-emphasis-rgb), 0.075);
  --report-active-bg: rgba(var(--report-emphasis-rgb), 0.10);
}
[data-theme="dark"] {
  --report-emphasis-rgb: 255, 255, 255;     /* white in dark → lightening overlays */
  /* All derived tokens auto-recalculate — no per-mode overrides needed */
}
```

**Factor scale** (Bootstrap-proven, validated at scale):
- **`.03` (cap)** — card header/footer tinting (Bootstrap `$card-cap-bg`)
- **`.05` (stripe)** — zebra alternation (Bootstrap `$table-striped-bg-factor`)
- **`.075` (hover)** — interactive hover state (Bootstrap `$table-hover-bg-factor`)
- **`.10` (active)** — active/pressed state (Bootstrap `$table-active-bg-factor`)

**Why this over Pico's fixed zinc gray:**
Pico uses `rgba(111, 120, 135, 0.0375)` — a midtone gray at fixed opacity. This works but is less principled: it doesn't "darken light" or "lighten dark," it "adds gray" to both. Bootstrap's pattern is semantically correct — it always moves AWAY from the surface toward maximum contrast.

**Why this over Material's discrete tiers:**
M3's 5-tier system requires maintaining a full tone scale per color. For a self-contained HTML report (not an app), the overlay approach is simpler and produces equally good results with zero per-mode hex values.

---

## 3. Status Color Tokens

### 3.1 Source of Truth

All status/severity colors are CSS custom properties in `:root`. The mapper's SVG icons use `fill="currentColor"` and inherit from parent elements via the CSS token system.

**Source:** `apps/frontend/src/plugins/vuetify.ts` lines 5-58 — the Vuetify theme defines status/severity/compliance using Material Design color constants. The HTML export tokens are derived from the same Material palette for consistency between the live app and exported reports.

### 3.2 Values (Material Design palette, WCAG AA verified)

**Derivation strategy:** The Heimdall app uses Material 500-level colors on a dark background. These colors fail WCAG AA (4.5:1) on white backgrounds. The export supports light+dark+auto, so:
- **Light mode fg:** Material 700-800 variants (darkened for WCAG AA on white)
- **Dark mode fg:** Material 500 (exact app colors, designed for dark backgrounds)
- **Badge bg:** Light tint (50-100 level) in light mode, deep tint in dark mode

**Status colors — Material Design, matching Heimdall dashboard:**

| Token | Light fg | Light bg | Dark fg | Dark bg | Material source |
|-------|----------|----------|---------|---------|-----------------|
| `--st-pass-*` | `#388E3C` (700) | `#E8F5E9` (50) | `#4CAF50` (500) | `#1B3A1C` | `colors.green` |
| `--st-fail-*` | `#D32F2F` (700) | `#FFEBEE` (50) | `#F44336` (500) | `#3A1517` | `colors.red` |
| `--st-na-*` | `#0288D1` (700) | `#E1F5FE` (50) | `#03A9F4` (500) | `#0A2A3A` | `colors.lightBlue` |
| `--st-nr-*` | `#F57C00` (700) | `#FFF3E0` (50) | `#FF9800` (500) | `#2A1A0A` | `colors.orange` |
| `--st-error-*` | `#5C6BC0` (400) | `#E8EAF6` (50) | `#7986CB` (300) | `#1A1A3A` | `colors.indigo.lighten2` |

**Severity colors — Material Design cool-to-warm hue ramp:**

| Token | Light fg | Light bg | Dark fg | Dark bg | Material source |
|-------|----------|----------|---------|---------|-----------------|
| `--sv-none-*` | `#0288D1` | `#E1F5FE` | `#03A9F4` | `#0A2A3A` | `colors.lightBlue` |
| `--sv-low-*` | `#F9A825` (800) | `#FFFDE7` (50) | `#FFEB3B` (500) | `#2E2A10` | `colors.yellow` |
| `--sv-medium-*` | `#F57C00` (700) | `#FFF3E0` (50) | `#FF9800` (500) | `#2A1A0A` | `colors.orange` |
| `--sv-high-*` | `#E64A19` (700) | `#FBE9E7` (50) | `#FF5722` (500) | `#3A1A10` | `colors.deepOrange` |
| `--sv-critical-*` | `#D32F2F` (700) | `#FFEBEE` (50) | `#F44336` (500) | `#3A1517` | `colors.red` |

**Compliance colors — Material 500 (used for ring/bar, not text):**

| Level | Value | Material source |
|-------|-------|-----------------|
| Low | `#F44336` | `colors.red.base` |
| Medium | `#FFEB3B` | `colors.yellow.base` |
| High | `#4CAF50` | `colors.green.base` |

**Note on N/A color:** The app uses **light blue** (`colors.lightBlue.base = #03A9F4`) for Not Applicable, not gray. This is a Heimdall convention — gray might be more semantically "neutral" but light blue is what users know from the dashboard.

### 3.3 Dark Mode Scoping Pattern

Follows Pico's own pattern (verified in `pico.blades.css` source):
```css
/* Light default — no selector needed (inherits from :root) */
:root { --st-pass-fg: #1a7f37; }

/* Dark auto — OS preference, no explicit data-theme set */
@media only screen and (prefers-color-scheme: dark) {
  :root:not([data-theme]) { --st-pass-fg: #3fb950; }
}

/* Dark forced — explicit toggle */
[data-theme="dark"] { --st-pass-fg: #3fb950; }
```

Pico does NOT use `light-dark()` CSS function internally. We follow the same pattern for consistency.

### 3.4 SVG Icons — currentColor

All mapper SVG icons use `fill="currentColor"`. Color is inherited from the parent element's CSS `color` property:
- In badge elements: inherits from `.badge.status--*` class (which sets `color: var(--st-*-fg)`)
- In summary table: parent `<span>` has inline `style="color: var(--st-*-fg)"` or `var(--sv-*-fg)`

No hardcoded `rgb()` fills in the mapper TypeScript.

---

## 4. Badge Design

### 4.1 Two Badge Shapes (colorblind-safe differentiation)

**Status badges:** pill shape (`border-radius: 9999px`) — represents pass/fail state
**Severity badges:** rectangle shape (`border-radius: 4px`) — represents risk level

This provides a second visual channel beyond color — a colorblind user can distinguish the two categories by shape alone.

### 4.2 Badge Styling

- Font size: `.7rem` (smaller than body text)
- Font weight: 600
- Padding: `.1em .45em`
- Border: `1px solid transparent` (colored by status/severity class)
- Background: tinted (not solid) — uses `--st-*-bg` / `--sv-*-bg` tokens
- `print-color-adjust: exact` to preserve colors in print

### 4.3 Badge CSS Classes

Status: `.badge.status--passed`, `.badge.status--failed`, `.badge.status--not-applicable`, `.badge.status--not-reviewed`, `.badge.status--profile-error`

Severity: `.badge.sev--none`, `.badge.sev--low`, `.badge.sev--medium`, `.badge.sev--high`, `.badge.sev--critical`

Class names generated in Liquid via: `{{ result.resultStatus.status | downcase | replace: ' ', '-' }}`

---

## 5. Control Card Layout

### 5.1 Structure

Each control is an `<article class="control">` wrapping a `<details>/<summary>`.

**Collapsed (summary):** Grid layout — chevron + status badge (pill) + severity badge (rect) + mono ID + title (wraps to row 2)
**Expanded (body):** Tags, description, test results, details, code

### 5.2 Visual Hierarchy

1. Status-colored left border (4px) — instant visual scan
2. Leading chevron (CSS `::before` pseudo-element, rotates on open)
3. Badges on the scan line
4. Control ID in monospace (`<code class="control-id">`)
5. Title wraps naturally below (not truncated — compliance titles are meaningful)
6. Tags moved to expanded body (not in summary — scannability)

### 5.3 Key CSS Decisions

- `content-visibility: auto` for render performance (200+ controls)
- `contain-intrinsic-size: auto 200px` placeholder size for lazy rendering
- Blades accordion styling stripped (`--pico-accordion-border-color: transparent`, `details > summary::after: none`) — we use our own chevron
- In print: `content-visibility: visible !important` (or lazy controls print as blank)

---

## 6. Print CSS

### 6.1 Approach

Single `@media print` block in report.css. Browser File→Print→Save as PDF is the primary path (air-gapped/DoD).

### 6.2 Key Decisions (from research — ADR §9.2)

1. **details reveal:** JS `beforeprint` handler (primary) + CSS `details::details-content { content-visibility: visible }` (fallback). NOT `display:revert` on children (broken in modern browsers).
2. **break-inside:** ONLY `avoid` on small elements (tr, figure, badge). NOT on article.control or pre (clips content taller than one page).
3. **content-visibility:** Reset to `visible` in print (lazy controls print as blank 200px boxes otherwise).
4. **Theme:** Force light via `:root, :root[data-theme="dark"] { color-scheme: light !important }` — beats Blades specificity.
5. **Filtered controls:** WYSIWYG — print what's visible. No `display: block !important` on `.filtered-out`.
6. **Page numbers:** `@page` margin boxes (Chrome/Edge 131+, Safari 18.2+; NOT Firefox).
7. **Meter:** Hidden in print (native widget prints unreliably). Compliance ring shows instead.

### 6.3 Print-specific Tokens

All print colors use `var()` references:
- `--print-muted` for secondary text in margins
- `--print-border` for card borders

---

## 7. Blades Components Used vs Custom

### 7.1 Using Blades Built-ins

| Feature | Blades Pattern | Notes |
|---------|---------------|-------|
| Accordion | `<details>/<summary>` | Chevron via `--pico-icon-chevron` (we override with custom `::before`) |
| Card | `<article>` with `<header>/<footer>` | Used for summary cards and profile info |
| Table | `<table class="striped">` | Auto-styled, used in summary and test results |
| Navigation | `<nav><ul><li>` | Flex layout with `aria-current` |
| Grid | `<div class="grid">` | Auto-fit equal columns (profile info) |
| Tooltips | `data-tooltip` + `data-placement` | CSS-only, on buttons and tags |
| Back-to-top | `data-jump-to="top"` | Fixed position, CSS-only |
| Dark mode | `data-theme="light|dark"` on `<html>` | Framework handles all `--pico-*` switching |

### 7.2 Custom (Blades has no equivalent — verified in source)

| Feature | Our Implementation | Why custom |
|---------|-------------------|------------|
| `.badge` | Inline-flex, tinted bg, pill/rect shapes | No badge/pill/chip component in Blades |
| `.tag` | Small pill, border, muted color | No tag/label component in Blades |
| `.summary-grid` | `grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr))` | Blades `.grid` doesn't wrap — it puts all on one row ≥768px |
| `.compliance-ring` | Circle border, centered text | No gauge/ring component |
| `.control-id` | Monospace, nowrap | Custom class for ID styling |
| `.control-title` | Flex child, wraps naturally | Grid row 2 in summary |
| `.control-tags` | Flex wrap, gap | Moved from summary to body |
| `.filtered-out` | `display: none` | For JS filtering |

### 7.3 NOT Using (verified wrong for our layout)

| Feature | Why NOT |
|---------|---------|
| `.responsive` on tables | Full-bleed breakout — shatters card layout inside articles |
| `.columns` for tags | Newspaper text columns — wrong for inline pill lists |
| `<kbd>` for output | Keyboard input semantics — `<samp>` is program output |
| `<ins>/<del>` on badges | Screen readers announce "insertion/deletion" — wrong for status |

---

## 8. Template Engine: LiquidJS

### 8.1 Configuration

```ts
new Liquid({
  templates,                  // in-memory Record<string, string>
  outputEscape: 'escape',    // match Mustache safe-by-default (XSS prevention)
  strictFilters: true,       // fail loudly on typo'd filters
  lenientIf: true,           // allow optional fields in conditionals + | default
  jsTruthy: true,            // JS truthiness for booleans
});
```

### 8.2 Escaping Rule

- `{{ x }}` — escaped (plain text: IDs, counts, filenames)
- `{{ x | raw }}` — raw HTML (SVG icons, sanitized descriptions, CSS) — each usage justified in template comment

### 8.3 Liquid Gotchas

1. Empty strings are truthy — use `{% if x != blank %}` not `{% if x %}`
2. Loop variables must be prefixed — `{{ result.resultID }}` not `{{ resultID }}`
3. `{% render %}` isolates scope — pass vars explicitly
4. `| default: ''` for optional fields (e.g., `segment.message`)

---

## Sources

### Background Layering Research (2026-06-17)
- Bootstrap 5.3: `scss/_variables.scss`, `scss/_variables-dark.scss` — gray scale, 3-tier bg, emphasis-rgb overlay system, stripe/hover/active factors
- Bootstrap 5.3: `getbootstrap.com/docs/5.3` — CSS variables, color-modes, tables, card pages (via Context7)
- GitHub Primer: `primer/primitives` token files — `bgColor.json5`, `borderColor.json5`, `light.json5`/`dark.json5`
- GitHub Primer: `primer.style/foundations/color/overview/`, `primer.style/product/primitives/token-names/`
- GitHub Primer: `github-markdown.css` (live zebra stripe implementation)
- Material Design 3: `material-color-utilities` source (`color_spec_2021.ts`) — tonal palette tone numbers
- Material Design 3: AndroidX Compose `PaletteTokens.kt` — baseline surface container hex values
- Material Design 3: `m3.material.io/styles/color` — surface container roles, tonal elevation deprecation
- Pico CSS v2: compiled `pico.css` via `cdn.jsdelivr.net/npm/@picocss/pico@2` — actual variable values
- Pico CSS: `picocss.com/docs/css-variables` — dark mode scoping pattern, table stripe value
- Pico CSS: `github.com/picocss/pico` SCSS source — color-mix math for dark mode fractional values

### Framework & Template
- Blades CSS: `blades.ninja/html/starter/`, `@anyblades/pico` npm source (component catalog)
- LiquidJS: `liquidjs.com/tutorials/options.html`, `liquidjs.com/tutorials/escaping.html`
- ADR-002: `docs/adr-002-blades-css-html-export.md` (decisions, risks, print research)
