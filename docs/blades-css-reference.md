# Blades CSS — Technical Reference for the Heimdall HTML Report

**Status:** Research reference
**Date:** 2026-06-17
**Scope:** Everything Blades/Pico can do that we can leverage for a self-contained HDF HTML report.
**Companion to:** [ADR-002](./adr-002-blades-css-html-export.md), [migration-context](./migration-context.md)

> This is ground-truth research. Every fact below was verified against the **actual published packages**
> (`@anyblades/pico@2.4.2`, `@anyblades/blades@2.4.3`) downloaded from the npm registry and the
> official docs at blades.ninja / picocss.com — not from memory.

---

## 0. TL;DR for the report build

| Decision | Recommendation |
|---|---|
| **What to vendor** | `@anyblades/pico` → `css/pico.blades.min.css` — **92.6 KB raw / 13.5 KB gzip**. One file, zero JS, includes Pico + all Blades features. |
| **Accordions/tabs** | Native `<details>/<summary>` — CSS-only, no JS, works on Android (fixes the current TW-Elements-on-Android bug). |
| **Pass/Fail/severity colors** | Pico ships `--pico-ins-color` (green) / `--pico-del-color` (red) but only as *text* colors. We define our own status tokens on top (see §10). |
| **Dark mode** | `<meta name="color-scheme" content="light dark">` + `data-theme` toggle. Auto-follows OS; can be forced per-element. |
| **Print** | **Pico/Blades ships NO `@media print` rules.** We must author our own print stylesheet (see §8). This is a feature, not a gap — we get full control. |
| **Layout** | `<main class="container">` + `.grid` for stat cards. Semantic `<article>` for every control/card. |

---

## 1. What Blades actually is (the package landscape)

Blades is the **community-driven successor to Pico CSS**, maintained because Pico's original author went
inactive (last Pico release v2.1.1, Mar 2025). It is **100% backward-compatible with Pico v2** and adds
modern helpers. Two npm packages exist:

### `@anyblades/pico` (the Pico fork) — **use this one**
Latest `2.4.2`. A drop-in Pico replacement. Ships exactly **4 CSS files**:

| File | Raw | gzip | What it is |
|---|---|---|---|
| `css/pico.css` | 95.5 KB | 13.4 KB | Plain Pico v2 (expanded) |
| `css/pico.min.css` | 82.6 KB | 11.8 KB | Plain Pico v2 (minified) |
| `css/pico.blades.css` | 120.0 KB | 20.0 KB | **Pico + all Blades features** (expanded) |
| **`css/pico.blades.min.css`** | **92.6 KB** | **13.6 KB** | **Pico + all Blades features (minified) ← vendor this** |

Source (`src/`) is split into `_variables.css`, `_content.css`, `_forms.css`, `_components.css`,
`_layout.css`, `_utilities.css`. Plain CSS with nesting — **no Sass build required**.

### `@anyblades/blades` (the standalone kit)
Latest `2.4.3`. The *additive* layer meant to sit **on top of another framework** (Pico, Tailwind, or
a bare reset). This is where `blades.standalone.css` lives. Relevant for us only if we wanted Blades
helpers without full Pico — we don't, so we take the combined `pico.blades.min.css` instead.

| File | Raw | gzip | Purpose |
|---|---|---|---|
| `css/blades.css` | 119.9 KB | 20.0 KB | `@import "@anyblades/pico"` + standalone — identical to `pico.blades.css` |
| `css/blades.standalone.css` | 24.4 KB | 6.9 KB | Blades helpers only (core + theme), layer on any framework |
| `css/blades.standalone.core.css` | 19.0 KB | 6.0 KB | Helpers, **unthemed** (structure only) |
| `css/blades.standalone.theme.css` | 5.4 KB | 1.4 KB | Opinionated theme polish (font smoothing, sticky footer, text-wrap) |
| `css/breakout.css` | 3.5 KB | 1.4 KB | Breakout/full-bleed layout, standalone |
| `css/responsive-table.css` | 2.2 KB | 0.9 KB | Scrollable full-bleed tables, standalone |
| `css/link-icon.css` | 2.3 KB | 1.1 KB | `<i>` icon-in-link helper, standalone |
| `css/float-label.css` | 6.4 KB | 1.2 KB | Floating form labels, standalone |
| `css/blades.ninja.css` | 1.2 KB | 0.7 KB | Misc "ninja" add-ons (super/sub headings, teasers, `.opt`) |

