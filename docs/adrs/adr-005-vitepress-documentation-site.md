# ADR-005: VitePress Documentation Site

**Status:** Proposed
**Date:** 2026-07-10
**Author:** Aaron Lippold
**Related:** ADR-004 (its Phase 9 documentation channel is the motivating problem), `mitre/vulcan` docs site (the proven reference implementation)

---

## 1. Context

### 1.1 The Problem

Heimdall's user and operator documentation lives in the GitHub wiki (`mitre/heimdall2.wiki.git`) — a **separate git repository with no pull-request support**: no reviews, no branch protection, no CI, no forking through the UI. Anyone with write access pushes directly. Documentation changes therefore cannot ship in the same reviewed change set as the code they describe.

ADR-004 made this concrete: its breaking change to `REGISTRATION_DISABLED` names the wiki as a **required** communication channel (ADR-004 §6.2), yet the wiki rewrite cannot ride PR #8383 — it is a separate, unreviewed push someone must remember to do at release time. Verified 2026-07-09 against a clone of the wiki repo: exactly one page documents `REGISTRATION_DISABLED` (as the pre-ADR-004 boolean), no page documents JIT provisioning at all, and the login page's help icon (`LocalLogin.vue`) deep-links users into the wiki.

Additional forces:

- The wiki is 26 pages (24 content pages + `_Sidebar`/`_Footer`) of plain Markdown — already portable.
- Repo-level user-facing docs (`README.md`, `apps/backend/README.md`, `libs/*/README.md`, `CODE_OF_CONDUCT.md`) have no published home. **Corrected 2026-08-11 (Aaron):** this bullet originally added ADRs to that list and argued they were "invisible to deployers" — the premise that produced the `decisions/` site section. ADRs are internal project records, not deployer documentation; they are deliberately never published and live in `docs/adrs/` beside the site (§2.3).
- `mitre/vulcan` solved this exact problem with VitePress; its setup was read directly this session (`docs/.vitepress/config.mjs`, `.github/workflows/docs.yml`) and serves as the reference implementation.
- **Hard constraint:** Heimdall is a Yarn-workspaces monorepo (`workspaces: ["apps/*", "libs/*", "test"]`) with a Vue 2 frontend. A docs toolchain on Vue 3 must be invisible to the app build. Modifying the root `package.json` workspaces configuration is prohibited (a past `nohoist` change broke the entire frontend build).

### 1.2 Requirements

1. Documentation changes are PR-reviewable and can ship in the same PR as code changes.
2. The Vue 3 docs toolchain and the Vue 2 app are mutually invisible — no shared dependency resolution, no root `package.json` changes.
3. External user-facing content is written to current practice rather than moved verbatim. **Corrected 2026-08-11 (Aaron):** the original requirement read "existing content (wiki pages, repo Markdown, ADRs) migrates rather than being rewritten"; a full 56-document inventory found the wiki largely stale, so it is rewritten section by section (§2.3), and ADRs never enter the site at all.
4. Publishing is automated with no manual copy step (triggered by `release: published` + `workflow_dispatch` per §2.2.1 — corrected 2026-08-11 from "automatic on merge").

---

## 2. Decision

Adopt **VitePress**, following the `mitre/vulcan` pattern: a self-contained `docs/` directory inside `mitre/heimdall2` with its own `package.json` and `docs/yarn.lock`, built and deployed to GitHub Pages by a dedicated workflow, publishing **external user-facing documentation only** — the rewritten wiki content and the user-facing repo Markdown. Internal project records (ADRs, plans, research) stay in `docs/` beside the site and are never published (§2.3). The docs site supersedes the wiki as the canonical documentation channel; the wiki is reduced to pointer stubs.

### 2.1 Isolation Design (the load-bearing detail)

Verified against this repo's actual configuration:

