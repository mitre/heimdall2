# PR Plan — FIPS + RPM + VitePress docs + lint + backend security

**Status:** active
**Branch:** `feature/fips-compliant-password-hashing`
**Worktree:** `heimdall2-fips`
**Charter card:** `heimdall2-zv9y` · **Label:** `pr:fips-foundation` (32 cards)
**Written:** 2026-08-14

---

## 1. What this PR is

One branch, one pull request, five workstreams — deliberately bundled:

| # | Workstream | Epic | State |
|---|---|---|---|
| 1 | FIPS password hashing (ADR-006) | `heimdall2-e25` | 24/34 closed — **71%** |
| 2 | RPM / packaging | inside `e25` | `.26` `.32` closed; `.27` `.28` `.33` open — **~40%** |
| 3 | VitePress documentation (ADR-005) | `heimdall2-yvx` | 5/17 closed — **29%** |
| 4 | Repo-wide ESLint cleanup | `heimdall2-4qm` | complete by its own subject |
| 5 | Backend security + contract detectability (ADR-008, ADR-009) | `heimdall2-86f6` + `heimdall2-sked` | 4/13 and 2/3 closed — added 2026-08-15 |

Forked from master at `2e1649c9e` (2026-06-23). Linear history, zero merge commits.
165 commits unpushed. **Push only on Aaron's word.**

### Why the lint work is here

FIPS was ~70% done and the docs platform largely built, so the foundation was cleaned inside the
same PR rather than deferred. Recorded three times:

- bd memory `lint-first-foundation` — "Lint-first … Clean foundation first. **User decision 2026-06-17.**"
- Aaron, 2026-08-13 — *"keep the lint-config repair ON THE BRANCH but make CI lint non-blocking so
  the FIPS/docs PR isn't failed."* The escape was later removed in `1e57fee7d` once the repo hit
  zero, so CI lint is now **blocking**.
- Aaron, 2026-08-13 20:09 — agreeing the order: after 4qm → vf4 → yvx.17 + docs → `yarn format` → push.

### Why the security work is here — added 2026-08-15, and it is in scope for review

This stream was not in the original four. It exists *because of* this PR's own lint work, and it
splits into two halves a reviewer should judge by different standards.

**Self-inflicted on this branch, and fixed here.** Two ESLint autofixes changed runtime behaviour:

- `3bdd1f146` alphabetized `GroupsController` members, so `@Get(':id')` was declared before
  `@Get('/my')` and swallowed it — GUI login broke for every user. Decorator order is semantic in
  NestJS and no linter can see it.
- `14c13a0e9` turned a fire-and-forget call into an awaited chain, coupling login to unrelated
  application data. ADR-008 records the decision that came out of it.

Neither commit is an ancestor of `origin/master` — both are branch-local, introduced here and
fixed here. Check with `git merge-base --is-ancestor <sha> origin/master`, which fails for both.

**Pre-existing on master, found by the audit those breaks triggered.** Asking what else that class
of invisible contract could hide produced epic `heimdall2-86f6`, and the audit found the Tenable
proxy defects. These are not this branch's doing and they are live on master today:

```bash
git show origin/master:apps/backend/src/tenable/tenable.controller.ts
# @Controller('api/tenable') with NO @UseGuards, and no maxRedirects on either call site
```

They shipped in `a23b7dbef` "Tenable Interface Refactor (#7032)".

**The Tenable chain** is the largest security change in the PR. `POST /api/tenable/login` took a
caller-supplied `host_url`, fetched it, and returned the upstream response to the caller. Three
independent controls, one card each, none sufficient alone:

- `86f6.5` closed — authentication guard; the endpoint was reachable unauthenticated
- `86f6.6` closed — name allowlist; any authenticated user could aim it at any host
- `86f6.12` closed — no redirect following; an allowlisted host could `302` the request away
- `86f6.13` **open** — resolved-address check; a permitted name can still resolve into blocked
  address space (DNS rebinding)

ADR-009 records the design. **The SSRF is not fully closed until `86f6.13` lands** — do not read
the closed cards as "SSRF fixed"; each card and the module header say so explicitly.

Also in this stream: `heimdall2-sked` seeds stable dev/test users behind a production guard
(`3a09a5894`, `c7532b7c5`), which is what makes the live-test evidence on these cards reproducible.

Every card in this stream carries live-test evidence and a mutation run in its notes, because the
defects are all of the form "a green unit suite cannot see this".

### The rule