**Install (for build-time vendoring):**
```bash
yarn add -D @anyblades/pico
# then copy node_modules/@anyblades/pico/css/pico.blades.min.css into the embed pipeline
```
CDN (reference only — our report must be self-contained, so we inline the file):
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@anyblades/pico@2/css/pico.blades.min.css">
```

---

## 2. The starter skeleton

The canonical Pico/Blades document — this is the shape our template should take:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />   <!-- enables auto light/dark -->
    <style>/* …inlined pico.blades.min.css… */</style>
    <title>HDF Report</title>
  </head>
  <body>
    <main class="container">
      <h1>Results</h1>
      <!-- semantic content -->
    </main>
  </body>
</html>
```

Key behaviors baked into the reset (`src/_layout.css`):
- `body > header`, `body > main`, `body > footer` get vertical block padding automatically.
- `<section>` gets bottom margin automatically.
- `box-sizing: border-box` globally; `overflow-wrap: break-word`; responsive root font-size.

---

## 3. Components — full catalog with examples

Everything below works with **zero JavaScript**. Pico/Blades is class-light: you style **semantic
elements and ARIA/role attributes**, not utility classes.

### 3.1 Card — `<article>`
The workhorse for the report. Every control / file panel should be an `<article>`.

```html
<article>
  <header>SV-204392 — Ensure the audit system is configured</header>
  <p>Control body, code, results…</p>
  <footer>NIST: AU-12 · Severity: high</footer>
</article>
```
- `<header>`/`<footer>` get a tinted sectioning background (`--pico-card-sectioning-background-color`),
  a divider border, and bleed to the card edges automatically.
- Card bg/shadow/border are all themeable (`--pico-card-*`).

### 3.2 Accordion — `<details>` / `<summary>` (CSS-only, replaces TW Elements)
**This is the single most important replacement.** It is native HTML, needs no JS, expands for print,
and works on Android.

```html
<details>
  <summary>Failed controls (42)</summary>
  <p>…contents revealed when open…</p>
</details>

<details open>            <!-- start expanded -->
  <summary>Passed controls (118)</summary>
  …
</details>

<details>
  <summary role="button">Looks like a button</summary>   <!-- button-styled trigger -->
  …
</details>
```
- Chevron icon (`--pico-icon-chevron`) auto-added, rotates on open. `::marker` hidden.
- Summary colors are themeable (`--pico-accordion-*-summary-color`).
- For print we force all `<details>` open (see §8).

### 3.3 Table — `<table>` + `.striped` / `.responsive` / `.borderless`
```html
<table class="striped">
  <thead><tr><th>ID</th><th>Title</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td>V-001</td><td>…</td><td>Passed</td></tr>
  </tbody>
  <tfoot>…</tfoot>
</table>
```
- `.striped` → odd rows tinted (`--pico-table-row-stripped-background-color`).
- `width:100%`, `border-collapse`, bottom-border rows, bold-ish `thead/tfoot` by default.
- **Blades adds** `.responsive` (full-bleed + horizontal scroll on mobile, no wrapper div needed) and
  `.borderless` (removes all borders).
- **Blades adds** `<hr>` column-expanders: `<th>Name<hr></th>` reserves min width; `<hr class="lg">`
  / `<hr class="x2">` widen it. Useful to stop narrow columns from collapsing.

### 3.4 Nav — `<nav>`
```html
<nav>
  <ul><li><strong>HDF Report</strong></li></ul>
  <ul>
    <li><a href="#summary">Summary</a></li>
    <li><a href="#controls" aria-current="page">Controls</a></li>
  </ul>
</nav>

<nav aria-label="breadcrumb">
  <ul><li><a href="#">Profile</a></li><li><a href="#">File</a></li><li>Control</li></ul>
</nav>
```
- Flex, space-between. `aria-current` marks the active link.
- Breadcrumb divider is `--pico-nav-breadcrumb-divider` (default `>`).
- `<aside><nav>` renders **vertical** (block) — good for a sidebar table-of-contents.