- Root workspaces are `["apps/*", "libs/*", "test"]` (mirrored in `lerna.json`). A top-level `docs/` **matches none of these globs**, so root `yarn install` never sees it: no hoisting, no shared resolution, no lockfile interaction.
- `docs/` gets its own `package.json` + `docs/yarn.lock`, installed only by `yarn install` inside `docs/`. VitePress 2 and Vue 3 exist solely in `docs/node_modules`.
- Node module resolution walks **up** from a file, never sideways into `docs/node_modules` — the app's Vue 2 and the docs' Vue 3 cannot meet.
- The root `package.json`, `lerna.json`, and all workspace configuration are **not modified**. This is an invariant, not an implementation detail: the acceptance proof is that root `yarn install` and the full app build behave identically before and after the scaffold.
- Docker: the Dockerfile copies specific paths (no blanket `COPY .`); `docs/` is additionally added to `.dockerignore` to make the exclusion explicit.
- Docs pages read files (or symlink root Markdown, as Vulcan does); they never `import` app code.

### 2.2 Deployment

> **Amended 2026-08-11 (Aaron).** The original text — "triggered on pushes to master
> touching `docs/**` … Base path `/heimdall2/` (project pages)" — was copied from
> Vulcan's `docs.yml` without reconciling it against two facts about *this*
> repository. Both are corrected below. The trigger and the base path in the
> original text are superseded; the rest of the recipe stands.

The documentation has **two deployment targets**, selected at build time by
`docs/.vitepress/target.mjs` (§2.3.1). They are separate builds because `base` is
baked into asset URLs.

**A. In-app (the driving requirement).** The built site ships **with the
application** so a disconnected or airgapped installation — the RPM case — has
its documentation offline. Because it travels inside the release artifact, the
in-app documentation is **release-pinned by construction**: the docs on disk
always describe exactly the version installed. How the NestJS application serves
this build (static mount, CSP, packaging paths) is Phase 7.

**B. Published site.** A `.github/workflows/docs.yml` with `fetch-depth: 0`
(VitePress `lastUpdated` uses git timestamps), Node from `.nvmrc` (currently 22),
yarn cache keyed to `docs/yarn.lock`, and SHA-pinned actions.

- **Trigger: `release: published`, plus `workflow_dispatch`** for out-of-band
  documentation fixes — **not** pushes to master. Three reasons, in order of
  weight: (1) publishing from master would contradict target A — the public site
  would describe unreleased features while the docs shipped inside the user's
  install describe the release, and the two must not disagree; (2) this
  repository's existing Pages deployment (`.github/workflows/gh-pages.yml`)
  already uses `release: published`, so release-triggered is the established
  convention here; (3) mirroring the product's release process is the documented
  practice for *product* documentation, as distinct from a tool's own
  development-tip docs, which is the model Vulcan follows. `workflow_dispatch`
  covers the real cost of this choice — a typo fix that would otherwise wait for
  a release.
- **Base path: `/docs/` (see §2.2.1), and it is NOT `/heimdall2/`.** There is no
  `mitre.github.io/heimdall2/` site. This repository's Pages is bound to a custom
  domain and is **already occupied**: `gh api repos/mitre/heimdall2/pages` reports
  `status: built`, `cname: heimdall-lite.mitre.org`, `source: {branch: gh-pages,
  path: /}`, `build_type: legacy` — it serves **Heimdall Lite**, deployed on every
  published release, with an approved TLS certificate. Any documentation
  deployment must therefore choose a hosting shape (subdirectory of the existing
  site, a dedicated docs domain, a separate repository, or migrating this
  repository's Pages to an `actions/deploy-pages` workflow publishing one
  artifact) **and must not clobber Heimdall Lite** — `peaceiris/actions-gh-pages`
  publishes to the branch root and removes existing files by default. The chosen
  shape determines `base`; it is one value in the target table. **That hosting
  decision is open** — see §2.2.1.

**The wiki stays live until the published site exists.** Heimdall's documentation
is public today; an in-app-only site would remove access for anyone without a
running instance. §5.3's dependency chain already enforces this — Phase 6
(decommission) depends on Phase 5, which depends on Phase 2.

#### 2.2.1 Hosting shape — DECIDED 2026-08-11 (Aaron)

