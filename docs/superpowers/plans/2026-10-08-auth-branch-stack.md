# Authentication Branch Stack Implementation Plan

> Execute the three dependent layers in order; use independent agents for boundary checks and final review.

**Goal:** Split PR #8201 into the reviewer's three layers, based on current `master`, while preserving `feat/saml-auth` unchanged.

**Architecture:** `origin/master` → `feat/auth-icons` → `feat/auth-common` → `feat/saml-auth-stack`. Each branch adds only its layer and each future PR targets the preceding branch.

**Tech Stack:** Git, Yarn Classic workspaces, TypeScript, NestJS, Vue, Vitest, Cypress.

**Spec:** https://github.com/mitre/heimdall2/pull/8201#discussion_r4141045445 and the user's October 8 instructions in this chat.

## Constraints and baseline

- Base: freshly fetched `origin/master`, `85ec9396424d2a2ab40dd84f28d14e9162ce33e8`.
- Source: `feat/saml-auth`, `c43686b516bf752bde25e7e6a119a3c484609441`.
- Preserve the source ref, its remote, its checkout, and existing untracked files.
- Work in `/Users/schaconcai/.codex/worktrees/auth-stack/heimdall2`.
- Use `feat/` names. The user selected `feat/saml-auth-stack` because `feat/saml-auth` must remain unchanged.
- No SAML assets, dependencies, configuration, constants, or tests in the first two layers.
- Preserve current master package versions, dependency upgrades, Tenable URL arrays, and existing CI services. Port changes rather than replacing master files wholesale.
- Commit local branches; do not push, create PRs, retarget, or close #8201 in this task.

## Layer 1: Icons

- [x] Add the source's five SVGs (`github`, `gitlab`, `google`, `okta`, `openid`) under `apps/frontend/src/assets/`; delete only their five matching `_mark.png` files.
- [x] Replace only the corresponding five asset requires in `apps/frontend/src/components/global/login/LocalLogin.vue`.
- [x] Include SVG attribution from `apps/backend/README.md`; preserve both GitHub banner images referenced by the root README.
- [x] Verify all image references resolve, no SAML is introduced, and frontend compilation passes. Commit as `refactor: use SVG authentication provider icons` on `feat/auth-icons`.

## Layer 2: Authentication and compiled common package

- [x] Branch `feat/auth-common` from the icons commit.
- [x] Port the common TypeScript constants/types, exports, compilation configuration, and runtime assertion test. Exclude `SAML` and SAML-specific assertions.
- [x] Port general authentication changes in ConfigService and its tests, StartupSettingsDto, AuthnService, CreateUserDto, common startup/user interfaces, RegistrationModal, UserModal, LocalLogin, Login, and the server store. Remove all SAML-specific properties, branches, and test cases from this layer.
- [x] Preserve `tenableHostUrl: string[]` throughout current master's contracts and `[]` in the store.
- [x] Port common build ordering in package scripts, Dockerfiles, ignore files, relevant build/test/publish workflows, ESLint configuration, and development documentation. Check direct frontend build entry points so compiled common is available.
- [x] Verify common runtime assertions, auth configuration tests, backend build, frontend build, and the absence of SAML in the incremental diff. Commit as `refactor: compile common authentication definitions`.

## Layer 3: SAML

- [x] Created `feat/saml-auth-stack` from the auth/common commit.
- [x] Add source SAML strategy and tests, controller routes and module registration, common constant and runtime assertions, provider enablement and configuration tests, `samlName` across startup contracts/store, login button and SVG, backend environment documentation and CI environment settings, MockSAML workflow service, and Cypress login support/tests.
- [x] Add only the SAML dependency and its required lockfile entries on top of current master's lockfile. Preserve existing dependencies and CI services.
- [x] Verify common runtime assertions, ConfigService and SAML strategy tests, backend and frontend builds. Run available frontend tests and report any environment-limited checks accurately.
- [x] Review the incremental diffs and compare the resulting full feature against the original source while allowing only current-master changes and necessary integration fixes.
- [x] Commit as `feat: add SAML authentication`; verify ancestry and that the source branch and original checkout are unchanged.

## Delivery

- [x] Report branch names, base relationships, commit IDs, validation, worktree path, and checks not run.
- [x] Document that repository workflows filtered to pull requests targeting `master` may need stack-base coverage before the upper PRs can receive equivalent CI checks. Do not change external PR settings here.

## Verification record

- Icons: `yarn frontend build` passed on Node 24.15.0, with existing webpack size warnings. Icon reference assertions and independent scope review passed.
- Baseline: `yarn backend test:ci src/config/config.service.spec.ts` passed (10 tests).
- Auth/common: common build/runtime assertions, backend build, 11 ConfigService tests, 33 frontend tests (7 files), and direct frontend production build passed. Independent caller/build/scope review passed.
- Current-master preservation: all 3,402 lockfile selectors retained identical resolutions in the prepared SAML layer; Tenable arrays and pre-existing CI services checked.
- SAML: frozen-lockfile installation, common build/runtime assertions, backend build, and 15 tests across ConfigService/SAML strategy passed. Frontend production build and final independent review also passed.

## Completed stack

| Branch | Parent/base | Commit |
| --- | --- | --- |
| `feat/auth-icons` | `origin/master` (`85ec93964`) | `a7c19563b` |
| `feat/auth-common` | `feat/auth-icons` | `e061efb90` |
| `feat/saml-auth-stack` | `feat/auth-common` | `462d78ea3` |

The final worktree is clean and remains checked out on `feat/saml-auth-stack`. Ancestry assertions confirm exactly three linear commits above the fetched master. The original checkout remains on `feat/saml-auth` at `c43686b51`, with no tracked changes. No push, PR creation, or PR modification was performed.

All frontend production builds passed with existing webpack size warnings. Authentication/common and SAML backend builds and shared runtime assertions passed. Frontend tests ran on the auth layer (33 tests across 7 files); the final SAML/configuration tests passed (15 tests across 2 files). Node 24.15.0 was used because Homebrew's named Node 22/24 paths resolved to Node 26, which an existing dependency rejects.

Independent final review and a content/ancestry assertion check confirmed the full 54-file extraction. The original PR's 55th file was an OIDC newline-only change, intentionally omitted. Current master dependency resolutions and Tenable/CI changes are preserved. The original backend README bullet formatting was not copied, and frontend prebuild compiles common for direct builds.

Not run: service-backed Cypress/login E2E, database-backed full backend suite, Docker image builds, or remote CI/Netlify checks. Existing PR workflow filters target `master`; upper stack PRs need corresponding CI coverage when published.