### 3.5 Group — `role="group"` / `role="search"`
Horizontally joins buttons/inputs into one pill (shared border radius, focus ring spanning the group).
```html
<div role="group">
  <button>All</button>
  <button class="secondary">Passed</button>
  <button class="secondary">Failed</button>
</div>
```
Good for filter button-bars / segmented controls in the report header.

### 3.6 Progress — `<progress>`
```html
<progress value="72" max="100"></progress>   <!-- compliance % bar -->
<progress></progress>                         <!-- indeterminate (animated) -->
```
- 0.5rem tall, rounded, `--pico-progress-color` fill on `--pico-progress-background-color` track.
- We can recolor per-status by overriding `--pico-progress-color` inline or via a class.

### 3.7 Tooltip — `data-tooltip` (CSS-only)
```html
<span data-tooltip="CCI-000130">AU-12</span>
<a href="#" data-tooltip="Show details" data-placement="right">i</a>
```
- `data-placement` = `top` (default) | `bottom` | `left` | `right`.
- Pure CSS via `::before`/`::after`, content from the attribute. No JS.
- Non-interactive elements get a dotted underline + `cursor: help`.

### 3.8 Dropdown — `details.dropdown`
```html
<details class="dropdown">
  <summary>Sort by severity</summary>
  <ul>
    <li><a href="#">Severity</a></li>
    <li><a href="#">Status</a></li>
  </ul>
</details>
```
CSS-only popover. Works in `<nav>` too. (Likely unused in a static report, but available.)

### 3.9 Modal — `<dialog>`
```html
<dialog open>
  <article>
    <header><a href="#" rel="prev" aria-label="Close" class="close"></a><strong>Title</strong></header>
    <p>…</p>
    <footer><button>OK</button></footer>
  </article>
</dialog>
```
Animations require toggling `.modal-is-open`/`.modal-is-opening` on `<body>` (JS). For a static report,
prefer `<details>` over `<dialog>`. Listed for completeness.

### 3.10 Loading — `aria-busy="true"`
```html
<article aria-busy="true">Loading…</article>
<button aria-busy="true">Please wait</button>
```
Spinner icon (`--pico-icon-loading`) injected; buttons become non-interactive. Not needed for a static
export, but free.

### 3.11 Timeline — `dl.timeline` (Blades)
```html
<dl class="timeline">
  <dt>2026-06-17</dt><dd>Scan executed</dd>
  <dt>2026-06-10</dt><dd>Profile updated</dd>
</dl>
```
Each `<dd>` gets a left track border. Could render scan history / control change log.

---

## 4. Typography & inline content

| Element | Behavior | Report use |
|---|---|---|
| `<h1>`–`<h6>` | Themeable per-level color (`--pico-h1-color`…`--pico-h6-color`), bold, responsive sizes | Section headers |
| `<mark>` | Highlight, `--pico-mark-background-color` / `--pico-mark-color` | Highlight matched search text / key findings |
| `<ins>` | **Green text** (`--pico-ins-color`) | Pass semantics (text only) |
| `<del>` | **Red text** (`--pico-del-color`) | Fail semantics (text only) |
| `<code>`,`<pre>`,`<kbd>`,`<samp>`,`<var>` | Monospace, tinted bg (`--pico-code-*`); `<pre><code>` block scrolls | Control source, commands, expected/actual output |
| `<blockquote>` | Left accent border | Callouts / remediation notes |
| `<abbr title="…">` | Dotted underline + help cursor | Expand CCI/NIST acronyms |
| `<small>` | 0.875em | Metadata, timestamps |
| `<hgroup>` | Title + muted subtitle pairing | Report title + run date |