**One Pages site, published by `actions/deploy-pages` from a single artifact:
Heimdall Lite at `/`, the documentation at `/docs/`.** Four shapes were weighed —
a subdirectory added to the existing branch deploy, a dedicated docs domain, a
separate documentation repository, and this one.

Why this one:

- It is GitHub's current mechanism. The repository is on `build_type: legacy`
  (GitHub serves whatever sits on the `gh-pages` branch, force-pushed there by
  `peaceiris/actions-gh-pages`). Migrating to `actions/upload-pages-artifact` +
  `actions/deploy-pages` removes the orphan branch entirely and deploys with OIDC
  into a `github-pages` environment.
- **Atomic.** One artifact carries both sites, so there is no `destination_dir` /
  `keep_files` arrangement to get wrong — and the default behaviour of the branch
  deploy is to REMOVE existing files, which is exactly how Heimdall Lite would be
  destroyed by a careless documentation deploy.
- **The cadences already match.** Both Heimdall Lite and the documentation deploy
  on `release: published` (§2.2 B), so a single deployment is coherent rather than
  a compromise. Publishing from master would have forced them apart.
- Deployment history and rollback become visible in the Actions UI, and
  environment protection rules apply.

Costs and risks, stated plainly:

- It changes how a **live public site** deploys. `heimdall-lite.mitre.org` serves
  real users under an approved certificate; a botched migration takes it down.
  The migration must be verified end to end before a release relies on it.
- It requires a repository **settings change** (Pages source → GitHub Actions),
  which is an administrator action, not a code change. Aaron holds admin on the
  repository and performs this step when the workflow is ready — so it is a
  sequencing item, not a blocker.
- The custom domain moves from a `CNAME` file written into the published
  directory to the Pages configuration itself; the existing "Write
  Heimdall-Lite CNAME file" step in `gh-pages.yml` is removed with it.

Two consequences worth carrying forward:

- **The published base becomes `/docs/`** — the same value the in-app target uses.
  Whether the two targets can then share a single build, or still warrant separate
  builds to strip outbound chrome for the airgapped case, is an implementation
  question for Phase 2/Phase 7 rather than an architectural one.
- **This does not settle the domain NAME.** The site remains
  `heimdall-lite.mitre.org` — a hostname named for the browser-only viewer, while
  the documentation mostly describes Heimdall Server. Rebinding the Pages custom
  domain is a separate, later decision and is not required by this one.

### 2.3 Proposed Structure and Content Migration

> **Amended 2026-08-11 (Aaron), governing rule for this whole section:**
> **`site/` carries EXTERNAL USER-FACING documentation only.** Internal project
> records — ADRs, plans, research notes — are never published: they live beside
> the site under `docs/`, where `srcDir: 'site'` makes them structurally
> unbuildable into it. The original `decisions/` row (published ADRs) is removed
> accordingly, and Phase 4 carries only user-facing repo files (README,
> CODE_OF_CONDUCT, LICENSE, attributions), not ADRs.
>
> The internal trees are `docs/adrs/`, `docs/plans/` and `docs/research/` —
> Vulcan's `docs/{decisions,plans,research,site}` layout, with `adrs/` in place
> of its `decisions/` per the owner. Nothing outside `docs/site/` is published.

The 24 wiki content pages map into the site sections below; existing repo Markdown is symlinked or included, never duplicated. **Amended 2026-08-11 (Aaron): content is REWRITTEN, not moved** — the inventory found the wiki largely stale, so each section is authored fresh against the current product by its own card (§5.3), using the wiki as source material rather than as text to relocate. Two rules survive that change unaltered: license/notice/attribution files move **verbatim**, and the `REGISTRATION_DISABLED` content is owned by ADR-004 Phase 9.

