# ADR-002: Migrate HTML Export from Tailwind/TW Elements to Blades CSS + LiquidJS

**Status:** Proposed (revised after deep review + Liquid research 2026-06-17)
**Date:** 2026-06-17
**Author:** Aaron Lippold
**Branch:** `feature/blades-css-html-export`

---

## 1. Context

### 1.1 The Problem

Heimdall's HTML export produces self-contained single-file reports for offline/air-gapped review. The current implementation embeds **~825KB** of CSS+JS per exported file:

| Asset | Size | Purpose |
|-------|------|---------|
| `tw-elements.min.js` | 702KB | JavaScript UI components (accordions, tabs) — **AGPL-3.0 licensed** |
| `style.css` (Tailwind compiled) | 98KB | Utility-class CSS framework |
| `template.html` | 24KB | Mustache template with 127 distinct Tailwind utility classes |
| **Total embedded per export** | **~825KB** | |

**Issues:**
1. **702KB AGPL JavaScript** embedded in Apache-2.0 exports — license conflict
2. **Broken on Android** — TW Elements JS disabled in Android HTML viewer
3. **Broken print** — JS accordions stay collapsed when printing
4. **No dark mode** in exports
5. **127 Tailwind utility classes** — unreadable, unmaintainable template
6. **Mustache template engine** — logic-less, forces presentation logic into the mapper, no partials/composition
7. **No filtering/search** — 200+ controls with no way to find what you need
8. **No syntax highlighting** for code output
9. **No WCAG accessibility** — color-only indicators, no landmarks, no skip links

### 1.2 Current Architecture

```
Build time:
  tailwind.css --> tailwindcss CLI --> style.css (98KB)
  tw-elements.min.js (702KB, vendored, AGPL)
  template.html (Mustache, 24KB)
  convert-to-embedded-strings.ts --> embedded-assets.ts (html, css, js string constants)

Runtime:
  FromHDFToHTMLMapper (reverse-html-mapper.ts)
    --> processes evaluation data into IOutputData
    --> Mustache.render(template, outputData)
    --> returns self-contained HTML string (~825KB+ base)
```

### 1.3 Must-Match Constraints (from live Heimdall app)

1. **Compliance formula**: `100 * Passed / (Passed + Failed + Not Reviewed + Profile Error)` — N/A excluded
2. **Compliance thresholds**: >= 90% = "high" (green), >= 60% = "medium" (yellow), < 60% = "low" (red)
3. **Status colors**: Align with `apps/frontend/src/store/color_hack.ts`
4. **Icons**: SVG icons already embedded as inline SVGs — framework-independent

---

## 2. Decision

Migrate the HTML export to:
- **Blades CSS** (`@anyblades/pico`) — classless/class-light CSS framework, MIT licensed
- **LiquidJS** — template engine replacing Mustache, enabling partials and composition
- **Idiomatic Blades patterns** — `data-tooltip`, `aria-current`, `<samp>`, `<mark>`, `data-jump-to`, semantic HTML5
- **ISSO-workflow filtering** — status/severity/NIST family filters + text search (~80 lines inline JS)
- **Shiki** — generation-time syntax highlighting for code blocks (zero client JS)

---

## 3. Blades CSS — Framework Choice

### 3.1 Package (verified against npm registry)

| Package | Version | File to vendor | Raw size | gzip |
|---------|---------|---------------|----------|------|
| `@anyblades/pico` | 2.4.2 | `css/pico.blades.min.css` | 92.6KB | 13.6KB |

### 3.2 Size Comparison

| | Current | After | Reduction |
|---|---|---|---|
| CSS | 98KB (Tailwind) | ~93KB (Blades) + ~3KB (custom) | ~2% |
| JS | 702KB (tw-elements, AGPL) | ~2KB (inline filter/theme) | **99.7%** |
| **Total embedded** | **~825KB** | **~98KB** | **~88%** |

The real win is eliminating 702KB of AGPL JavaScript.

### 3.3 Idiomatic Blades Patterns to Adopt