**Blades typography add-ons:**
- **Heading anchors** — an `<a aria-hidden="true" href="#id">#</a>` inside a heading appears on hover.
- **Custom list markers** — `<ul style="--list-marker:'→ '">` or per-`<li>`; `<li data-marker="✓">`.
- **`.markerless`** — removes bullets, reduces padding (emoji/icon bullets).
- **`.unlist`** / **`.unlist-all`** — strip list styling entirely (nav-like lists).
- **`pre[data-caption]`** / **`code[data-caption]`** — caption above a code block (e.g. filename).

---

## 5. Color scheme / dark mode (exact mechanics)

Three CSS scopes drive theming (verified in `src/_variables.css`):

```css
/* 1. Light = default, also when data-theme is anything except "dark" */
[data-theme="light"], :root:not([data-theme="dark"]) { color-scheme: light; --pico-…: …; }

/* 2. Auto-dark = OS prefers dark AND no explicit data-theme set */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme])                 { color-scheme: dark;  --pico-…: …; }
}

/* 3. Forced dark = explicit attribute, beats OS preference */
[data-theme="dark"]                       { color-scheme: dark;  --pico-…: …; }
```

**Practical rules for the report:**
- Add `<meta name="color-scheme" content="light dark">` in `<head>` → auto follows OS, no flash.
- **Force whole report light:** `<html data-theme="light">`.
- **Force whole report dark:** `<html data-theme="dark">`.
- **Theme a single element** (e.g. a dark code panel inside a light page): `<article data-theme="dark">`.
- **A toggle** needs ~3 lines of JS that flip `document.documentElement.dataset.theme`. Everything else
  is pure CSS. (If we want a toggle in an otherwise JS-free report, this is the only JS needed.)
- Pico intentionally does **not** paint `background`/`color` on every element — backgrounds stay
  transparent and inherit. `<section>` notably does **not** get a themed bg; set it yourself if needed:
  ```css
  section { background-color: var(--pico-background-color); color: var(--pico-color); }
  ```

---

## 6. CSS custom properties (the theming surface)

All variables are prefixed `--pico-`. Defined globally in `:root, :host`, then per color-scheme.
**This is the entire knob-set we tune to brand the report and add status colors.**

### 6.1 Global (color-scheme independent)
```
--pico-font-family-sans-serif / -monospace / -emoji / --pico-font-family
--pico-font-size (responsive: 100%→131.25% across breakpoints) / --pico-font-weight / --pico-line-height
--pico-text-underline-offset
--pico-border-radius (0.25rem) / --pico-border-width (0.0625rem) / --pico-outline-width (0.125rem)
--pico-transition (0.2s ease-in-out)
--pico-spacing (1rem) and derivatives:
  --pico-typography-spacing-vertical / -top
  --pico-block-spacing-vertical / -horizontal
  --pico-grid-column-gap / -row-gap
  --pico-form-element-spacing-vertical / -horizontal
  --pico-nav-element-spacing-* / --pico-nav-link-spacing-* / --pico-nav-breadcrumb-divider
--pico-modal-overlay-backdrop-filter
--pico-icon-* (checkbox, minus, chevron, date, time, search, close, loading — SVG data URIs)
```

### 6.2 Per color-scheme (light + dark each define the full set)
**Core palette:**
```
--pico-background-color           --pico-color            --pico-text-selection-color
--pico-muted-color                --pico-muted-border-color
--pico-primary / -background / -border / -underline / -inverse
--pico-primary-hover / -hover-background / -hover-border / -hover-underline / -focus
--pico-secondary  (+ same family)
--pico-contrast   (+ same family)
--pico-box-shadow
```
**Headings & marks (status-relevant):**
```
--pico-h1-color … --pico-h6-color
--pico-mark-background-color / --pico-mark-color     ← highlight
--pico-ins-color   ← GREEN  (pass/insert text)
--pico-del-color   ← RED    (fail/delete text)
--pico-blockquote-border-color / -footer-color
```
**Component-scoped (override to restyle one component):**
```
--pico-table-border-color / --pico-table-row-stripped-background-color
--pico-code-background-color / -color / --pico-code-kbd-background-color / -color
--pico-card-background-color / -border-color / -box-shadow / -sectioning-background-color
--pico-accordion-border-color / -active-summary-color / -close-summary-color / -open-summary-color
--pico-dropdown-* / --pico-modal-overlay-background-color
--pico-progress-background-color / --pico-progress-color
--pico-tooltip-background-color / --pico-tooltip-color
--pico-form-element-* (background, border, color, placeholder, valid/invalid borders, etc.)
--pico-switch-* / --pico-range-* / --pico-loading-spinner-opacity
--pico-icon-valid (green check) / --pico-icon-invalid (red circle)
```

