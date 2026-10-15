# Task 11 report: trust-store rebuild failures (F11)

Status: DONE

## Change

Updated the cumulative RPM CLI patch so `AddCertRunner.Run` checks the exit code and execution error from `update-ca-trust` through the existing `runChecked` helper. On failure it returns `updating system trust store: ...` before printing the success message or changing `NODE_EXTRA_CA_CERTS`. The copied anchor remains available for retry. Added the specified table regression for nonzero exit and command-execution error cases.

The patch commit is `c5c656305` (`fix(rpm): fail certificate installation when trust update fails`). The CLI working checkout remains at pristine pinned HEAD `ea29e299ca0206519dd324c9543c74cba80c1963`; it was not committed or reset.

## TDD evidence

RED command, run from `/tmp/heimdall-rpm-remediation-cli.0cj60l1u/cli`:

```text
PATH=/tmp/heimdall-nginx-go/go/bin:$PATH GOTOOLCHAIN=local GOMODCACHE=/tmp/heimdall-nginx-go-mod GOCACHE=/tmp/heimdall-ponytail-go-cache go test ./internal/cmd -run TestAddCertTrustFailureStopsConfiguration
```

It failed as expected on the reviewed behavior:

```text
--- FAIL: TestAddCertTrustFailureStopsConfiguration (0.00s)
    add_cert_test.go:89:
        Error:       An error is expected but got nil.
FAIL
```

The first table case returns exit code 1 without an execution error; previously that path returned success and updated configuration.

GREEN and connected behavior checks, from the same working checkout with the same environment prefix:

```text
go test ./internal/cmd -run TestAddCert
ok   github.com/mitre/heimdall-cli/internal/cmd 0.686s

go test ./...
ok   github.com/mitre/heimdall-cli/cmd/gen-manpages 0.717s
?    github.com/mitre/heimdall-cli/cmd/heimdall-cli [no test files]
ok   github.com/mitre/heimdall-cli/internal/cmd 23.898s
?    github.com/mitre/heimdall-cli/internal/version [no test files]

go test -tags functional ./internal/cmd
ok   github.com/mitre/heimdall-cli/internal/cmd (cached)
```

Patch validation from `/tmp/heimdall-setup-port-package/heimdall-cli-src`:

```text
git status --short --branch
## HEAD (no branch)
ea29e299ca0206519dd324c9543c74cba80c1963
git apply --check /Users/schaconcai/.codex/worktrees/rpm-audit-remediation/heimdall2/packaging/rpm/heimdall-cli-nginx.patch
```

`git apply --check` exited 0 against the pristine pinned source. The patch was regenerated from the active CLI checkout with `git diff --binary`; that checkout contained the cumulative prior task changes and only the intended Task 11 edit to `add_cert.go` and `add_cert_test.go`. No CLI source commit or reset was performed.

## Files and review

- `packaging/rpm/heimdall-cli-nginx.patch` — cumulative CLI patch, committed as `c5c656305`.
- `.superpowers/sdd/2026-10-15-rpm-branch-audit-remediation/task-11-report.md` — this report.

The implementation uses the existing checked-command helper and adds no abstraction or rollback of system trust bundles. The test covers both required failure modes and verifies that neither the success message nor environment mutation occurs. Existing successful add-cert behavior passes its focused and full package tests. No concerns identified.