| Site section | Content | Source |
|---|---|---|
| `getting-started/` | Installation, configuration, environment variables, troubleshooting | Wiki: Environment-Variables-Configuration, Troubleshooting, Docker-Bake; repo: `.env-example` narrative |
| `user-guide/` | Using Heimdall, groups/users, attestations, auth methods | Wiki: Group-and-User-Management, Manual-Attestations, Heimdall-Authentication-Methods |
| `deployment/` | Production installs, platform configs, releases | Wiki: Oracle-Linux-Production-Install, MITRE-Heimdall-Lite-and-Demo-Deployment-Configurations, Heimdall-Heroku-Documentation, How-to-create-a-Heimdall2-release |
| `developers/` | Architecture, code style, components, processes, tips | Wiki: Heimdall-Architecture-Information, Developers-Code-Style, Heimdall-Frontend-Components, Heimdall-Class-Diagrams, Heimdall-Processes-Documentation, Heimdall-Development-Tips-&-Tricks, Heimdall-Interface-Connections; repo: `apps/backend/README.md`, `libs/*/README.md` |
| `converters/` | HDF converter docs | Wiki: HDF-Converter-Mappings, HDF-Converters-How-Tos, CCI-Converter |
| `api/` | API documentation | Wiki: Heimdall-API-Documentation (vitepress-openapi rendering of a machine-readable spec is an investigation item, not a commitment) |
| `security/` | Security control responses | Wiki: Heimdall-Server-Security-Control-Responses |
| `about/` | Attributions, code of conduct, license | Wiki: Technology-Attributions (verbatim); repo: `CODE_OF_CONDUCT.md`, `LICENSE.md`, `README.md` (symlinked) |
| Landing (`index.md`) | Home + navigation | Wiki: Home, _Sidebar (becomes the sidebar config) |

#### 2.3.1 Concrete file tree (reference layout for Phases 1, 3, 4)

> **Amended 2026-08-11 (Phase 1 implementation, authorized by Aaron).** Two changes,
> both adopted from Vulcan *after* this ADR was written (Vulcan landed them on
> 2026-08-10; this ADR is dated 2026-07-10):
>
> 1. **Content lives under `docs/site/`, selected by `srcDir: 'site'`** — not flat
>    under `docs/`. Publishing becomes structural: a tree outside `site/` cannot be
>    published, so there is no exclude list to forget. This repository already keeps
>    working documents beside the site (`docs/research/`, the ADRs themselves), which
>    the flat layout would have tried to build into the public site.
> 2. **A build-target seam, `docs/.vitepress/target.mjs`**, carries `base`, `inApp`
>    and `outboundChrome`. Rationale: the documentation must ship **with the
>    application** so a disconnected/airgapped lab running the RPM install has it
>    offline. `base` is baked into asset URLs at build time, so the published site
>    and the in-app site are necessarily separate builds (both now at base
>    `/docs/` per §2.2.1, so they differ by outbound chrome rather than path), and
>    outbound chrome (GitHub edit link, social icons) is turned off for the in-app
>    target because those links are dead without a network.
>
> The §2.3 section map below is unchanged and still governs nav/sidebar. How the
> NestJS application serves the in-app build is deliberately not settled here.

Pages marked **NEW** are thin additive pages created during migration (an index, a checklist skeleton); they are not content rewrites and do not violate §4.3.