**This PR's purpose is recorded here and on `heimdall2-zv9y`. Do not re-derive it from git-log
statistics, file counts, or commit-message prefixes. Do not propose splitting or re-scoping the
branch.**

On 2026-08-14 an agent counted commit-message keywords, concluded the lint commits were
"contaminating" a supposedly-clean FIPS branch, wrote that into all three recovery files as
established fact, and proposed branch surgery. It was fabricated — the decision was in bd memory
and in the session transcripts the whole time. It cost an entire evening and nearly cost 150
commits of sound work.

---

## 2. Current verified state (HEAD `197e3dcc9`)

- `yarn lint:ci` — **exit 0** across 709 files, 58,124 → 0. Re-verified 2026-08-14 in 89.61 s.
- backend — tsc 0, **370/370** (30 files), against the test DB on `127.0.0.1:5433`
- frontend — vue-cli **build 0** (the only frontend typecheck), **51/51** (12 files)
- inspecjs — build 0, 6/6
- hdf-converters — tsc 0, build 0, **163 passed / 167**
- generated-artifact guard clean; `yarn.lock` delta zero

The 4 hdf failures are environmental, not regressions: 1 × `splunk_reverse_mapper` (the
long-standing CI-container-only miss) and 3 × `sonarqube_mapper` failing with
`ECONNREFUSED 127.0.0.1:3001` — that mock is started externally, is not defined in this repo, and
is currently down. It must be on IPv4; the spec hardcodes the v4 literal.

---

## 3. Execution order (wired into the board)

```
heimdall2-4qm  ── AC-verify round 3 (gate heimdall2-x4uo) → close
   │
   └─ heimdall2-fhtn  Prettier reformat, ~576 files, isolated commit + blame-ignore
        ├─ vf4, kxi                            the two bug cards unblocked by 4qm
        ├─ e25.18, e25.22, e25.24              FIPS code
        └─ e25.27, yvx.4, yvx.10–.15, yvx.17   prose (Prettier formats markdown too)

e25.5 (heimdall-cli, cross-repo) ─→ e25.22 ─→ e25.29 (load test)
                                        └───→ e25.27 ─→ e25.28 (COPR) ─→ yvx.16
                                                                       └─→ 7qe8
e25.24 ─→ e25.25 (admin Migration tab)
yvx.2 + yvx.4 ─→ yvx.5 ─→ yvx.6 (wiki decommission)
```

**Why `yarn format` moved earlier.** Aaron's 2026-08-13 order put it after `yvx.17`. Revised
2026-08-14: the only argument for deferring was cross-branch conflict, and no other branch is
being worked. Running it before the remaining code and prose cards avoids writing files that the
reformat then rewrites — which would mean reviewing the same lines twice.

**Dependencies that existed only in prose until 2026-08-14.** `e25.22`'s description says *"which
is why the CLI card BLOCKS this one"* but the board carried no dependency at all; `.27`, `.28` and
`.29` had none either. Now wired.

