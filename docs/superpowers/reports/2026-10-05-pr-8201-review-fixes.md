# PR #8201 review fixes: implementation and response draft

The October 6 user instruction restores the original `feat/saml-auth` baseline `e1eed0cc2`, retaining the review fixes for [PR #8201](https://github.com/mitre/heimdall2/pull/8201) as uncommitted changes. The master merge and imported upgrades are excluded. Nothing was pushed, posted to GitHub, or published to the wiki.

## Draft PR description

Compile the shared authentication definitions from TypeScript and include their generated output in development, CI and production packaging. Preserve SAML login and the original Tenable string contract while correcting login-tab labels for the enabled providers.

Simplify flat SAML identity lookup, preserve missing-identity rejection, restore the original SAML icon and attribution, document all 48 settings, and provide reproducible Cypress service/certificate setup. Reject unsupported outgoing HTTP-POST authentication requests with a clear configuration error; incoming SAML POST callbacks remain supported. Keep the existing OAuth-or-Tenable session condition: SAML-only application authentication uses JWTs; Tenable still retains credentials for subsequent proxy calls.

## Fixes and direct review links

Each row links directly to its originating comment or review. PR splitting, logical commits, and the master merge are deferred under the user's instructions. Current checks against the restored baseline appear first below; earlier merged-branch checks are labeled historical.

| Review                                                                           | Implemented fix or explicit deferral                                                                                                                                                                                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [R1](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141045445)        | Compiled common into ignored JavaScript/declarations; connected package exports, CI, development, packing and Docker entry points. PR splitting deferred by the user.                                                                                              |
| [R2](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141056351)        | Defined auth constants in TypeScript and removed the source JavaScript bridge and JSON definition.                                                                                                                                                                 |
| [R3](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141191312)        | Restored the original red triangle SVG from 0ef729f86 and its attribution.                                                                                                                                                                                         |
| [R4](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141231281)        | Added test/README.md with local service, database, certificate and authentication instructions; linked it from the root README. Separate PR deferred by the user.                                                                                                  |
| [R5](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141241954)        | Documented OAuth/OIDC, Tenable and SAML session history; preserved the existing OAuth-or-Tenable condition. Prior session checks are recorded below; live session flows were not rerun on the restored baseline.                                                   |
| [R6](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141286173)        | Used a single literal-key lookup so URI/dotted claim names remain intact.                                                                                                                                                                                          |
| [R7](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141288211)        | Used Lodash isString and returned a primitive string, preserving required-identity validation.                                                                                                                                                                     |
| [R8](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141378355)        | Removed speculative helper cases; retained strategy mapping plus missing-identity rejection before provisioning. Added one constructor check for the confirmed unsupported POST-binding setting.                                                                   |
| [R9](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141436616)        | Changed the test provider name to Internal SSO.                                                                                                                                                                                                                    |
| [R10](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141454521)       | Removed duplicate OAuth membership coverage; kept the stronger exact-list separation test.                                                                                                                                                                         |
| [R11](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141468587)       | Moved shared-constant consistency assertions into the common compiled-runtime check.                                                                                                                                                                               |
| [R12](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141511900)       | Documented all 48 settings in .env-example and docs/saml-environment-variables.md, including formats/defaults. Final review identified HTTP-POST as incompatible with CSP: reject it clearly and document Redirect-only support. Wiki publication remains pending. |
| [R13](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141550061)       | Renamed all standard-tab availability getter references.                                                                                                                                                                                                           |
| [R14](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141617871)       | Derived local-only, SSO-only and combined tab labels independently of LDAP; retained the nine-case browser matrix.                                                                                                                                                 |
| [R15](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141622483)       | Shortened the LDAP tab to Organization Login (LDAP).                                                                                                                                                                                                               |
| [R16](https://github.com/mitre/heimdall2/pull/8201#discussion_r4141643146)       | Formatted both tab labels on separate template lines.                                                                                                                                                                                                              |
| [R17](https://github.com/mitre/heimdall2/pull/8201#pullrequestreview-5361958817) | Deferred by the October 6 user instruction; all review fixes remain uncommitted.                                                                                                                                                                                   |
| [R18](https://github.com/mitre/heimdall2/pull/8201#issuecomment-5905879353)      | Deferred by the October 6 user instruction; remove the master merge and imported upgrades, retaining the original Tenable string contract.                                                                                                                         |

## Verification on the restored original baseline

Verified October 6, 2026, with the retained review fixes on `e1eed0cc2` and the original lockfile. The existing Lerna 9 build supports common compilation; dependency upgrades are unnecessary.

| Check                            | Result                                                                                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Original dependencies            | `CYPRESS_INSTALL_BINARY=0 yarn install --frozen-lockfile --network-timeout 600000` passed. Installed Lerna 9.0.7, TypeScript 6.0.3 and Cypress 15.18.0; common remains version 2.13.0. |
| Clean common build/runtime check | Removed only ignored common output, then `yarn common build && yarn common test:ci` passed.                                                                                            |
| Complete workspace build         | `yarn build` passed for all five projects using Lerna 9. Generated changes to two checked-in HDF assets were removed from the review diff afterward.                                   |
| Focused backend tests            | Configuration and SAML strategy tests passed: 15 tests in two files.                                                                                                                   |
| Complete frontend unit suite     | Passed: 28 tests in six files.                                                                                                                                                         |
| Scoped lint                      | Passed for the common barrel/runtime check, SAML test, Cypress tab test and four revised review/setup documents.                                                                       |

The final audit confirmed the branch remains `feat/saml-auth` at `e1eed0cc2` with an empty index. All eight package manifests retain their original version and dependency fields; `VERSION`, `lerna.json` and `yarn.lock` match exactly. All 85 imported paths match baseline except four intentional review-fix overlaps. All 24 protected user files retain their saved content and modes. All 18 direct review links remain in each review document, all 48 SAML names match both environment documentation files, and `git diff --check` passed.

Browser integration, live session flows, isolated application installations and Docker image builds were not repeated on this restored baseline. Earlier results and environment limitations remain historical below.

## Historical verification on the merged branch

These results were recorded before removal of master merge `a135e177e` and the subsequent local commits through `1e5ea4b2b`. They do not establish that the restored original-version working tree passes.

| Check                              | Result                                                                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compiled common check              | Passed; public import resolves generated `lib/interfaces/index.js`, including SAML. The check failed against the former source bridge before implementation.                                    |
| Complete workspace build           | Passed, with common built before both applications. Final frontend/backend builds also passed after their changes.                                                                              |
| Backend without frontend present   | Locked install, common/backend builds and migrations passed in a temporary copy. All 221 tests in 15 files passed against a separate test database.                                             |
| Final configuration/SAML follow-up | All 15 tests passed after the POST-binding guard; backend build and real Passport Redirect initiation passed. Signed SAML-only browser login passed again on the earlier commit `bbcdc7df4`.    |
| Frontend without backend present   | Locked install, common/frontend builds and all 33 tests passed in a temporary copy.                                                                                                             |
| Login tab matrix                   | All nine Cypress cases passed with zero retries, including SAML-only, LDAP-only and no providers. Existing scroll arrows were inspected at 375px.                                               |
| Existing login suite               | Seven cases passed: local, GitHub, OIDC, SAML, invalid local credentials, unverified OIDC email and logout. Two LDAP cases failed because the required image is blocked by organization policy. |
| Final SAML-only smoke              | Signed MockSAML login passed; visible button and mapped email/given/family names verified. Startup enabled only SAML, Tenable was empty, and no Express `connect.sid` cookie was created.       |
| Tenable session smoke              | Login and a following proxy request passed with OAuth disabled; omitting the session cookie returned 401. Used the repository's OpenAPI response examples through a temporary Node HTTP mock.   |
| SAML documentation                 | Exact parity for all 48 names; defaults/formats checked against installed Node-SAML 5.1.0.                                                                                                      |
| Local setup documentation          | Fifteen shell blocks parsed; environment overrides, SAML-only settings, certificate encodings and links verified.                                                                               |
| Focused lint                       | New common runtime test/barrel, SAML test and Cypress tab test passed. Existing lint debt remains in previously modified Vue/TypeScript/README files; no new scoped findings were introduced.   |
| Docker server and Lite images      | Unverified: both stop at the unchanged Yarn repository download with curl TLS error 60, before application compilation. No certificate verification was disabled.                               |
| Diff hygiene                       | `git diff --check` passed; generated common output remains untracked/ignored.                                                                                                                   |

Browser tests used the dedicated database `heimdall_pr8201_e2e_20261005`, backend port 3003 and the existing MockSAML on 4000. Ports 3000–3002 were already occupied. Backend-only tests used `heimdall_pr8201_backend_20261005`. Existing user services and files were preserved.

## Session explanation for the reviewer

[PR #2094](https://github.com/mitre/heimdall2/pull/2094) restricted sessions to OAuth, [PR #7032](https://github.com/mitre/heimdall2/pull/7032) added session-backed Tenable credentials, and [PR #6820](https://github.com/mitre/heimdall2/pull/6820) restored Passport session middleware for OIDC state. Local/LDAP/SAML application authentication uses JWTs; Node-SAML maintains its own request-ID cache. The OAuth-or-Tenable condition therefore remains unchanged.

## Remaining checks and publication status

- Keep all work uncommitted and local under the October 6 instruction.
- Publish the prepared wiki content when the PR is mergeable and publication is authorized. Reviewer replies remain drafts.
- Re-run LDAP integration and both Docker builds in an environment permitting the LDAP image and trusting the Yarn repository certificate chain.
- Existing lint findings are baseline debt; this work did not claim a clean repository-wide lint run.

## Historical review record

The earlier merged-branch task reviews passed. Its final review identified the HTTP-POST/CSP conflict; the retained guard rejects that unsupported setting without weakening the global security policy. The previous merge and implementation commits are superseded by the October 6 instruction to keep the fixes uncommitted on the original baseline.

The earlier verification run cleaned up its temporary test servers, generated environments and dedicated databases while preserving user services and files. The October 6 verification results are recorded separately above.
