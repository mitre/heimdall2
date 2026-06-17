# Self-Contained HTML Compliance Report — Design Guide

**For:** Heimdall HTML export (`feature/blades-css-html-export`, ADR-002)
**Date:** 2026-06-17
**Scope:** Single-file `.html`, all CSS inlined, offline/air-gapped, zero (or near-zero) JS.
**Companion docs:** `adr-002-blades-css-html-export.md`, `migration-context.md`, `blades-css-reference.md`

This guide is the research backing for the template rewrite (card P2) and print CSS (card P4).
Every snippet is copy-pasteable into one `<style>` block and uses **only system resources**
(no web fonts, no CDN, no external requests). It is tailored to Heimdall's actual data model:
statuses `passed / failed / notApplicable / notReviewed / profileError` and severities
`none / low / medium / high / critical`, three export levels (Executive / Manager / Administrator).

---

## 0. Corrections to ADR-002 — verify before implementing (load-bearing)

These were verified directly against the npm registry and jsDelivr CDN on 2026-06-17.

### 0.1 The npm package name in the docs is wrong

- `blades-css` **does not exist on npm.** `migration-context.md`'s `npm install blades-css` and
  `https://unpkg.com/blades-css/blades.standalone.css` will both 404.
- Real packages: **`@anyblades/blades` (v2.4.3)** — "Fully compatible and actively maintained
  successor to Pico CSS"; and **`@anyblades/pico` (v2.4.2)** — "Minimal CSS Framework for semantic
  HTML" (the literal Pico drop-in). Prior-review finding #5 (`@anyblades/pico`) is the correct one.
- Repo: `https://github.com/anyblades/blades` · Home: `https://blades.ninja`

### 0.2 The file to vendor is `blades.min.css`, NOT `blades.standalone.css`

This is the critical error. Measured sizes:

| File | Raw | Gzip | What it is |
|---|---|---|---|
| `css/blades.min.css` | **91 KB** | 13.8 KB | **Full semantic framework.** 1095 `--pico-*` vars; styles `details, summary, article, nav, table, progress, button`; dark mode via `data-theme` + `prefers-color-scheme`. **← vendor this** |
| `css/blades.standalone.min.css` | 10 KB | 2.5 KB | **Utility add-on only** (`.columns`, `.breakout`, float-labels, `table.responsive`, `.dark-auto`). 0 `--pico-*` vars; 0 base element styling. Designed to layer *on top of* Tailwind/another base. **Vendoring this alone = unstyled report.** |

CDN (for vendoring the file into the repo):
```
https://cdn.jsdelivr.net/npm/@anyblades/blades@2.4.3/css/blades.min.css
```

### 0.3 The "~12KB / 98% smaller" headline is wrong — but the win is still real

ADR-002 conflated the 10KB add-on with the framework size. Honest numbers:

| | Current | Blades | Reduction |
|---|---|---|---|
| CSS | 98 KB (Tailwind) | ~91 KB (`blades.min.css`) | ~7% |
| JS | 702 KB (tw-elements) | **0 KB** | **100%** |
| **Total embedded** | **~825 KB** | **~91 KB** | **~89%** |

The real value proposition is **eliminating 702KB of JavaScript** (and with it the Android-broken
components, the build step, and the broken print output) — not shrinking the CSS. Re-state the ADR
headline as "~89% smaller, zero JS" rather than "98% / ~12KB." If raw byte count truly matters,
a hand-rolled stylesheet (§10.4) lands at ~8–15KB, but you lose the framework's tested element
styling.

---

## 1. Document structure & semantics

Use native HTML5 landmarks; do not add redundant ARIA roles (modern browsers map `<header>`/`<nav>`/
`<main>`/`<footer>` automatically — WAI technique H101). One `<h1>`, sequential heading descent, never
skip a level (screen-reader users navigate by level).