```
docs/                           # the docs PROJECT (own package.json + yarn.lock)
├── .vitepress/
│   ├── config.mjs              # nav/sidebar, srcDir: site, local search, dead-link check on
│   ├── target.mjs              # per-target base/inApp/outboundChrome (pages | local | app)
│   └── theme/                  # minimal — SAF logo, theme color only
├── adrs/                       # INTERNAL — architecture decision records; NEVER published
├── plans/                      # INTERNAL — implementation plans; NEVER published
├── research/                   # INTERNAL — research notes; NEVER published
└── site/                       # the PUBLISHED tree — only this builds
    ├── public/                 # migrated images, saf-logo.svg
    ├── index.md                # landing page (spec below)
    ├── getting-started/
│   ├── quick-start.md          ← Home.md (docker-compose path, split out)
│   ├── installation.md         ← Home.md + Docker-Bake.md
│   ├── configuration.md        ← Environment-Variables-Configuration.md (overview half)
│   ├── environment-variables.md← Environment-Variables-Configuration.md — THE canonical env
│   │                             reference; everything else links here, never duplicates
│   │                             (ADR-004 Phase 9 target)
│   └── troubleshooting.md      ← Troubleshooting.md
├── user-guide/
│   ├── overview.md             ← Home.md (usage half)
│   ├── groups-and-users.md     ← Group-and-User-Management.md
│   ├── attestations.md         ← Manual-Attestations.md
│   └── authentication.md      ← Heimdall-Authentication-Methods.md — owns the ADR-004
│                                 account_not_provisioned explanation; LocalLogin.vue's help
│                                 icon points here
├── deployment/
│   ├── production-checklist.md # NEW — TLS-mandatory (Helmet HSTS), REGISTRATION_DISABLED
│   │                             posture (ADR-004 §8), LOCAL_LOGIN_DISABLED ordering caveat,
│   │                             JWT/API-key secrets
│   ├── oracle-linux.md         ← Oracle-Linux-Production-Install.md
│   ├── lite-and-demo.md        ← MITRE-Heimdall-Lite-and-Demo-Deployment-Configurations.md
│   ├── heroku.md               ← Heimdall-Heroku-Documentation.md (migrate with a
│   │                             possibly-outdated banner; dropping content is the owner's
│   │                             per-page call, not the migrator's)
│   └── releases.md             ← How-to-create-a-Heimdall2-release.md
├── converters/
│   ├── mappings.md             ← HDF-Converter-Mappings.md
│   ├── how-tos.md              ← HDF-Converters-How-Tos.md
│   └── cci-converter.md        ← Control-Correlation-Identifier-(CCI)-Converter.md
├── developers/
│   ├── architecture.md         ← Heimdall-Architecture-Information.md
│   ├── frontend-components.md  ← Heimdall-Frontend-Components.md
│   ├── class-diagrams.md       ← Heimdall-Class-Diagrams.md
│   ├── processes.md            ← Heimdall-Processes-Documentation.md
│   ├── interface-connections.md← Heimdall-Interface-Connections.md
│   ├── code-style.md           ← Developers-Code-Style.md
│   ├── tips-and-tricks.md      ← Heimdall-Development-Tips-&-Tricks.md
│   ├── backend.md              ← apps/backend/README.md (included, not duplicated)
│   └── libraries.md            ← libs/inspecjs + libs/hdf-converters READMEs
├── api/
│   └── index.md                ← Heimdall-API-Documentation.md (vitepress-openapi later,
│                                 only if a maintained machine-readable spec exists — §4.3)
├── security/
│   └── control-responses.md    ← Heimdall-Server-Security-Control-Responses.md
├── release-notes/              # NEW section — versioned upgrade/migration notes; the
│   └── index.md                  ADR-004 breaking-change note is its first durable entry
│                                 (GitLab upgrade-notes pattern; wiki has no equivalent)
└── about/
    ├── attributions.md         ← Technology-Attributions.md (verbatim)
    ├── code-of-conduct.md      → symlink ../CODE_OF_CONDUCT.md
    └── license.md              → symlink ../LICENSE.md (verbatim)
```

#### 2.3.2 Landing page (`index.md`)

VitePress `layout: home` hero + features:

- **Hero:** name "Heimdall", text "Visualize and analyze your security results", tagline covering InSpec + the 30+ formats via hdf-converters, SAF logo. Actions: Quick Start → `/getting-started/quick-start`, Live Demo → the demo URL currently in `README.md` (taken from there, not invented), Environment Variables → the canonical reference.
- **Features (4):** View & Analyze (upload HDF, filter, drill into controls) · 30+ Converters · Deploy Anywhere (Docker, RPM, cloud, enterprise SSO/LDAP) · Compliance-Ready (NIST 800-53 views, attestations, exports).
- **Top nav:** Guide · Deploy · Converters · Developers · API, plus GitHub link. (Corrected 2026-08-11: the `Decisions` entry was removed with the `decisions/` section — §2.3.)