**Native status color values** (so we can reuse the exact palette):

| Token | Light | Dark |
|---|---|---|
| `--pico-ins-color` (green) | `rgb(28.5,105.5,84)` | `#62af9a` |
| `--pico-del-color` (red) | `rgb(136,56.5,53)` | `rgb(205.5,126,123)` |
| `--pico-mark-background-color` | `rgb(252.5,230.5,191.5)` | `#014063` |
| valid border (green) | `rgb(76,154.5,137.5)` | `#2a7b6f` |
| invalid border (red) | `rgb(183.5,105.5,106.5)` | `rgb(149.5,74,80)` |
| `--pico-primary` (azure) | `#0172ad` | `#01aaff` |

### 6.3 Pico color palette (optional, separate)
Pico publishes `pico.colors.css` — **380 hand-crafted colors**, 20 families × 19 shades (50–950):
`red, pink, fuchsia, purple, violet, indigo, blue, azure, cyan, jade, green, lime, yellow, amber,
pumpkin, orange, sand, grey, zinc, slate`. Used as `class="pico-color-green-500"` /
`pico-background-red-600`, or as `--pico-color-*` custom properties.

> ⚠️ This file is "almost the same size as the entire library." It is **NOT** in `@anyblades/pico`
> (which ships only the 4 files in §1). For the report, **do not vendor it** — instead hardcode the
> ~6 severity/status colors we need (see §10). Reference the palette only to pick nice hex values.

---

## 7. Conditional / class-light styling hooks

Pico/Blades styles **semantic elements + attributes**, so the HTML stays clean. The full set of
attribute hooks the framework actually keys off (verified by grepping the source):

**Roles:** `[role="button"]`, `[role="group"]`, `[role="search"]`, `[role="link"]`, `[role="switch"]`
**ARIA:** `[aria-current]` (active nav), `[aria-busy="true"]` (loading), `[aria-invalid="true"|"false"]`
(form validation coloring), `[aria-disabled="true"]`, `[aria-label="breadcrumb"]`, `[aria-controls]`
**Data:** `[data-tooltip]` + `[data-placement]`, `[data-theme]`, `[data-jump-to="top"]` (Blades)
**Classes (the few that exist):** `.container` / `.container-fluid`, `.grid`, `.overflow-auto`,
`.striped`, `.secondary`, `.contrast`, `.outline`, `.close`, `.modal-is-open/-opening/-closing`,
`.unreduce-motion`, plus Blades: `.responsive`, `.borderless`, `.columns`, `.breakout` / `.breakout-all`
/ `.breakout-item` / `.breakout-item-max`, `.markerless`, `.unlist` / `.unlist-all`, `.dark-auto`,
`.faded`, `.invert`, `.timeline` / `.has-timeline`, `.opt`.

### Conditional scoping (`.pico`)
Plain Pico also ships `pico.conditional.css`: every rule is nested under a `.pico` parent so only
`<x class="pico">…</x>` subtrees get styled — for embedding Pico inside a foreign-styled page.
**Not in `@anyblades/pico`**, and not needed: our report is a standalone document, so the global
build is correct.

### Layout primitives
```html
<main class="container">…</main>          <!-- centered, max-width per breakpoint (510→1450px) -->
<div class="container-fluid">…</div>      <!-- full width, just padding -->
<div class="grid"><article>…</article><article>…</article></div>  <!-- auto-fit equal columns ≥768px -->
<div class="overflow-auto">…</div>        <!-- scroll wrapper -->
```
`.grid` is auto-layout (`repeat(auto-fit, minmax(0,1fr))`), single column on mobile — ideal for the
summary stat cards (Passed / Failed / N-A / Not Reviewed).