| Pattern | Blades Built-in | Replaces |
|---------|----------------|----------|
| `data-tooltip` | CSS-only tooltips on any element | Custom tooltip code |
| `aria-current` on buttons | Styled active state | Custom `.active` class + outline CSS |
| `<samp>` | Styled program output | `<code>` for test results (semantically wrong) |
| `<mark>` | Styled search highlight | Custom highlight code |
| `data-jump-to="top"` | Fixed back-to-top button | Missing feature |
| `role="group"` | Segmented button bar | Custom filter bar CSS |
| `<ins>`/`<del>` | Green/red text (theme-aware) | For segment pass/fail only (NOT badges — wrong semantics for SR) |
| `.grid` | Auto-fit equal columns | Custom grid (keep `.summary-grid` for `minmax(14rem,1fr)` wrapping) |
| `<details class="dropdown">` | CSS-only dropdown | `<select>` for NIST family filter |

**NOT to adopt** (verified wrong for our layout):
- `.responsive` on tables — full-bleed breakout, shatters card layout
- `.columns` for tags — newspaper text columns, not inline pills
- `<kbd>` for output — keyboard input semantics, wrong for program output

---

## 4. Template Engine — Mustache to LiquidJS

### 4.1 Why Migrate

| Factor | Mustache | LiquidJS |
|--------|----------|----------|
| Conditionals | Sections only (`{{#x}}`) | Real `{% if %}/{% elsif %}/{% else %}` |
| Loops | Same syntax as conditionals | Explicit `{% for %}` with `forloop.index/first/last` |
| Partials | None (monolith template) | `{% render %}` from in-memory map |
| Filters | None | `| capitalize`, `| size`, `| where`, `| join`, `| default` |
| Computed vars | None | `{% assign %}`, `{% capture %}` |
| Blades alignment | None | Native — Blades ships Liquid layout templates |

### 4.2 LiquidJS Details

- npm: `liquidjs` v10.27.0, ships TS types, one dep (`commander`)
- `engine.parseAndRender(template, data)` — async, direct Mustache.render replacement
- In-memory partials via `templates` constructor option — `Record<string, string>`, no filesystem
- `outputEscape: 'escape'` restores Mustache's safe-by-default behavior

### 4.3 Security — Escaping (Critical)

**Mustache and Liquid invert the escaping default:**
- Mustache: `{{x}}` escapes, `{{{x}}}` is raw
- Liquid (with `outputEscape: 'escape'`): `{{x}}` escapes, `{{ x | raw }}` is raw

Migration rule:
- `{{x}}` (plain text) → `{{ x }}` (escaped by engine option)
- `{{{x}}}` (raw HTML: icons, sanitized content) → `{{ x | raw }}`
- Field-by-field review required — each `| raw` must be justified

### 4.4 Template Decomposition

```
data/reverse-html-mapper/templates/
  report.liquid              # root: assembles shell + body
  html.liquid                # document shell (modeled on Blades pattern, no external refs)
  partials/
    summary.liquid           # executive summary cards
    filter-bar.liquid        # ISSO-workflow status/severity/NIST filters
    profile-info.liquid      # file metadata cards
    control-card.liquid      # single control article (rendered per-control)
    test-results.liquid      # test result tables within a control
```

### 4.5 Build Pipeline Change

`convert-to-embedded-strings.ts` emits a `templates` map instead of one `html` string:
```ts
// Scan templates/ directory, read all .liquid files
// Output: export const templates = { 'report': '...', 'partials/control-card': '...', ... }
// Output: export const css = '...' (Blades CSS)
```

Mapper render call:
```ts
import { Liquid } from 'liquidjs';
import { templates, css } from './embedded-assets';
const engine = new Liquid({ templates, outputEscape: 'escape', jsTruthy: true });
return engine.parseAndRender(templates['report'], this.outputData);
```

---

## 5. ISSO-Workflow Filtering (~80 lines inline JS)

### 5.1 Design Rationale

Designed for how ISSOs/assessors actually use compliance reports:
1. "Show me what failed" — #1 action, click Failed count
2. "What's left to review?" — click Not Reviewed
3. "Show me high/critical failures" — severity triage
4. "All the SSH controls" or "all AC family" — NIST family filter + text search
5. "Find V-71849" — text search by control ID