Recommended outline (executive summary → per-file → per-control drill-down):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>Heimdall {{exportType}} Report — {{reportDate}}</title>
  <meta name="generator" content="Heimdall">
  <style>/* blades.min.css + report overrides inlined here */</style>
</head>
<body>
  <a class="skip-link" href="#main">Skip to report content</a>

  <header>                                   <!-- banner landmark -->
    <h1>{{exportType}} Report</h1>
    <p>Generated {{reportDate}} · {{files.length}} file(s)</p>
  </header>

  <nav aria-label="Report contents">         <!-- in-page TOC, no JS -->
    <ul>
      <li><a href="#summary">Executive summary</a></li>
      {{#resultSets}}<li><a href="#file-{{fileID}}">{{filename}}</a></li>{{/resultSets}}
    </ul>
  </nav>

  <main id="main">
    <section id="summary" aria-labelledby="summary-h">
      <h2 id="summary-h">Executive Summary</h2>
      <!-- compliance meter + status/severity tables — §2, §3, §5 -->
    </section>

    {{#resultSets}}                           <!-- one <section> per loaded file -->
    <section id="file-{{fileID}}" aria-labelledby="file-{{fileID}}-h">
      <header>
        <h2 id="file-{{fileID}}-h">{{filename}}</h2>
        <p>{{compliance.level}}% compliance · {{results.length}} controls</p>
      </header>

      {{#results}}                            <!-- each control = standalone <article> -->
      <article id="{{resultID}}" aria-labelledby="{{resultID}}-h">
        <details>
          <summary>
            <h3 id="{{resultID}}-h">{{data.id}} — {{data.title}}</h3>
            <!-- status + severity badges — §3 -->
          </summary>
          {{#showResultSets}}                 <!-- Manager+ : results -->
          <dl>
            <dt>Description</dt><dd>{{data.desc}}</dd>
            <dt>Check</dt><dd>{{data.checktext}}</dd>
            <dt>Fix</dt><dd>{{data.fixtext}}</dd>
            <dt>NIST 800-53</dt><dd>{{data.nisttags}}</dd>
          </dl>
          {{/showResultSets}}
          {{#showCode}}                        <!-- Administrator : code output -->
          <figure>
            <figcaption>Test output</figcaption>
            <pre><code>{{data.codeoutput}}</code></pre>
          </figure>
          {{/showCode}}
        </details>
      </article>
      {{/results}}
    </section>
    {{/resultSets}}
  </main>

  <footer>
    <p>Heimdall · {{reportDate}} · self-contained export</p>
  </footer>
</body>
</html>
```

Element rationale:
- **`<article>` per control** — each control is a standalone, independently-meaningful unit.
- **`<section aria-labelledby>` per file / summary** — becomes a navigable named region landmark.
- **`<dl>`** for label→value metadata (Description/Check/Fix/NIST) — semantically correct, beats stacked `<div>`s.
- **`<figure>/<figcaption>` around `<pre><code>`** — gives the code block an associated caption.
- **Nested `<header>`** inside a section is *not* a banner; only body-level `<header>` is.

What real tools do: Lighthouse self-contains by inlining every asset into one HTML string (the model
to emulate); OWASP ZAP gates optional content with "sections" (maps cleanly to your three export
levels — render the same DOM, gate the `<dl>`/`<figure>` blocks by level); Trivy's HTML template is a
useful *data-shape* reference but its markup (bare `<th>`, no `<caption>`, color-only severity) is a
WCAG anti-pattern — don't copy it.

---

## 2. Accessibility (WCAG 2.1 AA)

### 2.1 Disclosure widgets — use native `<details>`/`<summary>`, add nothing
The browser handles `aria-expanded` and keyboard (Enter/Space). **Do not** add `role="button"` or
manual `aria-expanded` — that's the custom-widget path you only need without `<details>`.
Known gotcha: JAWS does not list a heading placed inside `<summary>`. Mitigate by also labeling the
wrapping `<article>`/`<section>` via `aria-labelledby` (done in §1) so it's reachable as a region.

### 2.2 Status & severity must never rely on color alone (WCAG 1.4.1)
~8% of men have color-vision deficiency, and printed/grayscale copies lose hue entirely. Every status
carries **text label + icon/shape + color** (color is the least important channel). Icon is decorative
(`aria-hidden="true"`); the visible text carries the meaning.

```html
<span class="status status--fail">
  <span class="status__icon" aria-hidden="true">✕</span> Failed
</span>
```

### 2.3 Accessible data tables
`<caption>` as the first child, `<thead>`, and `scope` on every `<th>`. `scope` is sufficient for
almost all tables; reserve `headers`/`id` for genuinely irregular multi-level headers. Do **not** use
the dropped HTML5 `summary=""` attribute.

```html
<table>
  <caption>Control results by status — {{filename}}</caption>
  <thead>
    <tr><th scope="col">Status</th><th scope="col">Count</th><th scope="col">%</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row"><span class="status status--pass">✓ Passed</span></th><td>118</td><td>83%</td></tr>
    <!-- ... -->
  </tbody>
</table>
```

**The #1 silent table-a11y bug:** setting `display:block` / `flex` / `grid` / `contents` on a
`<table>`, `<thead>`, `<tbody>`, or `<tr>` strips table semantics from the accessibility tree. The
common responsive snippet `table{display:block;overflow-x:auto}` breaks screen-reader table navigation.
Wrap instead (see §5.4) — never restyle the `<table>`'s own display.

### 2.4 Compliance percentage — `<meter>`, not `<progress>`
Compliance is a measurement on a 0–100 scale, not a task in progress → `<meter>` is semantically
correct (W3C APG: "the meter should not be used to indicate progress"). Prefer native over
`role="meter"`. Always include visible "%" text (colorblind users can't read the meter's auto-color).

```html
<figure class="compliance">
  <figcaption id="comp-label">Overall compliance</figcaption>
  <meter id="comp-meter" min="0" max="100" low="50" high="80" optimum="100"
         value="{{compliance.level}}" aria-labelledby="comp-label">{{compliance.level}}%</meter>
  <span class="compliance__value">{{compliance.level}}%</span>
</figure>
```

### 2.5 Screen-reader-only utility (used by badges/table context)
```css
.sr-only {
  position:absolute; width:1px; height:1px; padding:0; margin:-1px;
  overflow:hidden; clip:rect(0,0,0,0); clip-path:inset(50%); white-space:nowrap; border:0;
}
```

### 2.6 Skip link, focus, landmarks
```css
.skip-link { position:absolute; left:-9999px; top:0; background:#000; color:#fff; padding:.5rem 1rem; z-index:100; }
.skip-link:focus { left:0; }
:focus-visible { outline:3px solid #1a73e8; outline-offset:2px; }   /* never strip focus outlines */
```
The `<nav>` TOC (§1) is essential with 200+ controls so keyboard/SR users aren't forced to tab through
everything. **Do not** add `aria-live`/`role="status"` — a static export never mutates, so live regions
do nothing here.

---

## 3. Status & severity color system

Requirements: WCAG AA contrast (4.5:1 text, 3:1 UI/large), colorblind-safe (deuteranopia/protanopia/
tritanopia), works in light **and** dark mode, degrades in grayscale print, and **never color alone**.
Values below are anchored on GitHub Primer (proven AA at scale) with deliberate hue+luminance
separation. Heimdall's mapper already emits `compliance.color`; align these tokens with it.

```css
:root {
  color-scheme: light dark;

  /* STATUS — light / dark via light-dark() (one declaration per token, §7) */
  --st-pass-fg:   light-dark(#1a7f37, #3fb950);
  --st-pass-bg:   light-dark(#dafbe1, #132d1c);
  --st-fail-fg:   light-dark(#b3202a, #f85149);
  --st-fail-bg:   light-dark(#ffebe9, #3a1517);
  --st-na-fg:     light-dark(#59636e, #8b949e);   /* notApplicable */
  --st-na-bg:     light-dark(#eef1f4, #21262d);
  --st-nr-fg:     light-dark(#9a4d00, #db8a30);   /* notReviewed   */
  --st-nr-bg:     light-dark(#fff1e5, #2a1a0a);
  --st-error-fg:  light-dark(#6639ba, #a371f7);   /* profileError  */
  --st-error-bg:  light-dark(#fbefff, #2a1a44);

  /* SEVERITY — ordered cool→warm ramp (also a luminance ramp for grayscale) */
  --sv-none-fg:     light-dark(#59636e, #8b949e);  --sv-none-bg:     light-dark(#eef1f4,#21262d);
  --sv-low-fg:      light-dark(#1a5fb4, #58a6ff);  --sv-low-bg:      light-dark(#ddf4ff,#0d2b45);
  --sv-medium-fg:   light-dark(#9a6700, #d29922);  --sv-medium-bg:   light-dark(#fff8c5,#2e2410);
  --sv-high-fg:     light-dark(#bc4c00, #db8a30);  --sv-high-bg:     light-dark(#fff1e5,#3a2410);
  --sv-critical-fg: light-dark(#b3202a, #f85149);  --sv-critical-bg: light-dark(#ffebe9,#3a1517);
}

.status, .sev {
  display:inline-flex; align-items:center; gap:.35em; padding:.1em .5em;
  border-radius:4px; font-weight:600; border:1px solid transparent;
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
}
.status--pass  { color:var(--st-pass-fg);  background:var(--st-pass-bg);  border-color:var(--st-pass-fg); }
.status--fail  { color:var(--st-fail-fg);  background:var(--st-fail-bg);  border-color:var(--st-fail-fg); }
.status--na    { color:var(--st-na-fg);    background:var(--st-na-bg); }
.status--nr    { color:var(--st-nr-fg);    background:var(--st-nr-bg); }
.status--error { color:var(--st-error-fg); background:var(--st-error-bg); }

.sev--none{color:var(--sv-none-fg);background:var(--sv-none-bg)}
.sev--low{color:var(--sv-low-fg);background:var(--sv-low-bg)}
.sev--medium{color:var(--sv-medium-fg);background:var(--sv-medium-bg)}
.sev--high{color:var(--sv-high-fg);background:var(--sv-high-bg)}
.sev--critical{color:var(--sv-critical-fg);background:var(--sv-critical-bg)}
```

Notes: pass=green / fail=red are the classic deuteranopia-confusable pair — that's *why* the icon+label
pairing in §2.2 is mandatory. NR=orange and error=purple separate from red by hue and luminance.
Dark-mode foregrounds use Primer's lighter, less-saturated values (saturated reds halate on black).
**Run final fg/bg pairs through a contrast checker before shipping** — small bg shifts change ratios.
Severities are rendered in a fixed order (none→critical) so the ramp itself reinforces ordering.

---

## 4. Typography (system fonts only — no web fonts)

```css
:root {
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif,
               "Apple Color Emoji", "Segoe UI Emoji";
  --font-mono: ui-monospace, "Cascadia Code", "Source Code Pro", SFMono-Regular, Menlo,
               Consolas, "DejaVu Sans Mono", "Liberation Mono", "Courier New", monospace;

  /* modular scale, ratio 1.25 — restrained to save vertical space across 200+ controls */
  --step--1:.8rem; --step-0:1rem; --step-1:1.25rem; --step-2:1.5625rem; --step-3:1.953rem; --step-4:2.441rem;
}
html { font-size:100%; }                         /* respect user/browser zoom */
body { font-family:var(--font-sans); font-size:1rem; line-height:1.5; }
.prose { max-width:66ch; }                        /* measure for prose only — NOT tables */
h1,h2,h3,h4 { line-height:1.2; font-weight:600; margin:1.5em 0 .5em; }
h1{font-size:var(--step-4);font-weight:700} h2{font-size:var(--step-3);border-bottom:1px solid var(--border);padding-bottom:.3em}
h3{font-size:var(--step-2)} h4{font-size:var(--step-1)}

pre, code, .mono { font-family:var(--font-mono); font-size:.8125rem; line-height:1.45;
                   font-variant-ligatures:none; }    /* don't ligate ==, != in command output */
pre { white-space:pre-wrap; overflow-wrap:anywhere; tab-size:2; }

.num, td.num { font-variant-numeric:tabular-nums lining-nums; text-align:right; }  /* align counts/% */
```

Always declare via `font-family`, never the `font` shorthand (some engines drop a leading
`-apple-system` in shorthand). `ui-monospace`/`system-ui` resolve to the platform font on each OS with
zero download — the small per-OS rendering variance is the correct trade-off for offline single-file
delivery (embedding a subset font would add 50–300KB, the very thing the air-gap goal avoids).

---

## 5. Data tables

### 5.1 Base + the sticky-header gotcha
Use `border-collapse:separate` (not `collapse`) so a sticky `<thead>` keeps its bottom rule — with
`collapse`, the collapsed border belongs to the table box and slides out from under the stuck header.
Draw the header's bottom rule as a `box-shadow` (painted relative to the cell, so it travels):

```css
.report-table { width:100%; border-collapse:separate; border-spacing:0; font-size:.875rem; }
.report-table th, .report-table td { padding:.5rem .75rem; text-align:left; vertical-align:top;
  border-bottom:1px solid var(--border); }
.report-table thead th {
  position:sticky; top:0; z-index:2;
  background:var(--card-bg);                      /* MUST be opaque or rows bleed through */
  box-shadow:inset 0 -2px 0 var(--border);        /* sticky-safe bottom rule */
  font-weight:600; white-space:nowrap;
}
.report-table tbody tr:nth-child(even) td { background:color-mix(in srgb, var(--fg) 4%, transparent); }
.report-table tbody tr:hover td { background:color-mix(in srgb, var(--fg) 8%, transparent); }
```
`position:sticky` is relative to the nearest scroll container, so do **not** put `overflow-y` on the
table wrapper — keep vertical scroll at page level so `top:0` sticks to the viewport.

### 5.2 Responsive — wrap, don't restyle the table (preserves semantics)
The accessible pattern (Adrian Roselli): a focusable, labeled scroll region around the real table.

```html
<div role="region" aria-labelledby="t1-cap" tabindex="0" class="table-scroll">
  <table class="report-table"><caption id="t1-cap">Results — {{filename}}</caption>…</table>
</div>
```
```css
.table-scroll { overflow-x:auto; }
.table-scroll:focus { outline:.1em solid rgba(0,0,0,.3); }
```
`tabindex="0"` lets keyboard users scroll it; `role="region"`+`aria-labelledby` names it. The `<table>`
stays a real table in the a11y tree. (A `data-label`+`::before` stacked-card fallback exists for very
narrow screens but reintroduces the display-semantics caveat — gate it behind an opt-in class and use
only for row-independent tables.)

### 5.3 Sorting — be honest: it needs JS
CSS-only "sortable columns" (checkbox/radio hacks) can't sort strings, don't scale past one small
table, and can't reorder DOM rows without pre-baking every permutation. **For a static export, sort at
generation time** (failed-first, then severity-descending) in the mapper and emit rows pre-ordered.
That's the correct static-artifact answer. Leave `aria-sort`-ready markup only if JS sorting is ever
added.

---

## 6. Information density & navigation (200+ controls)

- **Progressive disclosure with native `<details>`** is the no-JS engine for per-control drill-down and
  the three export levels. Executive = summary cards + roll-up table, no control `<details>`;
  Manager = controls with `<dl>` results; Administrator = + `<pre>` code (optionally inside a nested
  `<details><summary>Show output</summary>` so 200 controls don't render as one wall).
- **Exclusive accordion without JS:** add `name="..."` to sibling `<details>` so opening one closes the
  others (Baseline since Sept 2025; older browsers degrade to independent accordions — still fine).
- **Group and pre-sort at generation time:** `File → Status (Failed first) → severity-desc`, with counts
  baked into headings (`Failed (37)`) for scannability.
- **In-page nav (all CSS):** anchor-link TOC (§1), `scroll-behavior:smooth`, and `scroll-margin-top` so
  anchored headings don't hide under a sticky bar:
  ```css
  html { scroll-behavior:smooth; }
  [id] { scroll-margin-top:5rem; }
  .report-nav { position:sticky; top:0; z-index:10; background:var(--bg); border-bottom:1px solid var(--border); }
  ```
- **`:target` deep-link highlight** — paste `report.html#V-230221` to jump+highlight a control:
  ```css
  article:target { outline:3px solid var(--accent); }
  ```
- A true scroll-spy (auto-highlight the current section in the TOC) genuinely needs JS — don't promise it.
- **Summary-first** layout (the SonarQube/Trivy pattern): a top stat band before any list.
  ```css
  .summary-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(8rem,1fr)); gap:.75rem; }
  .stat { border:1px solid var(--border); border-radius:8px; padding:1rem; text-align:center; }
  .stat-value { font-size:var(--step-3); font-weight:700; font-variant-numeric:tabular-nums; }
  ```

---

## 7. Dark mode

Use `color-scheme: light dark` + `light-dark()` so each token is declared once instead of duplicated
across a `prefers-color-scheme` block. `light-dark()` is Baseline since May 2024 (Chrome/Edge 123,
Safari 17.5, Firefox 120) — safe for any current browser. Set `<meta name="color-scheme" content="light dark">`
so UA-styled controls/scrollbars match before CSS parses.

```css
:root {
  color-scheme: light dark;
  --bg:      light-dark(#ffffff, #14181c);   /* soft black, not #000 */
  --fg:      light-dark(#1c1e21, #e6e9ef);
  --muted:   light-dark(#5c6370, #9aa4b2);
  --border:  light-dark(#d0d7de, #2d333b);
  --card-bg: light-dark(#f6f8fa, #1c2128);
  --accent:  light-dark(#1a73e8, #58a6ff);
}
body { background:var(--bg); color:var(--fg); }
```

**Manual toggle:** if zero-JS is required, a `:root:has(#dark-toggle:checked)` checkbox flips tokens
(binary light/dark, no persistence — irrelevant for a one-page file). If a few lines of inline JS are
acceptable, the cleaner option is flipping `color-scheme` on `:root` via a `data-scheme` attribute
(gives a true light/dark/auto three-state and composes perfectly with `light-dark()`):
```css
:root[data-scheme="light"] { color-scheme:light; }
:root[data-scheme="dark"]  { color-scheme:dark; }
```
Note: **Blades/Pico already ship `data-theme` + `prefers-color-scheme` dark mode**, so if you vendor
`blades.min.css` you get the toggle hook for free — prefer its mechanism over rolling your own.

Status/severity colors keep their own light/dark variants (§3). Print always forces light (§9).

---

## 8. CSS-only interactivity — what's free vs what needs JS

| Capability | CSS-only? | How |
|---|---|---|
| Collapse / accordion | ✅ | `<details>` / `<details name>` (exclusive) |
| Per-control drill-down | ✅ | `<details>` |
| Deep-link highlight | ✅ | `:target` |
| Compliance bar | ✅ | `<meter>` (§2.4) or `.bar{width:var(--value)}` from inline style |
| Scroll-to-top / smooth scroll / anchor offset | ✅ | `#top` anchor, `scroll-behavior`, `scroll-margin-top` |
| Sticky TOC | ✅ | `position:sticky` (but **auto-highlight active section = JS**) |
| Tabs | ⚠️ | radio-`:checked` hack works but harms keyboard a11y — prefer `<details>` sections; use JS if tabs are essential |
| **Sort / filter / free-text search** | ❌ | **requires JS** — for a static export, pre-sort/group at generation time instead |

Tabs caveat: never hide the radios with `display:none`/`visibility:hidden` (kills keyboard access); use
focus-preserving `.sr-only`. For Heimdall, "show all files in sequence with anchor-linked headings"
(migration-context Option 3) is the right V1 choice over radio-hack tabs.

---

## 9. Print CSS (browser print-to-PDF)

Heimdall prints via the browser's own Print-to-PDF (no Paged.js/WeasyPrint in an air-gap), so build on
`@page` margin boxes + page counters and `<thead>` repetition. (`position:running()`/`string-set` are
silently ignored in browser print — don't depend on them.)

```css
@media print {
  /* 1) Page setup + page numbers (counters only resolve inside @page margin boxes) */
  @page { size: letter; margin: .75in;
    @bottom-right { content: "Page " counter(page) " of " counter(pages); font:9pt system-ui; color:#444; }
    @bottom-left  { content: "Heimdall {{exportType}} Report"; font:9pt system-ui; color:#444; }
  }
  @page :first { @bottom-left { content:none; } }

  /* 2) Force light theme regardless of dark mode (toner + legibility) */
  :root, :root[data-scheme="dark"], html[data-theme="dark"] { color-scheme: light; }
  body { background:#fff !important; color:#000 !important; }

  /* 3) Keep status/severity backgrounds (browsers strip bg by default) */
  :root { -webkit-print-color-adjust:exact; print-color-adjust:exact; }

  /* 4) Force ALL <details> open + strip the marker (collapsed content is invisible to print AND Ctrl-F) */
  details { display:block; }
  details > *:not(summary) { display:revert !important; }
  summary { list-style:none; cursor:default; }
  summary::-webkit-details-marker { display:none; }
  summary::marker { content:""; }

  /* 5) Repeat table headers across pages; never split a row/control/code block */
  thead { display:table-header-group; }
  tr, .control-card, pre, figure, table { break-inside:avoid; page-break-inside:avoid; }
  h3, .control-title { break-after:avoid; page-break-after:avoid; }   /* keep title with body */
  p, li { orphans:3; widows:3; }

  /* 6) Hide interactive chrome; expose external link URLs, suppress internal/mailto */
  nav, .report-nav, button, .no-print, .theme-switch, [data-scheme] { display:none !important; }
  a[href]::after { content:" (" attr(href) ")"; font-size:90%; color:#555; word-break:break-all; }
  a[href^="#"]::after, a[href^="mailto:"]::after { content:""; }
}
```

Because §2.2/§3 pair every status with an icon + text label, the report stays fully legible even on a
black-and-white printer that ignores `print-color-adjust`. Belt-and-suspenders for forcing `<details>`
open across all engines: a tiny inline `beforeprint`/`afterprint` script can flip the `open` attribute
(CSP-safe in a self-contained file) — only add it if the CSS-only approach proves insufficient in
testing.

---

## 10. Blades CSS integration

### 10.1 What to vendor (see §0.2)
Vendor **`blades.min.css`** (the 91KB full framework), not `blades.standalone.css`. Inline it into the
`<style>` block (`{{{bladesStyles}}}`). It styles `<details>`, `<summary>`, `<table>`, `<nav>`,
`<article>`, `<progress>`, forms automatically — the semantic markup in §1 needs almost no classes.

### 10.2 Theming via `--pico-*` overrides
Blades exposes ~1095 `--pico-*` custom properties (it kept Pico's prefix for drop-in compatibility —
your overrides work against either `@anyblades/blades` or `@anyblades/pico`). Override after the Blades
block in your own inlined `<style>`:
```css
:root {
  --pico-font-family: var(--font-sans);
  --pico-border-radius: .375rem;
  --pico-primary: #1a73e8;
}
[data-theme="dark"] { --pico-primary: #58a6ff; }   /* brand both schemes */
```
Blades dark mode: automatic via `@media (prefers-color-scheme: dark)`, plus `data-theme="light|dark"`
to force a scheme document-wide or per element.

### 10.3 Layer the report-specific CSS on top
Blades gives you the base; this guide's §3 (status/severity tokens), §9 (print correctness), and §2
(a11y) are **report-specific and not provided by any framework** — inline them after the Blades block.
That thin override layer is where the real report quality lives.

### 10.4 Decision: Blades vs Pico vs hand-rolled
- **Blades `blades.min.css` (recommended)** — proven semantic/classless base, `--pico-*` theming,
  built-in dark mode + print, drop-in compatible with Pico (you can swap to `@anyblades/pico` with zero
  token changes if maintenance ever becomes a concern). ~91KB / ~14KB gz inlined.
- **Pico classless** — `pico.classless.min.css` ~69KB; the more battle-tested/larger-community option.
  Choose if Blades' newer/single-maintainer status is a concern; theming is identical (`--pico-*`).
- **Hand-rolled minimal** — ~8–15KB, total control, smallest file; but you re-implement table/form/badge
  styling and own all cross-browser edge cases. Everything in §1–§9 is framework-independent and drops
  into this path too. Choose only if raw byte count is a hard requirement.

Bottom line: **vendor `blades.min.css`, then layer the §3/§9/§2 report CSS on top.** That's a proven
semantic base plus the accessibility/print correctness no framework ships.

---

## Sources

Structure/a11y: web.dev (Headings & sections, Semantic HTML, Details), WAI H101, WebAIM (Semantic
Structure, Data Tables), MDN (`<details>`, microdata, ARIA progressbar/meter roles), Adrian Roselli
(Disclosure Widgets; Tables/CSS Display/ARIA; Responsive Tables; Sortable Columns), Scott O'Hara
(details/summary), W3C Understanding 1.4.1, W3C APG Meter pattern, Steve Faulkner (CSS display & table
semantics), Section508.gov (color usage), TPGI (visually-hidden).

Print/color: MDN (`@page`, print-color-adjust, break-inside, page-break-*), Aaron Saray (print CSS
headers/footers 2025), PrintCSS.net, DocRaptor (CSS paged media), Paged.js, CSS-Tricks (print-color-adjust,
@page, page-break, sticky table headers), GitHub Primer (color primitives), GitLab Pajamas (design
tokens), IBM Carbon (status indicator pattern), SonarQube (colorblind discussion), SciDraw/conceptviz
(Okabe-Ito).

Typography/tables/density: modern-font-stacks, CSS-Tricks (system font stack, sticky headers,
under-engineered responsive tables, details/summary accordion), Tailwind (font-family, font-variant-numeric),
MDN (font-variant-numeric), UXPin/USWDS (line length/measure), W3C CSSWG #3136 + Mozilla #1658119 (sticky
border bug).

Dark mode/CSS-only/frameworks: MDN (light-dark, prefers-color-scheme, :target, scroll-behavior),
caniuse (light-dark), pepelsbey.dev (native light-dark), kleinfreund.de (CSS-only dark mode tradeoffs),
CSS-Tricks (dark mode guide, functional CSS tabs), MDN Blog / Chrome for Developers (exclusive
accordions), Pico CSS docs (color-schemes, css-variables, customization), Blades CSS (blades.ninja,
github.com/anyblades/blades). Package/size facts verified against registry.npmjs.org and
cdn.jsdelivr.net on 2026-06-17.