### Blades layout add-ons
- **`.columns`** — CSS multi-column (`columns: 25ch auto`) for long ToC / tag lists.
- **`.breakout` / `.breakout-all`** — let wide tables/images/code bleed past the text column.
- **`[data-jump-to="top"]`** — fixes an element to the corner as a back-to-top button.
- **`.dark-auto`** — `filter: invert+hue-rotate` to auto-darken an element (e.g. an embedded logo) in
  dark mode.

---

## 8. Print styles — **we own this entirely**

**Confirmed: Pico and Blades ship ZERO `@media print` rules** (grepped all source + built files).
This is good — no framework print CSS to fight. The current Tailwind template's broken print behavior
(JS accordions stay collapsed) goes away because `<details>` can be forced open in print.

Recommended print layer to ship with the report:

```css
@media print {
  /* 1. Expand every collapsible so nothing is hidden on paper */
  details:not([open]) > *  { display: revert !important; }
  details                  { display: block !important; }
  details > summary::after { display: none; }      /* drop the chevron */

  /* 2. Kill interactive chrome */
  nav, [data-jump-to], .print-hidden, button, [role="button"] { display: none !important; }

  /* 3. Force light, ink-friendly rendering */
  :root { color-scheme: light; }
  body  { background: #fff !important; color: #000 !important; }
  article { box-shadow: none !important; border: 1px solid #ccc; break-inside: avoid; }

  /* 4. Keep rows/cards together; show link targets */
  tr, article, details { break-inside: avoid; }
  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 0.85em; color: #555; }

  /* 5. Page setup */
  @page { margin: 1.5cm; }
  h1, h2, h3 { break-after: avoid; }
}
```
Pair `class="print-hidden"` with toolbar/filter UI. (Pico has no `print:hidden` equivalent — Tailwind's
`print:hidden` becomes this class.)

---

## 9. Which build to vendor (size analysis)

For a **single self-contained file**, inline the CSS into a `<style>` tag. Candidates:

| Option | Inlined size | gzip (if server-served) | Verdict |
|---|---|---|---|
| `pico.blades.min.css` | **92.6 KB** | 13.6 KB | ✅ **Recommended.** Full feature set, minified, one file. |
| `pico.min.css` (no Blades) | 82.6 KB | 11.8 KB | Smaller, but loses `.responsive`/`.breakout`/`.columns`/timeline/list helpers. |
| `pico.blades.min.css` + PurgeCSS | ~25–40 KB* | — | Best size, adds a build step + risk of purging attribute-driven rules. |

\* Estimate. Pico's attribute-selector heavy CSS makes purging error-prone (easy to strip
`[aria-busy]`, `[data-placement]`, `:has()` rules). **Recommendation: ship the full `pico.blades.min.css`
(92.6 KB) + our ~3 KB custom layer.** Total ≈ **95 KB vs the current 825 KB** — a **~88% reduction**
with **zero JS**. Defer PurgeCSS to a later optimization card if size ever matters.

> Reality check vs ADR-002's "~12KB" target: that figure is the **gzip-on-the-wire** size (13.6 KB).
> The **inlined-into-the-HTML-file** size is ~92.6 KB raw. Both are dramatically smaller than 825 KB,
> but we should state the raw number for the self-contained file and the gzip number for any served case.

---

## 10. Extending Blades without fighting it (status colors, badges, severity)

**Pattern: add a thin custom layer *after* the Blades CSS that only sets `--pico-*` overrides and a
handful of report-specific classes.** Don't override Blades selectors — drive them through their own
variables, and add new tokens in the `--pico-` style for consistency.