#### 2.3.3 Site capabilities

- **Local search** via VitePress's built-in provider (`themeConfig.search: {provider: 'local'}`) — zero dependencies, and the wiki's biggest missing feature.
- **`getting-started/environment-variables.md` is the single source of truth for configuration** — other pages link to it; duplicating variable descriptions elsewhere is a review-blocking error.
- **Known gap, deliberately not filled here:** the repo has no `CONTRIBUTING.md`. Docs sites conventionally link one from the footer; whether to create one — and its content — is a separate owner decision, out of this ADR's scope.

### 2.4 Wiki Decommission

Wikis cannot redirect, so each migrated wiki page is edited down to a one-line pointer to its new URL, and wiki editing is restricted to collaborators. Hardcoded wiki deep links in the product move to the docs site — verified inventory: `LocalLogin.vue` (external-authentication help icon), `apps/backend/.env-example` (header link), `README.md` (wiki references).

---

## 3. Alternatives Considered

### Option A: Keep the wiki (do nothing)

**Pros:** zero work; contributors know where it is.
**Cons:** the motivating problem — docs can never be PR-reviewed or ship with code changes; ADR-004's required channel stays a manual out-of-band push. **Rejected.**

### Option B: Docs-in-repo, plain Markdown only (no site generator)

Move wiki pages into `docs/` and rely on GitHub's Markdown rendering.
**Pros:** PR-reviewable, zero toolchain, zero isolation concerns.
**Cons:** no navigation/search/landing page for deployers; 24+ user-facing pages become a flat file listing; no versioned public URL to point the login page's help link at. **Rejected** — solves review but not publication.

### Option C: Keep the wiki, sync from repo via GitHub Action

Author docs in-repo, push to the wiki repo on merge.
**Pros:** PR review; wiki URLs keep working.
**Cons:** two sources of truth with drift risk; wiki remains the renderer (no nav/search/theme); sync action is bespoke infrastructure; direct wiki edits silently diverge. **Rejected** — more moving parts than publishing directly.

### Option D: MkDocs (Material)

**Pros:** mature, excellent search, used widely by MITRE SAF projects.
**Cons:** Python toolchain in a Node monorepo (new ecosystem for contributors and CI); no organizational reference implementation as close as Vulcan's. **Rejected** — viable, but VitePress keeps the toolchain Node-native and copies a working in-house pattern.

### Option E: Docusaurus

**Pros:** mature, React-based, versioned docs built in.
**Cons:** React toolchain in a Vue shop; heavier than needed; same isolation question with a larger surface. **Rejected.**

**Why VitePress:** Node/Vue-native (matches the team), the isolation problem is already solved and proven in-house (`mitre/vulcan` — same Vue 2 app + Vue 3 docs split, config and deploy workflow read directly and reusable nearly verbatim), and its `srcDir` makes the published tree structural, so internal records cannot leak into the site (§2.3). (Corrected 2026-08-11: this reason originally read "it publishes ADRs as first-class pages (Vulcan's `decisions/` section)" — the superseded premise.)

---

## 4. Consequences

### 4.1 Positive

