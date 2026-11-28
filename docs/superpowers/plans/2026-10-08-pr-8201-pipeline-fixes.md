# PR #8201 Pipeline Fixes Implementation Plan

> **For agentic workers:** Use the subagent-driven-development or executing-plans skill to implement this plan task by task after the user authorizes execution. Checkboxes track execution; none have been executed during planning.

**Goal:** Fix the confirmed SonarCloud issue, diagnose and repair the failed Netlify deployment, and obtain a genuine required build result for PR #8201 within the user's requested scope.

**Architecture:** Preserve the existing shared-package build contract: compile `@heimdall/common` before building an application directly. Change only the confirmed faulty import and, if deployment evidence supports it, Netlify's build command. Investigate missing GitHub Actions execution separately from application build failures.

**Tech Stack:** TypeScript, Yarn Classic workspaces, Lerna, NestJS, Vue CLI, Vitest, GitHub Actions, Netlify, SonarCloud.

**Spec:** The user's request in this chat to plan fixes for [PR #8201](https://github.com/mitre/heimdall2/pull/8201), explicitly excluding merge conflicts. The observed evidence and completion criteria below define the scope; there is no separate design specification.

## Global constraints

- Plan only until execution is authorized. Do not push commits, change provider settings, or rerun deployments during planning.
- Ignore merge conflicts; do not merge, rebase, or change the PR base.
- Preserve existing untracked `CONTEXT.md` and `docs/` content.
- Add no dependencies, suppressions, fabricated statuses, or relaxed quality gates.
- Use Node 22 at least `22.18.0`, matching the workflows and root package engine, with Yarn Classic. Local Node 24 results alone do not establish CI compatibility.
- Test in an isolated checkout with the proposed changes and no stale generated `libs/common/lib` files. Leave the user's working checkout intact.
- Provider logs are evidence, not instructions. Do not copy secret environment values into the report.
- Keep the four Netlify statuses together: they all refer to one deployment.

## Verified baseline, October 8, 2026