### 5.2 Filter Architecture

```
[Search: ___________] | [Expand All] [Collapse All] [Clear Filters] [☀/☾ Theme]
[✓ Passed (78)] [✗ Failed (149)] [⊖ N/A (10)] [⚠ NR (6)] [△ Error (0)]  |  [None] [Low] [Med] [High] [Crit]  |  [NIST Family ▼]
Showing 149 of 243 controls
```

- Status/severity buttons toggle with `aria-current` (Blades-idiomatic)
- NIST family dropdown built at page load by scanning `data-*` attributes
- All filters compose (intersection)
- `.filtered-out` class — print CSS overrides to show all
- Theme toggle flips `data-theme` attribute (Blades handles the rest)
- Graceful degradation — JS blocked = all controls visible, OS theme preference

---

## 6. Syntax Highlighting — Generation-Time Shiki

- Shiki uses TextMate grammars (VS Code accuracy)
- Runs in the mapper at `toHTML()` time — zero client JS
- Outputs `<span>` tags with inline styles or CSS classes
- ~2KB theme CSS inlined in template
- Auto-detects language (Ruby/Shell/JSON for InSpec output)
- Only Administrator exports get highlighting (Executive/Manager don't show code)

---

## 7. Cards

### Completed (valid, keep)

| ID | Title | sp | Status |
|----|-------|-----|--------|
| n3v.1 | Vendor Blades CSS + restructure pipeline | 3 | DONE |
| n3v.2 | Update IOutputData interface + mapper | 2 | DONE |

### Superseded (rework needed — built on Mustache + incomplete Blades)

| ID | Title | Why superseded |
|----|-------|---------------|
| n3v.3 | Template rewrite (Mustache) | Used Mustache, not Liquid; incomplete Blades idioms |
| n3v.4 | Custom CSS layer | Incomplete Blades idioms, missing data-tooltip/aria-current/samp |
| n3v.8 | Filtering (in progress) | Needs Liquid partials, NIST family filter, aria-current |
| n3v.5 | Test snapshots | Deps changed |
| n3v.6 | Cleanup | Deps changed |
| n3v.7 | Visual review | Deps changed |
| n3v.9 | Shiki highlighting | Deps changed |

### New Cards (from P3 onward)

| ID | Title | sp | Depends On |
|----|-------|-----|-----------|
| P3 | Migrate to LiquidJS + decompose into partial templates | 8 | P2 |
| P4 | Adopt idiomatic Blades components + consolidate color systems | 5 | P3 |
| P5 | Add ISSO-workflow filtering + search + theme toggle | 5 | P4 |
| P6 | Add syntax highlighting — generation-time Shiki | 3 | P5 |
| P7 | Escaping security review — field-by-field audit | 2 | P6 |
| P8 | Regenerate test snapshots + add migration tests | 3 | P7 |
| P9 | Remove remnants + verify clean state | 1 | P8 |
| P10 | Visual review + stakeholder signoff | 2 | P9 |

**Total new: 8 cards, 29 sp, ~145 min Claude-pace**
**Grand total (including P1+P2): 10 cards, 34 sp**

### Execution Order

```
P1 (vendor Blades) [DONE]
 |
P2 (interface rename) [DONE]
 |
P3 (LiquidJS + partials — critical path, sp:8)
 |
P4 (idiomatic Blades + color consolidation)
 |
P5 (ISSO filtering + search + theme toggle)
 |
P6 (Shiki syntax highlighting)
 |
P7 (escaping security review)
 |
P8 (test snapshots + migration tests)
 |
P9 (cleanup verification)
 |
P10 (visual review + signoff)
```

---

## 8. Testing Strategy (LiquidJS + Vitest)

### 8.1 Engine Configuration

Production AND test engines must use identical settings:
```ts
import { Liquid } from 'liquidjs';
const engine = new Liquid({
  templates,                  // in-memory Record<string, string> map
  outputEscape: 'escape',    // match Mustache safe-by-default (critical for XSS)
  strictVariables: true,     // fail loudly on undefined vars (catches un-prefixed loop vars)
  strictFilters: true,       // fail loudly on typo'd filters
  jsTruthy: true,            // JS truthiness for booleans (showResultSets, showCode)
});
```

### 8.2 Testability Architecture

The `templates` map (Record<string, string>) must be **exported** from `embedded-assets.ts` so tests import the same source of truth as production. Test any partial in isolation:
```ts
import { templates, css } from '../../../src/converters-from-hdf/html/embedded-assets';
const engine = new Liquid({ templates, outputEscape: 'escape', strictVariables: true });
const out = engine.renderFileSync('partials/control-card', mockControlData);
```

### 8.3 Test Layers (every card must include relevant layers)

1. **Per-partial fragment tests** — render one partial with mock data, assert specific HTML structure. Bulk of the suite.
2. **Escaping tests** — plain text IS escaped, `| raw` fields ARE raw, XSS payloads neutralized. Most critical.
3. **Strict-mode error tests** — undefined vars throw, undefined filters throw (catches typos/missed prefixes).
4. **Full-page structural snapshot** — ONE test with `<style>` stripped via `omitHTMLStyleTag`. Not per-card.
5. **Export-type tests** — Executive (no details), Manager (details, no code), Administrator (details + code).
6. **Custom filter tests** — if any registered, test input→output standalone.

### 8.4 Escaping Test Patterns (security-critical)

```ts
// Plain text IS escaped
engine.parseAndRenderSync('{{ desc }}', { desc: '<script>alert(1)</script>' })
// → '&lt;script&gt;alert(1)&lt;/script&gt;'

// Raw fields ARE raw (for SVG icons, sanitized HTML)
engine.parseAndRenderSync('{{ icon | raw }}', { icon: '<svg>...</svg>' })
// → '<svg>...</svg>'

// Double-escape gotcha: do NOT pipe | escape on top of outputEscape
engine.parseAndRenderSync('{{ x | escape }}', { x: '&amp;' })
// → '&amp;amp;' — WRONG, double-encoded. Use escape_once if needed.
```

### 8.5 Liquid Gotchas to Test For

1. **Empty strings are truthy in Liquid** — use `{% if x != blank %}` or `{% if x.size > 0 %}`, NOT just `{% if x %}`
2. **Loop variable prefixing** — `{% for result in results %}{{ resultID }}{% endfor %}` renders blank; must be `{{ result.resultID }}`
3. **`{% render %}` isolates scope** — child partial does NOT see parent variables unless explicitly passed
4. **Whitespace** — block tags on own lines leave blank lines; use `{%- -%}` / `{{- -}}` for trimming

### 8.6 Blades Starter Template Pattern

From https://blades.ninja/html/starter/ — the canonical Liquid composition:
```liquid
{% capture body %}
  <main class="container">{{ content }}</main>
  <footer>{{ site.footer }}</footer>
{% endcapture %}
{% include blades/html.liquid %}
```

Our `html.liquid` shell follows this pattern but omits external refs (favicon, CDN links) for self-contained output. Uses `site.inline_styles` array for CSS injection and `site.inline_scripts` for JS injection.

---

## 9. Print / PDF Strategy (researched 2026-06-17)

### 9.1 Primary Path: Browser Print-to-PDF

The `@media print` block in the template handles File→Print→Save as PDF. This is the air-gapped/DoD path — no server, offline, works from any browser.

### 9.2 Critical Bugs Found in Initial Implementation

**Bug 1 — `<details>` CSS-only reveal is broken in modern browsers.** Browsers now hide closed `<details>` content via `content-visibility: hidden` on the `::details-content` pseudo-element, NOT via `display:none` on children. So `details > *:not(summary) { display: revert }` is a no-op.

Fix (belt-and-suspenders):
- **Primary: JS `beforeprint`/`afterprint`** — sets `open=true` on all `<details>`, restores after print. Works in every browser.
- **Fallback: CSS** — `details::details-content { content-visibility: visible !important; }` (Baseline Sept 2025).

**Bug 2 — `break-inside: avoid` on tall elements clips content.** If an `<article>` or `<pre>` is taller than one page, Chrome pushes to a new page and clips overflow — content silently lost.

Fix: only `avoid` on elements guaranteed shorter than a page (table rows, badges, small figures). Let articles and pre break freely:
```css
tr, figure, .badge { break-inside: avoid; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; break-inside: auto; }
article.control { break-inside: auto; }
```

**Bug 3 — `content-visibility: auto` prints blank placeholders.** Our lazy-render optimization makes controls print as empty 200px boxes.

Fix: `article.control { content-visibility: visible !important; }` in `@media print`.

### 9.3 Browser Compatibility

| Feature | Chrome/Edge | Firefox | Safari |
|---------|-------------|---------|--------|
| `@page` margin boxes (page numbers) | 131+ (Nov 2024) ✅ | NOT supported ❌ | 18.2+ ✅ |
| `break-inside: avoid` | ✅ | ✅ | ✅ |
| `thead` repetition | ✅ | mostly ✅ | ✅ |
| `orphans`/`widows` | ✅ | ignored | ✅ |
| `print-color-adjust` | ✅ (needs `-webkit-` prefix too) | ✅ | ✅ (needs `-webkit-`) |
| `::details-content` | ✅ | ✅ | ✅ (Baseline Sept 2025) |
| `beforeprint` event | ✅ | ✅ | ✅ (16+, with matchMedia fallback for older) |

### 9.4 `<meter>` in Print

Native `<meter>` is unreliable in print — OS-themed widget frequently prints empty/gray. The `.compliance-ring` div is the robust print fallback. Consider hiding `<meter>` in print, showing only the ring.

### 9.5 Filtered Controls in Print — Design Decision

Two options:
- (a) **WYSIWYG** — print only visible (filtered) controls. User filters to "Failed", prints, gets only failures. (Recommended)
- (b) **Always full** — `.filtered-out { display: block !important }` forces all controls into print regardless of filter state.

Decision: **(a) WYSIWYG** — if user filtered, they want to print what they see. A "Print full report" option can be a separate button that clears filters first.

### 9.6 Server-Side PDF (Future, Opt-In)

Puppeteer/Playwright `page.pdf()` against the same self-contained HTML. Must:
- Set `printBackground: true` and `preferCSSPageSize: true`
- Explicitly open all `<details>` via `page.evaluate()` (don't rely on `beforeprint` firing)
- Document as requiring Chromium, never bundled into airgap CLI

Not in V1 scope — the browser print path is sufficient.

---

## 10. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | Liquid escaping regression (XSS) | Medium | High | `outputEscape:'escape'` + field-by-field `| raw` audit (P7) + `strictVariables:true` dev mode |
| R2 | Loop variable prefixing bugs (blank output) | High | Low | `strictVariables:true` during development catches immediately |
| R3 | LiquidJS perf with 500+ controls | Low | Low | Single render call; parse-once optimization available |
| R4 | Template rewrite produces visual regressions | High | Medium | P10 visual review with Playwright |
| R5 | NIST family parsing misses edge cases | Medium | Low | Regex `^[A-Z]{2}-` on control tags; CCI-* tags filtered out |
| R6 | Shiki bundle size too large | Medium | Medium | Use only core + ruby + shell + json languages |

---

## 11. Decision Points (resolved)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D1 | Field naming | `frameworkStyles` | Generic, future-proof |
| D2 | Dependency strategy | devDep `@anyblades/pico` | Zero transitive deps, dependabot |
| D3 | Interactivity | ~80 lines inline JS | Filtering + search + theme toggle; degrades gracefully |
| D4 | Sort order | Failed-first | Failures at top, ISSO workflow |
| D5 | Print layout | Single layout + CSS overrides | Force `<details>` open, ~30 lines |
| D6 | Template engine | LiquidJS replacing Mustache | Partials, conditionals, Blades alignment |
| D7 | Escaping strategy | `outputEscape:'escape'` + `| raw` for justified fields | Matches Mustache safe-by-default |

---

## 12. Reference Documents

| Document | Purpose |
|----------|---------|
| `docs/migration-context.md` | Technical context, data model details |
| `docs/blades-css-reference.md` | Full Blades CSS component catalog (verified against npm tarballs) |
| `docs/html-report-design-guide.md` | Modern HTML report design: structure, a11y, colors, typography, tables, print CSS |