- Documentation changes ship in the same reviewed PR as code (ADR-004 Phase 9's wiki row is superseded the moment this lands — the `REGISTRATION_DISABLED` page becomes an in-PR `getting-started/environment-variables.md` edit).
- Internal records (ADRs, plans, research) sit beside the site in the same reviewed repo, so a decision and the documentation it changes ship in one PR — without exposing project internals to end users. **Corrected 2026-08-11 (Aaron):** this line originally claimed ADRs gain "a published, linkable home (`decisions/`)"; they are not published (§2.3).
- The login page's help link points at a reviewed, versioned page instead of a wiki page anyone with write access can alter.
- Publishing is automatic; there is no manual copy step to forget at release time.

### 4.2 Negative / Risks

- One more toolchain to keep current (VitePress/Vue 3 in `docs/`), though Dependabot picks up `docs/package.json` automatically.
- Wiki URLs in the wild break unless the stub-pointer pass is done thoroughly.
- The isolation invariant depends on nobody "helpfully" adding `docs` to the workspaces globs or importing app code into docs — stated as a hard rule here and enforced by the scaffold card's acceptance criteria.
- VitePress 2 is in alpha (Vulcan runs `2.0.0-alpha.11` in production docs); pin the version, upgrade deliberately.

### 4.3 Out of Scope

- Custom domain (GitHub Pages project URL is sufficient to start)
- ~~Rewriting/modernizing page content during migration (move-and-organize only)~~ — **reversed 2026-08-11 (Aaron):** rewriting is now the work itself. Each site section is authored fresh against the current product by its own card (§5.3), with the wiki as source material.
- Publishing ADRs, plans or research (§2.3 — internal records never enter `site/`)
- Versioned docs (per-release snapshots)
- vitepress-openapi API rendering (investigation item — depends on a maintained machine-readable API spec)

---

## 5. Implementation Plan

### 5.1 Quality Standards (inherited by every card)

- **Isolation invariant:** root `package.json`, `lerna.json`, and workspace config are never modified. Every card's verification includes: root `yarn install` and app builds behave identically before/after.
- **Existing pattern:** Vulcan's `docs/.vitepress/config.mjs` and `docs.yml` are the reference — deviate only with a stated reason.
- **Verbatim rule for legal/attribution content:** `LICENSE.md`, `Technology-Attributions`, `CODE_OF_CONDUCT.md` move without any wording changes.
- **Dead links fail the build:** VitePress builds with dead-link checking on; every migration card's verification is `yarn build` inside `docs/`.
- **SHA-pinned actions** in the workflow, matching Vulcan.
- **No app imports in docs pages** — file reads and symlinks only.

### 5.2 Shared Abstractions

| Shared need | Used by | Built in |
|---|---|---|
| `docs/` scaffold (package.json, config.mjs, theme, index) | every content card | Phase 1 |
| Sidebar/nav structure (from §2.3 table) | every content card | Phase 1 |
| Deploy workflow + Pages setup | publication | Phase 2 |

### 5.3 Phases

Tracked as epic **`heimdall2-yvx`** on the heimdall2 beads board; every row below is a child card (`heimdall2-yvx.<n>`), and the Depends on column mirrors the board's own dependencies. ADR-004's Phase 9 card (`heimdall2-4qg.9`) soft-references this epic: once the docs site is live, its wiki deliverables become docs-site page edits.

**Board access:** the board is a shared Dolt database published at `refs/dolt/data` in this repository. Install `bd` from [gastownhall/beads](https://github.com/gastownhall/beads), then run `bd dolt pull` from a heimdall2 checkout with an existing beads clone, or `bd bootstrap` on a fresh machine. **Upgrade note (2026-07-10):** the board schema was migrated v49 → v54 — if you have a pre-existing beads clone, run `bd dolt pull` on your *current* bd binary **before** upgrading bd; if you upgraded first and bd refuses to start, `bd bootstrap` re-clones (push any local issues first). The team agent skills used to work these cards (card template, TDD gates, AC verification) live in [mitre/mitre-saf-skills](https://github.com/mitre/mitre-saf-skills).

> **Phase list REPLACED 2026-08-11 (Aaron).** The original six phases assumed a
> move-and-organize migration, so all 24 wiki pages sat on one card. After the
> 56-document inventory and the rewrite-not-move ruling (§2.3), the epic was
> re-planned from 6 cards to 17: one card per site section, plus the `docs/`
> reorganization that establishes the internal-vs-published contract, the
> canonical environment-variables reference every other page links to, the
> Kubernetes/Helm documentation that exists nowhere today, and in-app serving
> for airgapped installs. Card numbers are identifiers, not an order — read the
> Depends on column. What did NOT change: the wiki stays alive until a public
> site replaces it, so `yvx.6` runs last, behind `yvx.5` and `yvx.2`.

Foundation:

| Card | Scope | Depends on | Size |
|---|---|---|---|
| `yvx.1` ✅ | Scaffold: `docs/` with own package.json/yarn.lock, VitePress config (srcDir `site`, target seam, cleanUrls, lastUpdated, dead-link check), minimal theme, landing page, section skeleton, `.gitignore`/`.dockerignore`/eslint-ignore entries. AC: root install/build byte-identical | — | sp:3 |
| `yvx.7` | Reorganize `docs/` into internal (`adrs/`, `plans/`, `research/`) and published (`site/`) trees; amend this ADR to state that contract | — | sp:2 |
| `yvx.8` | The canonical `environment-variables.md` — heimdall2 has no environment-variables document at all today, and two competing partial references (a wiki page and the 489-line RPM man page) that will drift | 7 | sp:5 |

Content — one card per site section, written fresh against the current product:

| Card | Scope | Depends on | Size |
|---|---|---|---|
| `yvx.9` | `getting-started/` — quick start, install index, configuration, troubleshooting | 8 | sp:5 |
| `yvx.10` | `user-guide/` — how to actually use the Heimdall UI (compare, treemap, filters, exports, tags). The largest gap: documented nowhere today | 7 | sp:5 |
| `yvx.11` | `deployment/` — one page per install method, each linking to the method's own runbook rather than duplicating it, plus hardening, backup and upgrade | 8 | sp:5 |
| `yvx.12` | `deployment/kubernetes.md` — the `mitre/heimdall-helm` chart, undocumented everywhere today. Includes the probe caveat: the SPA catch-all returns 200 for any unmatched route, so a status-only `httpGet` probe reports false-healthy | 11 | sp:5 |
| `yvx.13` | `converters/` — supported formats, how-tos, CCI converter | 7 | sp:3 |
| `yvx.14` | `developers/` — architecture, setup, code style, release process | 7 | sp:3 |
| `yvx.15` | `api/`, `security/`, `about/` — the remaining sections | 8 | sp:3 |

Delivery and decommission:

| Card | Scope | Depends on | Size |
|---|---|---|---|
| `yvx.17` | In-app documentation for offline/airgapped installs: build the `app` target, serve it from NestJS at `/docs/` (static mount ordered ahead of the SPA catch-all), resolve the CSP conflict with VitePress's inline theme scripts, ship the output in the RPM and container images | — | sp:5 |
| `yvx.2` | Publication: one `actions/deploy-pages` artifact per §2.2.1 — Heimdall Lite at `/`, docs at `/docs/`, on `release: published` + `workflow_dispatch`, SHA-pinned, without clobbering Lite | 1 | sp:3 |
| `yvx.4` | User-facing repo Markdown symlinked into the site (README, CODE_OF_CONDUCT, LICENSE verbatim, attributions); the ADR half of this card was removed when §2.3 made internal records unpublishable | 3 | sp:2 |
| `yvx.5` | Product link updates: `LocalLogin.vue` help URL, `.env-example` header, `README.md` wiki references → docs-site URLs | 2, 3 | sp:1 |
| `yvx.6` | Wiki decommission: every page reduced to a pointer stub, editing restricted, final parity check against the wiki clone | 3, 4, 5 | sp:2 |
| `yvx.16` | Correct the FIPS posture statement — gated on the FIPS release actually shipping, because the current statement is TRUE for the released product | 11 | sp:1 |

`yvx.3` (migrate all 24 wiki pages as one card) is **closed as superseded** by the rewrite ruling and the per-section cards above.

---

## 6. References

- `mitre/vulcan` `docs/.vitepress/config.mjs` and `.github/workflows/docs.yml` — reference implementation (read directly 2026-07-09)
- `mitre/heimdall2.wiki.git` — migration source, cloned and audited 2026-07-09 (26 files, 24 content pages)
- ADR-004 §3.4 / §6.2 / Phase 9 — the documentation channel this ADR upgrades
- [VitePress documentation](https://vitepress.dev/)
- Root `package.json` workspaces / `lerna.json` — the isolation constraint (verified this session)
