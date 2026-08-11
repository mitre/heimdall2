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
- Repo-level docs (`README.md`, `apps/backend/README.md`, `libs/*/README.md`, `CODE_OF_CONDUCT.md`) and ADRs (`docs/adr-004`, this document) have no published home; ADRs in particular are invisible to deployers.
- `mitre/vulcan` solved this exact problem with VitePress; its setup was read directly this session (`docs/.vitepress/config.mjs`, `.github/workflows/docs.yml`) and serves as the reference implementation.
- **Hard constraint:** Heimdall is a Yarn-workspaces monorepo (`workspaces: ["apps/*", "libs/*", "test"]`) with a Vue 2 frontend. A docs toolchain on Vue 3 must be invisible to the app build. Modifying the root `package.json` workspaces configuration is prohibited (a past `nohoist` change broke the entire frontend build).

### 1.2 Requirements

1. Documentation changes are PR-reviewable and can ship in the same PR as code changes.
2. The Vue 3 docs toolchain and the Vue 2 app are mutually invisible — no shared dependency resolution, no root `package.json` changes.
3. Existing content (wiki pages, repo Markdown, ADRs) migrates rather than being rewritten.
4. Publishing is automatic on merge (no manual copy step to forget).

---

## 2. Decision

Adopt **VitePress**, following the `mitre/vulcan` pattern: a self-contained `docs/` directory inside `mitre/heimdall2` with its own `package.json` and `docs/yarn.lock`, built and deployed to GitHub Pages by a dedicated workflow, publishing the migrated wiki content, repo Markdown, and ADRs. The docs site supersedes the wiki as the canonical documentation channel; the wiki is reduced to pointer stubs.

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

All 24 wiki content pages map into the site; existing repo Markdown is symlinked or included, never duplicated. Migration is move-and-organize: content is **not rewritten** in the migration pass (except the `REGISTRATION_DISABLED` page, owned by ADR-004 Phase 9), and license/notice/attribution files move **verbatim**.

| Site section | Content | Source |
|---|---|---|
| `getting-started/` | Installation, configuration, environment variables, troubleshooting | Wiki: Environment-Variables-Configuration, Troubleshooting, Docker-Bake; repo: `.env-example` narrative |
| `user-guide/` | Using Heimdall, groups/users, attestations, auth methods | Wiki: Group-and-User-Management, Manual-Attestations, Heimdall-Authentication-Methods |
| `deployment/` | Production installs, platform configs, releases | Wiki: Oracle-Linux-Production-Install, MITRE-Heimdall-Lite-and-Demo-Deployment-Configurations, Heimdall-Heroku-Documentation, How-to-create-a-Heimdall2-release |
| `developers/` | Architecture, code style, components, processes, tips | Wiki: Heimdall-Architecture-Information, Developers-Code-Style, Heimdall-Frontend-Components, Heimdall-Class-Diagrams, Heimdall-Processes-Documentation, Heimdall-Development-Tips-&-Tricks, Heimdall-Interface-Connections; repo: `apps/backend/README.md`, `libs/*/README.md` |
| `converters/` | HDF converter docs | Wiki: HDF-Converter-Mappings, HDF-Converters-How-Tos, CCI-Converter |
| `api/` | API documentation | Wiki: Heimdall-API-Documentation (vitepress-openapi rendering of a machine-readable spec is an investigation item, not a commitment) |
| `security/` | Security control responses | Wiki: Heimdall-Server-Security-Control-Responses |
| `decisions/` | Published ADRs | Repo: `docs/adr-004-*`, `docs/adr-005-*` (this file), future ADRs |
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
├── decisions/
│   ├── index.md                # NEW — ADR index, one-line summary each
│   ├── adr-004-external-auth-user-provisioning-policy.md   (moved from docs/ root)
│   └── adr-005-vitepress-documentation-site.md
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
- **Top nav:** Guide · Deploy · Converters · Developers · API · Decisions, plus GitHub link.

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
**Cons:** no navigation/search/landing page for deployers; ADRs and 24+ pages become a flat file listing; no versioned public URL to point the login page's help link at. **Rejected** — solves review but not publication.

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