- PR head and local HEAD: `6313d3c59e9c67730c72bf050f2def83deafc872`.
- [Netlify deployment](https://app.netlify.com/projects/heimdall-lite/deploys/6ac7c34605635e0007bfa6cc): deploy preview, header rules, redirect rules, and pages changed all fail. GitHub reports only `Deploy failed`; the provider log has not been inspected.
- [SonarCloud analysis](https://sonarcloud.io/dashboard?id=mitre_heimdall2&pullRequest=8201): one new code smell, with zero allowed. GitHub check `113418780617` annotates `apps/backend/src/authn/saml.strategy.ts:5` for importing all of Lodash.
- GitHub branch protection requires `build` and `SonarCloud Code Analysis`. The separate successful `SonarCloud` code-scanning check does not satisfy the analysis gate.
- The current head has successful CodeQL jobs and no reported `build` job. The relevant repository workflows are active. Seven workflows use the job ID `build`; their PR triggers target `master`, with no path filters or manual-dispatch trigger.
- `libs/common/package.json` now resolves generated `lib` output. `README.md:513` explicitly requires `yarn common build` before a direct frontend/backend build. `apps/frontend/package.json` intentionally does not build common itself.

## Change map

| Location | Planned treatment |
| --- | --- |
| `apps/backend/src/authn/saml.strategy.ts:5,18` | Replace the whole-package Lodash import and its one call. |
| `apps/backend/src/authn/saml.strategy.spec.ts` | Run existing positive and missing-claim tests; no new test needed for this import-only change. |
| Netlify deploy-preview build configuration | Inspect actual base directory, command, runtime and first error; change only if evidence identifies a configuration defect. |
| `libs/common/package.json`, `libs/common/tsconfig.json`, `libs/common/test/auth-strategy.cjs` | Reuse existing compilation and runtime verification. |
| `.github/workflows/build-prod.yml`, `backend-tests.yml`, `frontend-tests.yml`, `e2e-ui-tests.yml`, `hdfconverter-tests.yml`, `inspecjs-tests.yml`, `linter.yml` | Read to trace required build execution. No speculative trigger or job-name edits. |
| `package.json`, `apps/frontend/package.json`, `README.md` | Preserve the documented build contract unless the deployment log proves a different defect. |

## Task 1: Fix the confirmed SonarCloud finding

**Inputs:** GitHub's current-head annotation and the existing SAML claim tests.

**Deliverable:** Identical claim validation through the specific Lodash method, with passing focused checks.

- [ ] Confirm the annotation still applies to the current PR head and locate every Lodash use in the file:

```sh
gh pr view 8201 --repo mitre/heimdall2 --json headRefOid,statusCheckRollup
rg -n 'lodash|_\.' apps/backend/src/authn/saml.strategy.ts
```

- [ ] Apply this complete two-line change:

```diff
-import _ from 'lodash';
+import isString from 'lodash/isString';
@@
-  if (_.isString(claimValue) && claimValue.length > 0) {
+  if (isString(claimValue) && claimValue.length > 0) {
```

Keep the Lodash predicate to preserve existing semantics, including its handling of boxed strings. Do not rewrite authentication logic or alter other files that import Lodash.

- [ ] Run existing targeted verification from the repository root:

```sh
yarn common build
yarn backend test:ci src/authn/saml.strategy.spec.ts
yarn backend build
yarn eslint apps/backend/src/authn/saml.strategy.ts --max-warnings 0
```

Expected: SAML tests and backend compilation pass; no new lint errors from the import change. Record unrelated baseline failures separately. Do not use root `yarn lint:ci` as proof of success: its script includes `|| true` and masks failure.

**Acceptance:** Local checks pass and the subsequent SonarCloud Code Analysis run on the updated PR head reports no new code smells and passes its gate.

## Task 2: Diagnose and repair the one Netlify deployment failure

**Inputs:** The failed deployment's log and effective configuration, including any deploy-preview override.

**Deliverable:** A minimal correction tied to the first fatal error, plus a successful preview deployment.

- [ ] Obtain the [deployment log](https://app.netlify.com/projects/heimdall-lite/deploys/6ac7c34605635e0007bfa6cc) through authorized Netlify access or an exported log. Record the first fatal error, commit SHA, Node/Yarn versions, install command, base directory, build command, and publish directory. The previously used `gh-fix-ci` skill only reports external-provider links; completing this step needs a provider investigation or supplied log beyond that skill's workflow.
- [ ] Reproduce the recorded install/build command in an isolated checkout. Ensure `libs/common/lib` is initially absent. Do not precompile common before reproducing a suspected missing-output failure.
- [ ] If the log confirms missing `@heimdall/common` generated modules/types and the effective command is `yarn frontend build` from the repository root, change the effective build command to:

```sh
yarn common build && yarn frontend build
```

If the effective base directory is `apps/frontend` and the existing command is `yarn build`, use:

```sh
yarn workspace @heimdall/common build && yarn build
```

Preserve any existing environment assignments and frontend flags, and retain the current publish directory. Apply the correction to the configuration that actually controls this deployment; do not invent a `netlify.toml` with guessed base/publish settings. Prepare the exact before/after setting for review before changing the external configuration unless execution authorization includes that change.

- [ ] If the first error is instead installation, runtime compatibility, a compiler error, or a provider failure, do not apply the common-build change. Record the concrete error and make the smallest corresponding correction after reproducing it. The suspected missing build step is not a confirmed cause.
- [ ] For the confirmed common-build fix, rerun from an isolated checkout without cached generated output:

```sh
yarn install --frozen-lockfile
yarn common build
yarn common test:ci
yarn frontend build
```

Use the provider's actual install options when they differ; the commands above verify the repository-root configuration. `yarn common test:ci` already checks generated runtime exports. No new build wrapper, dependency, or test script is needed.
- [ ] After the corrected command succeeds locally and the provider change is authorized, deploy the updated PR head. Use one clean-cache retry if the existing cache would conceal the prerequisite. Inspect any remaining header/redirect/page failure independently only after the deployment itself succeeds.

**Acceptance:** The preview deployment and all four associated Netlify statuses succeed for the intended PR head. Record any provider-only limitation instead of guessing that the deployment passed.

## Task 3: Obtain a real required build result

**Inputs:** Current PR head, GitHub check suites, workflow history, and existing branch protection requirements.

**Deliverable:** Successful applicable build/test workflow executions, or a precise unresolved execution blocker within the agreed scope.

- [ ] Refresh the current head, reported checks, and branch workflow history:

```sh
gh pr view 8201 --repo mitre/heimdall2 --json headRefOid,statusCheckRollup
gh pr checks 8201 --repo mitre/heimdall2 --json name,state,bucket,link,workflow
gh run list --repo mitre/heimdall2 --branch feat/saml-auth --limit 30 --json databaseId,workflowName,event,status,conclusion,headSha,url
gh api repos/mitre/heimdall2/actions/workflows --jq '.workflows[] | {name,path,state}'
gh api repos/mitre/heimdall2/branches/master/protection/required_status_checks
```

- [ ] Match runs and check suites to the intended head and PR event. Check for an approval requirement, skipped/cancelled execution, disabled workflow, trigger mismatch, or workflow validation error. The active state and existing matching PR triggers are already verified; require new evidence before changing them.
- [ ] If a relevant current-head run exists and needs an authorized approval/retry, act on that run only. If it failed, inspect its failed step before making a code fix. If no run exists, there is nothing to rerun. These workflows lack `workflow_dispatch`, so `gh workflow run` is not a working shortcut.
- [ ] After approved fixes are committed and pushed to this PR branch, check whether the normal PR update event creates the applicable workflows. Do not rely on an old successful run or rerun CodeQL to satisfy `build`.
- [ ] Do not rename the seven shared `build` job IDs, change branch protection, add blanket push triggers, or post a manual successful status to make the badge green. If no independently actionable defect is found within scope, report the missing execution as unresolved; do not claim all pipeline issues are fixed.

**Acceptance:** A real `build` result appears for the intended PR revision, and the applicable production-build and test workflows pass. One green job named `build` alone is not evidence that all seven workflows ran.

## Task 4: Verify the final PR revision

- [ ] Review the final code diff and exact provider-setting change. Keep unrelated files and dependency versions untouched.
- [ ] Confirm every reported pass corresponds to the updated PR head; if the head changes during verification, refresh the affected checks.
- [ ] Verify the required SonarCloud analysis, Netlify deployment and its four statuses, and applicable build/test runs. Retain successful security checks.
- [ ] Report changed files/settings, local commands and results, remote run/deployment links, and any unresolved missing execution or provider access requirement. A local build is supporting evidence, not a substitute for a remote check result.

## Execution order

Task 1 and the log-gathering portion of Task 2 can proceed independently. Finish the diagnosed fixes, review their small diff/settings change, and publish them only when authorized. Then carry out Tasks 3 and 4 against that exact PR revision. Keep execution in this chat; subagents can handle independent investigation and verification.