### 10.1 Define status tokens (light + dark aware)
Reuse Pico's native green/red so the report matches the framework palette:
```css
:root {
  --status-passed:        #1c6954;   /* mirrors --pico-ins-color (light) */
  --status-failed:        #883835;   /* mirrors --pico-del-color (light) */
  --status-not-reviewed:  #b0852b;   /* amber */
  --status-not-applicable:#5d6b89;   /* mirrors --pico-secondary */
  --status-error:         #7c2d2d;
  --sev-critical:#7c1d1d; --sev-high:#b91c1c; --sev-medium:#b45309; --sev-low:#1d6fb8;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --status-passed:#62af9a; --status-failed:#cd7e7b; --status-not-reviewed:#d9b15a;
    --status-not-applicable:#969eaf;
  }
}
[data-theme="dark"] {
  --status-passed:#62af9a; --status-failed:#cd7e7b; --status-not-reviewed:#d9b15a;
  --status-not-applicable:#969eaf;
}
```

### 10.2 Severity / status badge (new class, no conflict)
```css
.badge {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: var(--pico-border-radius);   /* inherit Blades radius */
  font-size: 0.75rem; font-weight: 600; line-height: 1.4;
  color: #fff; white-space: nowrap;
}
.badge.passed  { background: var(--status-passed); }
.badge.failed  { background: var(--status-failed); }
.badge.na      { background: var(--status-not-applicable); }
.badge.nr      { background: var(--status-not-reviewed); }
.badge.critical{ background: var(--sev-critical); }
.badge.high    { background: var(--sev-high); }
.badge.medium  { background: var(--sev-medium); }
.badge.low     { background: var(--sev-low); }
```
```html
<span class="badge failed">Failed</span>
<span class="badge high">High</span>
```

### 10.3 Recolor a built-in component via its variable
```css
/* a per-status compliance bar — no need to touch progress's selectors */
.bar-passed   { --pico-progress-color: var(--status-passed); }
.bar-failed   { --pico-progress-color: var(--status-failed); }
```
```html
<progress class="bar-failed" value="42" max="100"></progress>
```

### 10.4 Status-tinted card (left accent stripe — common in result viewers)
```css
article.result            { border-left: 4px solid var(--pico-muted-border-color); }
article.result.passed     { border-left-color: var(--status-passed); }
article.result.failed     { border-left-color: var(--status-failed); }
article.result.na         { border-left-color: var(--status-not-applicable); }
```

### Rules of engagement
1. **Append, never edit** the vendored Blades file (keeps upgrades trivial).
2. **Prefer `--pico-*` variable overrides** over re-declaring Blades selectors.
3. **Add new tokens/classes** (`--status-*`, `.badge`) rather than repurposing Blades classes.
4. **Scope dark overrides** to both `@media (prefers-color-scheme: dark):root:not([data-theme="light"])`
   and `[data-theme="dark"]` so a forced light/dark toggle still works.
5. Keep the custom layer tiny (~2–3 KB) and inline it right after the Blades `<style>`.

---

## 11. Gaps & watch-outs for the migration

1. **No print CSS in the framework** → we author §8 (already a net win over the broken TW print).
2. **`--pico-ins/del-color` are text-only**, not backgrounds → badges need the custom layer (§10).
3. **No color palette in `@anyblades/pico`** → hardcode our ~10 status/severity hex values; don't pull
   `pico.colors.css`.
4. **`<section>` has no themed background** by default → set it if a section needs a fill.
5. **PurgeCSS is risky** here (attribute/`:has()`-heavy CSS) → ship full build first, optimize later.
6. **Modal animations need JS**; the only JS we might want is a dark-mode toggle (~3 lines). A
   genuinely zero-JS report uses OS-driven `prefers-color-scheme` + `<meta color-scheme>` and skips the
   toggle.
7. **Blades is plain CSS with nesting** (no Sass) → if we ever build from source, modern bundlers
   handle nesting natively; no Sass toolchain needed.

---

## Sources
- `@anyblades/pico@2.4.2` — npm tarball (source + built CSS inspected directly)
- `@anyblades/blades@2.4.3` — npm tarball (standalone kit inspected directly)
- https://blades.ninja/ , https://blades.ninja/css/pico/ , https://github.com/anyblades/pico ,
  https://github.com/anydigital/blades
- https://picocss.com/docs — conditional, color-schemes, colors, components