**Why VitePress:** Node/Vue-native (matches the team), the isolation problem is already solved and proven in-house (`mitre/vulcan` — same Vue 2 app + Vue 3 docs split, config and deploy workflow read directly and reusable nearly verbatim), and it publishes ADRs as first-class pages (Vulcan's `decisions/` section).

---

## 4. Consequences

### 4.1 Positive

- Documentation changes ship in the same reviewed PR as code (ADR-004 Phase 9's wiki row is superseded the moment this lands — the `REGISTRATION_DISABLED` page becomes an in-PR `getting-started/environment-variables.md` edit).
- ADRs get a published, linkable home (`decisions/`).
- The login page's help link points at a reviewed, versioned page instead of a wiki page anyone with write access can alter.
- Publishing is automatic; there is no manual copy step to forget at release time.

### 4.2 Negative / Risks

- One more toolchain to keep current (VitePress/Vue 3 in `docs/`), though Dependabot picks up `docs/package.json` automatically.
- Wiki URLs in the wild break unless the stub-pointer pass is done thoroughly.
- The isolation invariant depends on nobody "helpfully" adding `docs` to the workspaces globs or importing app code into docs — stated as a hard rule here and enforced by the scaffold card's acceptance criteria.
- VitePress 2 is in alpha (Vulcan runs `2.0.0-alpha.11` in production docs); pin the version, upgrade deliberately.

### 4.3 Out of Scope

- Custom domain (GitHub Pages project URL is sufficient to start)
- Rewriting/modernizing page content during migration (move-and-organize only; content rewrites are follow-on work per page)
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

Tracked as epic **`heimdall2-yvx`** on the heimdall2 beads board; each phase below is child card `heimdall2-yvx.<phase>` (e.g. Phase 3 = `heimdall2-yvx.3`), with dependencies mirroring the Depends on column. ADR-004's Phase 9 card (`heimdall2-4qg.9`) soft-references this epic: once the docs site is live, its wiki deliverables become docs-site page edits.

**Board access:** the board is a shared Dolt database published at `refs/dolt/data` in this repository. Install `bd` from [gastownhall/beads](https://github.com/gastownhall/beads), then run `bd dolt pull` from a heimdall2 checkout with an existing beads clone, or `bd bootstrap` on a fresh machine. **Upgrade note (2026-07-10):** the board schema was migrated v49 → v54 — if you have a pre-existing beads clone, run `bd dolt pull` on your *current* bd binary **before** upgrading bd; if you upgraded first and bd refuses to start, `bd bootstrap` re-clones (push any local issues first). The team agent skills used to work these cards (card template, TDD gates, AC verification) live in [mitre/mitre-saf-skills](https://github.com/mitre/mitre-saf-skills).

> **Phase list amended 2026-08-11.** A new **Phase 7** carries the in-app
> deployment (§2.2 target A), which had no phase of its own. Phase 2's hosting
> shape is an open decision (§2.2.1); phase ORDER is not settled here. No
> dependency changes: Phase 6 still waits on Phase 5, which still waits on
> Phase 2 — that is what keeps the public wiki alive until a public site
> replaces it.

| Phase | Scope | Depends on | Estimate |
|---|---|---|---|
| 1 | Scaffold: `docs/` with own package.json/yarn.lock, VitePress config (srcDir `site`, target seam, cleanUrls, lastUpdated, dead-link check), minimal theme, landing page, section skeleton, `.gitignore`/`.dockerignore`/eslint-ignore entries. AC: root install/build byte-identical | — | sp:3 |
| 2 | Deploy: `docs.yml` workflow (`release: published` + `workflow_dispatch`, SHA-pinned, Node from `.nvmrc`, yarn cache on `docs/yarn.lock`), hosting shape per §2.2.1 chosen without clobbering Heimdall Lite, site live | 1 | sp:2 |
| 7 | In-app documentation for offline/airgapped installs: build the `app` target, serve it from NestJS at `/docs/` (static mount ordered ahead of the SPA catch-all), resolve the CSP conflict with VitePress's inline theme scripts, and ship the built output in the RPM and container images | 1 | sp:5 |
| 3 | Content migration: 24 wiki pages into the §2.3 structure, nav/sidebar wired, internal links rewritten, images moved into `docs/public/` | 1 | sp:5 |
| 4 | Repo Markdown + ADRs: symlink root files (README, CODE_OF_CONDUCT, LICENSE verbatim), publish `decisions/` with ADR-004/ADR-005, include `apps/backend` and `libs/*` READMEs | 3 | sp:2 |
| 5 | Product link updates: `LocalLogin.vue` help URL, `.env-example` header, `README.md` wiki references → docs-site URLs | 2, 3 | sp:1 |
| 6 | Wiki decommission: every migrated page reduced to a pointer stub, wiki editing restricted, final content-parity check against the wiki clone | 3, 4, 5 | sp:2 |

---

## 6. References

- `mitre/vulcan` `docs/.vitepress/config.mjs` and `.github/workflows/docs.yml` — reference implementation (read directly 2026-07-09)
- `mitre/heimdall2.wiki.git` — migration source, cloned and audited 2026-07-09 (26 files, 24 content pages)
- ADR-004 §3.4 / §6.2 / Phase 9 — the documentation channel this ADR upgrades
- [VitePress documentation](https://vitepress.dev/)
- Root `package.json` workspaces / `lerna.json` — the isolation constraint (verified this session)
