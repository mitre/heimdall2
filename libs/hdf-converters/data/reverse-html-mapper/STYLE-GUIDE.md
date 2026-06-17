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

## 2. Background Layering System

### 2.1 The Problem

Pico's card background (`--pico-card-background-color`) is nearly identical to the page background in both light and dark mode:
- Light: card = `var(--pico-background-color)` = `#fff` (same as page)
- Dark: card = `#181c25`, page = `rgb(19, 22.5, 30.5)` ≈ `#13161f` (barely different)

This makes zebra striping invisible.

### 2.2 Solution: Bootstrap's Proven Three-Tier Approach

Bootstrap 5.3 defines three background tiers (source: `scss/_variables.scss` + `scss/_variables-dark.scss`):

| Tier | Bootstrap Light | Bootstrap Dark | Purpose |
|------|----------------|----------------|---------|
| Primary (body-bg) | `#fff` | `$gray-900` = `#212529` | Page background |
| Secondary | `$gray-200` = `#e9ecef` | `$gray-800` = `#343a40` | Secondary surfaces |
| Tertiary | `$gray-100` = `#f8f9fa` | `mix($gray-800, $gray-900)` ≈ `#2b3035` | Tertiary surfaces |

Bootstrap's gray scale (for reference):
```
$gray-100: #f8f9fa    $gray-600: #6c757d
$gray-200: #e9ecef    $gray-700: #495057
$gray-300: #dee2e6    $gray-800: #343a40
$gray-400: #ced4da    $gray-900: #212529
$gray-500: #adb5bd
```

### 2.3 Bootstrap's Stripe Formula

For table/list striping, Bootstrap uses a **transparent overlay** of the emphasis (text) color:
- **Stripe:** `rgba($emphasis-color-rgb, 0.05)` — 5% opacity
- **Hover:** `rgba($emphasis-color-rgb, 0.075)` — 7.5% opacity
- **Active:** `rgba($emphasis-color-rgb, 0.1)` — 10% opacity

This automatically adapts to light/dark because:
- Light mode: 5% black overlay = subtle darkening
- Dark mode: 5% white overlay = subtle lightening

### 2.4 Pico's Existing Stripe Value

Pico defines `--pico-table-row-stripped-background-color: rgba(111, 120, 135, 0.0375)` — a midtone gray at 3.75% opacity, same value in both modes. This is lighter than Bootstrap's 5%.

### 2.5 Our Control Card Token System

For control cards (which are larger than table rows and need stronger differentiation), we use:

```css
:root {
  /* Control card zebra — adapted from Bootstrap's 5% overlay approach.
     Cards are visually heavier than table rows, so we use 6% for clearer differentiation. */
  --control-bg-odd: rgba(111, 120, 135, 0.06);
  --control-bg-even: transparent;
}
```

This uses Pico's own stripe gray (111, 120, 135) at a slightly stronger 6% for card-sized elements. No separate dark mode value needed — the transparent overlay adapts automatically.

---

## 3. Status Color Tokens

### 3.1 Source of Truth

All status/severity colors are CSS custom properties in `:root`. The mapper's SVG icons use `fill="currentColor"` and inherit from parent elements via the CSS token system.

### 3.2 Values (Primer-anchored, WCAG AA verified)

**Status colors — anchored on GitHub Primer's verified AA palette:**

| Token | Light | Dark | Used for |
|-------|-------|------|----------|
| `--st-pass-fg` | `#1a7f37` | `#3fb950` | Passed text/icon |
| `--st-pass-bg` | `#dafbe1` | `#132d1c` | Passed badge background |
| `--st-fail-fg` | `#b3202a` | `#f85149` | Failed text/icon |
| `--st-fail-bg` | `#ffebe9` | `#3a1517` | Failed badge background |
| `--st-na-fg` | `#59636e` | `#8b949e` | Not Applicable text/icon |
| `--st-na-bg` | `#eef1f4` | `#21262d` | Not Applicable badge background |
| `--st-nr-fg` | `#9a4d00` | `#db8a30` | Not Reviewed text/icon |
| `--st-nr-bg` | `#fff1e5` | `#2a1a0a` | Not Reviewed badge background |
| `--st-error-fg` | `#6639ba` | `#a371f7` | Profile Error text/icon |
| `--st-error-bg` | `#fbefff` | `#2a1a44` | Profile Error badge background |

**Severity colors — cool-to-warm hue ramp:**

| Token | Light | Dark | Used for |
|-------|-------|------|----------|
| `--sv-none-fg/bg` | `#59636e` / `#eef1f4` | `#8b949e` / `#21262d` | None severity |
| `--sv-low-fg/bg` | `#1a5fb4` / `#ddf4ff` | `#58a6ff` / `#0d2b45` | Low severity |
| `--sv-medium-fg/bg` | `#9a6700` / `#fff8c5` | `#d29922` / `#2e2410` | Medium severity |
| `--sv-high-fg/bg` | `#bc4c00` / `#fff1e5` | `#db8a30` / `#3a2410` | High severity |
| `--sv-critical-fg/bg` | `#b3202a` / `#ffebe9` | `#f85149` / `#3a1517` | Critical severity |

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

- Bootstrap 5.3: `scss/_variables.scss`, `scss/_variables-dark.scss` (gray scale, three-tier bg, stripe factors)
- Pico CSS: `picocss.com/docs/css-variables`, `picocss.com/docs/color-schemes` (theming pattern)
- Blades CSS: `blades.ninja/html/starter/`, `@anyblades/pico` npm source (component catalog)
- GitHub Primer: color foundations (status palette)
- LiquidJS: `liquidjs.com/tutorials/options.html`, `liquidjs.com/tutorials/escaping.html`
- ADR-002: `docs/adr-002-blades-css-html-export.md` (decisions, risks, print research)