**bd forbids a task depending on an epic.** `yvx.16` ("correct the FIPS posture — AFTER the FIPS
release ships") and `7qe8` are therefore wired to `e25.28`, the COPR distribution card, as the
concrete stand-in for "the release shipped."

---

## 4. Effort remaining

| Stream | Cards | Estimate |
|---|---|---|
| lint close-out (`.62` `.63` `.64` + AC-verify) | 3 | 70 m |
| format + the two unblocked bug cards | 3 | 75 m |
| FIPS + RPM | 8 | 136 m |
| docs | 12 | 219 m |
| cross-repo tracking (`e25.5`, `e25.33`) | 2 | 25 m — not our throughput |
| **total** | **28** | **~8.8 h Claude-pace** |

The FIPS **hashing implementation is done**. What remains in `e25` is migration and admin tooling
(`.22` `.24` `.25`), config (`.18`), a runtime-dependency audit (`.3`), the deployment doc (`.27`),
COPR release (`.28`) and a load test (`.29`) — not cryptography.

**The load test needs no provisioning work.** `packaging/test-infra/fips-ec2/` already holds
Terraform (`main.tf`, `variables.tf`, `outputs.tf`, `user-data.yaml.tftpl`), an applied
`terraform.tfstate`, a `bin/fips-box` launcher and `spike/bench.js`. Benchmarks were already taken:
594 ms p50 at 600k iterations on t3.medium.

Docs prose was recalibrated 2026-08-14 (304 m → 219 m; minutes only, `sp:` unchanged since it is
relative complexity). The original numbers came from a code-card calibration table and treated
markdown authoring like multi-file code work. Note that a large share of what remains is not
writing but per-card machinery — full suites, the VitePress build, markdown lint and an AC-verify
pass, which cost the same whether the card is a migration or a paragraph.

---

## 5. Known items that are NOT blockers

**The ten parked cards.** `heimdall2-4qm` has ten children that are hdf-converters work, not lint:
`.3 .4 .5 .7 .8 .44 .52 .53 .54` and `.6` — `DEFAULT_PROFILE_FIELDS`, the regen tool, `BaseResults`.
Their code lives on `feature/attestation-comment-engine`. Under the PR-split plan PR1 was
"foundation = lint + DRY", so they were filed here; the DRY half was then written on the
attestation branch. That branch is dormant until this PR merges and a release ships. Re-parenting
them is a decision for later.

**Three lint children are verified and waiting on one batched review.** Aaron approved batching for
evidence-only closes (per-card review whenever new code is written):

- `.62` — 6/6 ACs. `lint:ci` proven to exit non-zero on a real rule violation and zero when clean.
- `.63` — 9/10. AC6 superseded by Aaron's 2026-08-13 ruling disabling `unicorn/consistent-boolean-name`.
- `.64` — 7/8. AC4's premise was factually wrong: the rule flags **DTO parameter names**, never
  method names — 15 violations measured, all parameters, per NestJS convention.

**Six repo-wide git stashes** — inventory and triage plan on `heimdall2-nq8`. `refs/stash` is a
repository-level ref, so all four worktrees see one shared stack. Four of the six hold work that
never landed on any branch. Do not `git stash clear`; do not address them by index.

**The attestation rebase** — `heimdall2-7qe8`. The two branches rewrote 331 of the same files. The
resolution rule: keep attestation's **content** and re-derive the lint layer by running the tools,
because lint regenerates and feature work does not.

---

## 6. Likely next direction after this PR (or the one after)

**pnpm + Vitest + Playwright**, retiring Cypress and Yarn 1.

The Playwright migration is **already largely done and is not in this repo's history** — it lives
in a separate clone:

```
/Users/alippold/github/mitre/heimdall-clean
  branch feature/vue3-nuxtui-migration
  969cf2db  2025-10-15  ci: modernize GitHub Actions for pnpm + Vitest + Playwright
  test/playwright.config.ts
  test/e2e/{login,registration,groups,results,database-results,splunk}.spec.ts   399 lines
  test/fixtures/  + test/support/                                                37 files
```

All six Cypress specs are ported, using proper Playwright structure — page objects injected as
test fixtures (`test('...', async ({page, loginPageVerifier, toastVerifier}) => ...)`). **The
selectors are app-agnostic** (`input[name=email]`, `#login_button`), not Nuxt UI internals, so they
should work against the current Vue 2 app despite living on a Vue 3 branch.

Three things to know before reusing it:

- **One real gap:** `cy.register` was never ported. `login.spec.ts` carries
  `// TODO: Implement register via API call` with `page.FIXME_register(...)` commented out, so
  `beforeEach` does not create the user and every spec needing a registered user fails as-is.
- It is a **pnpm** branch — that commit does pnpm, Vitest and Playwright together, so the config
  and workflow need translating if this repo is still on Yarn 1 at the time.
- It is ~10 months old and predates everything in this PR.

Rough size once ported: **1–2 hours**, plus the usual unknown debugging tail of getting e2e green
against a live stack. Retiring Cypress also removes four dependencies and both Cypress carve-outs
from `eslint.config.mjs`. Related open card: `heimdall2-30c.4` (decide package manager — Yarn 1 is
end-of-life).

## 7. Method notes worth keeping

- **A lint exit code of zero does not mean the code was fixed.** It can mean the rule was disabled.
  Check the *effective* config with `eslint --print-config <file>`, not by grepping
  `eslint.config.mjs` — a grep shows scoped `off` blocks that may not apply to the file in question.
  That distinction changed the verdict on `.63`.
- **To test whether a rule's AC was really satisfied, force the rule back on** — `eslint --rule` —
  and read what it actually flags. That is how `.64`'s AC was found to be false in its premise.
- **`bd show`'s rendered output re-wraps lines.** Extract raw text with `bd show <id> --json` before
  writing any anchored edit, and assert the anchor matched before writing.
- **Never route card text through a shell string.** Backticks inside a double-quoted argument are
  command substitution — on 2026-08-14 that accidentally executed `npx jest`. Write to a file and
  pass it, or run scripts from a file.
