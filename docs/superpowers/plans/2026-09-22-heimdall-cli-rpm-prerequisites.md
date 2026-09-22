# Heimdall CLI RPM Prerequisites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a tested, immutable CLI revision that generates its RPM man pages and preserves configuration while running the combined RPM's setup workflow.

**Architecture:** Make narrow changes in the separate `mitre/heimdall-cli` repository. Keep its existing Cobra command tree, injected runner interfaces, native PostgreSQL setup, and TLS integration. Export the tested commit to the Heimdall RPM plan as a dependency pin.

**Tech Stack:** Go 1.25.8, Cobra 1.10.2, existing Go test fakes, Bash, systemd.

**Spec:** `docs/superpowers/specs/2026-09-22-rpm-branch-integration-design.md` in the Heimdall repository; read it with this plan.

## Global Constraints

- Preserve the target branch's application and FIPS behavior; do not redesign, remove, or port cryptographic code in this milestone.
- Do not change logger setup, logger imports, logger formatters, log levels, transports, or existing log messages.
- Preserve the current checkout, existing local documents, and both source branches; implementation uses isolated worktrees.
- Keep `dnf install` noninteractive and free of database/configuration bootstrap; run setup explicitly through `heimdall-cli setup`.
- Keep PostgreSQL optional for remote deployments; use PGDG PostgreSQL 18 for the required local OL8 acceptance fixture.
- Require Node.js engine `>=22.18.0`, build with Node 22 and Yarn Classic `1.22.22`, and retain frozen dependency installation.
- Align VERSION, the RPM spec, and backend/frontend application versions at `2.13.1` for this milestone; retain existing library dependency versions and the lockfile unless a demonstrated integration failure requires a narrow correction.
- Mark candidate RPM releases `0.1.integration` and `0.2.integration`; do not publish these as stable releases or install them over 2.14.0.
- Pin the CLI to the exact tested commit, build with Go `1.25.8` or a deliberately pinned newer compatible toolchain, and never use mutable `main` for an accepted candidate.
- Keep TLS certificate verification and RPM signature verification enabled; corporate CA inputs remain outside the package payload.
- Preserve additional environment settings and existing credentials across configuration reruns and package upgrades.
- Require actual OL8 systemd/PostgreSQL/application lifecycle acceptance on `aarch64` and `x86_64`; do not infer native hardware, EL9, or enforcing-SELinux certification from those container runs.

---

## Repository boundary and file map

All code paths below are relative to **heimdall-cli**, not heimdall2. At execution
time, read that repository's instructions and use `using-git-worktrees` to make
an isolated `codex/rpm-integration-prerequisites` branch from
`c7da1593c4ffa81d4457fa0757418842ae50bac0`. A local checkout or a fresh clone is
acceptable; do not assume a sibling directory exists. Record its absolute path
as `CLI_WORKTREE` in the executor's shell.

| File | Responsibility |
|---|---|
| `cmd/gen-manpages/main.go`, `main_test.go` | Generate section-1 man pages from the real Cobra tree |
| `internal/cmd/env.go`, `env_test.go` | Read/write the supported single-line environment format without discarding unrelated text |
| `internal/cmd/env_values.go`, `env_values_test.go` | Small literal-value codec shared by existing environment reads/writes |
| `internal/cmd/setup.go`, `setup_test.go` | Preserve settings, resolve topology before bootstrap, propagate restart failures |
| `internal/cmd/fakes_test.go` | Make fake service transitions match successful starts/restarts |

## Task 1: Supply the man-page generator the RPM already requires

**Files:** Create `cmd/gen-manpages/main.go` and `cmd/gen-manpages/main_test.go`.
Use the existing `internal/cmd.NewRootCmd()`; do not duplicate its command list.

**Interfaces:** Consumes `cmd.NewRootCmd() *cobra.Command`. Produces
`go run ./cmd/gen-manpages OUTPUT_DIRECTORY`, which exits nonzero on error and
creates `heimdall-cli.1`, `heimdall-cli-setup.1`, and pages for the other commands.

- [ ] **Step 1: Add the behavior test.**

```go
package main

import (
    "os"
    "path/filepath"
    "strings"
    "testing"
)

func TestGenerateCommandPages(t *testing.T) {
    dir := t.TempDir()
    if err := generate(dir); err != nil { t.Fatal(err) }
    for _, name := range []string{"heimdall-cli.1", "heimdall-cli-setup.1", "heimdall-cli-backup.1"} {
        data, err := os.ReadFile(filepath.Join(dir, name))
        if err != nil { t.Fatal(err) }
        if len(data) == 0 { t.Fatalf("empty page: %s", name) }
    }
    data, err := os.ReadFile(filepath.Join(dir, "heimdall-cli-setup.1"))
    if err != nil { t.Fatal(err) }
    if !strings.Contains(strings.ReplaceAll(string(data), "\\-", "-"), "skip-tls") { t.Fatal("setup flags missing") }
}
```

- [ ] **Step 2: Run `go test ./cmd/gen-manpages`; observe missing `generate`.**

- [ ] **Step 3: Add the generator.**

```go
package main

import (
    "fmt"
    "os"
    "time"

    "github.com/mitre/heimdall-cli/internal/cmd"
    "github.com/spf13/cobra/doc"
)

func generate(dir string) error {
    if err := os.MkdirAll(dir, 0755); err != nil { return err }
    root := cmd.NewRootCmd()
    root.DisableAutoGenTag = true
    date := time.Date(2026, 9, 22, 0, 0, 0, 0, time.UTC)
    return doc.GenManTree(root, &doc.GenManHeader{
        Title: "HEIMDALL-CLI", Section: "1", Date: &date,
        Source: "Heimdall", Manual: "Heimdall administration",
    }, dir)
}

func main() {
    if len(os.Args) != 2 {
        fmt.Fprintln(os.Stderr, "Usage: gen-manpages OUTPUT_DIRECTORY")
        os.Exit(64)
    }
    if err := generate(os.Args[1]); err != nil {
        fmt.Fprintln(os.Stderr, err)
        os.Exit(1)
    }
}
```

- [ ] **Step 4: Run the generator twice into temporary directories and compare.**

```bash
go test ./cmd/gen-manpages
man_test=$(mktemp -d)
go run ./cmd/gen-manpages "$man_test/first"
go run ./cmd/gen-manpages "$man_test/second"
diff -r "$man_test/first" "$man_test/second"
```

Expected: tests and diff exit zero. No server/service command is executed.

- [ ] **Step 5: Format and commit.**

```bash
gofmt -w cmd/gen-manpages
git add cmd/gen-manpages
git commit -m "build: generate CLI man pages for RPM packaging"
```

## Task 2: Preserve configuration across the native setup path

**Files:** Modify `internal/cmd/setup.go`, `internal/cmd/env.go`,
`internal/cmd/setup_test.go`, `internal/cmd/env_test.go`; create
`internal/cmd/env_values.go` and `internal/cmd/env_values_test.go`.

**Interfaces:** Keep `EnvManager` unchanged. `WriteEnvFile(map[string]string)
error` becomes a preserving update of supplied keys. `WriteEnvKey` delegates to
that operation. `ParseEnv(string) map[string]string` uses the same literal codec
as the writer. Do not execute the file as a shell script from Go.

- [ ] **Step 1: Add a setup regression using the existing fake.**

```go
func TestStepConfigurePreservesAdditionalSettings(t *testing.T) {
    r, _, _ := newTestSetupRunner()
    original := map[string]string{
        "LOCAL_LOGIN_DISABLED": "true", "OIDC_NAME": "Corporate Login",
        "EXTERNAL_URL": "https://heimdall.example.test",
        "DATABASE_PASSWORD": "existing-password", "JWT_SECRET": "existing-jwt",
        "API_KEY_SECRET": "existing-api",
    }
    r.Env.(*FakeEnvManager).Env = original
    require.NoError(t, r.stepConfigure())
    first, err := r.Env.ReadEnv()
    require.NoError(t, err)
    for key, value := range original { require.Equal(t, value, first[key], key) }
    require.NoError(t, r.stepConfigure())
    second, err := r.Env.ReadEnv()
    require.NoError(t, err)
    require.Equal(t, first, second)
}
```

Add a real-file regression to `env_test.go` (imports: `os`, `os/exec`,
`path/filepath`, `strings`, `testing`, and existing `require`):

```go
func TestWriteEnvPreservesTextAndLiteralSecrets(t *testing.T) {
    path := filepath.Join(t.TempDir(), "backend.env")
    initial := "# operator comment\nLOCAL_LOGIN_DISABLED=true\nOIDC_NAME='Corporate Login'\n"
    require.NoError(t, os.WriteFile(path, []byte(initial), 0640))
    manager := &FileEnvManager{Path: path}
    secret := "Rpm $literal `text` \\" + " quote\""
    require.NoError(t, manager.WriteEnvFile(map[string]string{"DATABASE_PASSWORD": secret}))
    first, err := os.ReadFile(path)
    require.NoError(t, err)
    require.True(t, strings.HasPrefix(string(first), initial))
    values, err := manager.ReadEnv()
    require.NoError(t, err)
    require.Equal(t, secret, values["DATABASE_PASSWORD"])
    command := exec.Command("bash", "-c", `source "$1"; printf '%s' "$DATABASE_PASSWORD"`, "test", path)
    output, err := command.Output()
    require.NoError(t, err)
    require.Equal(t, secret, string(output))
    require.NoError(t, manager.WriteEnvFile(values))
    second, err := os.ReadFile(path)
    require.NoError(t, err)
    require.Equal(t, first, second)
}
```

- [ ] **Step 2: Run `go test ./internal/cmd -run 'TestStepConfigurePreservesAdditionalSettings|TestWriteEnvPreservesTextAndLiteralSecrets' -count=1`; observe lost keys/text or incorrect literal decoding.**

- [ ] **Step 3: Merge existing keys before the existing `WriteEnvFile` call in `SetupRunner.writeConfig`.**

```go
for key, value := range existing {
    if _, managed := entries[key]; !managed { entries[key] = value }
}
```

In `stepConfigure`, replace ignored `ReadEnv` errors with:

```go
existing, err := r.Env.ReadEnv()
if err != nil && !errors.Is(err, os.ErrNotExist) { return err }
```

Add `errors` and `os` imports if absent. A missing file is a fresh install;
permission or read errors must not silently become an empty configuration.

- [ ] **Step 4: Add a small literal codec and use it from ParseEnv.**

`decodeEnvValue` removes one pair of outer single/double quotes. Within double
quotes it unescapes only backslash, double quote, dollar sign, and backtick, which
matches the shell configurator's serializer. It never performs interpolation.

```go
func decodeEnvValue(value string) string {
    if len(value) >= 2 && value[0] == '\'' && value[len(value)-1] == '\'' {
        return value[1:len(value)-1]
    }
    if len(value) < 2 || value[0] != '"' || value[len(value)-1] != '"' { return value }
    inner := value[1:len(value)-1]
    var out strings.Builder
    for i := 0; i < len(inner); i++ {
        if inner[i] == '\\' && i+1 < len(inner) && strings.ContainsRune("\\\"$`", rune(inner[i+1])) { i++ }
        out.WriteByte(inner[i])
    }
    return out.String()
}

func encodeEnvValue(value string) (string, error) {
    if strings.ContainsAny(value, "\r\n\x00") { return "", fmt.Errorf("environment values must be single-line literals") }
    escaped := strings.NewReplacer("\\", "\\\\", "\"", "\\\"", "$", "\\$", "`", "\\`").Replace(value)
    return "\"" + escaped + "\"", nil
}
```

`env_values.go` is in package `cmd` and imports `fmt` and `strings`. In ParseEnv,
replace `strings.Trim(val, "\"'")` with `decodeEnvValue(val)` and strip an
optional `export ` prefix from the parsed key. Keep the existing public signature.
Add a table-driven codec test for empty, plain, space-containing, single-quoted,
double-quoted, backslash/dollar/backtick values, and rejection of newline/NUL.
The assertion for every accepted value is:

```go
encoded, err := encodeEnvValue(value)
require.NoError(t, err)
require.Equal(t, value, decodeEnvValue(encoded))
```

- [ ] **Step 5: Replace the destructive WriteEnvFile body with a preserving update.**

Use existing imports plus `errors` and `fmt` as needed. Keep unrelated lines and
the exact text of unchanged assignments. Serialize changed/new values with the
codec, append new keys in sorted order, and validate all new values before
writing. `ParseEnv(line)` is the existing parser, now using the codec.

```go
data, err := os.ReadFile(m.Path)
if err != nil && !errors.Is(err, os.ErrNotExist) { return err }
encoded := make(map[string]string, len(entries))
for key, value := range entries {
    if key == "" || strings.ContainsAny(key, "= \t\r\n\x00") { return fmt.Errorf("invalid environment key %q", key) }
    encoded[key], err = encodeEnvValue(value)
    if err != nil { return err }
}
seen := make(map[string]bool)
var lines []string
if len(data) != 0 { lines = strings.Split(strings.TrimSuffix(string(data), "\n"), "\n") }
for i, line := range lines {
    for key, previous := range ParseEnv(line) {
        value, updating := entries[key]
        if !updating { continue }
        seen[key] = true
        if value != previous { lines[i] = key + "=" + encoded[key] }
    }
}
var missing []string
for key := range entries { if !seen[key] { missing = append(missing, key) } }
sort.Strings(missing)
for _, key := range missing { lines = append(lines, key + "=" + encoded[key]) }
return os.WriteFile(m.Path, []byte(strings.Join(lines, "\n")+"\n"), 0640)
```

Replace `WriteEnvKey`'s body with:

```go
return m.WriteEnvFile(map[string]string{key: value})
```

Adjust existing tests that intentionally asserted destructive replacement to
assert preserving updates. Do not weaken content/permission assertions.

- [ ] **Step 6: Run the targeted regressions and `go test ./internal/cmd -count=1`.**

Expected: extra keys, comments, literal secrets, explicit changes, and second-run
stability pass. Add a real-file read-error case using a directory as the env path;
assert `stepConfigure` returns an error and the directory is unchanged.

- [ ] **Step 7: Format and commit the configuration change.**

```bash
gofmt -w internal/cmd/env.go internal/cmd/env_values.go internal/cmd/env_test.go internal/cmd/env_values_test.go internal/cmd/setup.go internal/cmd/setup_test.go
git add internal/cmd/env.go internal/cmd/env_values.go internal/cmd/env_test.go internal/cmd/env_values_test.go internal/cmd/setup.go internal/cmd/setup_test.go
git commit -m "fix: preserve configuration through CLI setup reruns"
```

## Task 3: Make setup resolve topology and apply service changes correctly

**Files:** Modify `internal/cmd/setup.go`, `internal/cmd/setup_test.go`, and
`internal/cmd/fakes_test.go`.

**Interfaces:** Uses existing `SystemdRunner.Enable`, `Restart`, `IsActive`, and
`ExecRunner.Run`. Setup exits nonzero if the system bus or required service is
unavailable. `--reconfigure` performs configuration only.

- [ ] **Step 1: Add regression cases to setup_test.go.**

```go
func TestSetupRestartsAnExistingService(t *testing.T) {
    r, _, _ := newTestSetupRunner()
    r.Env.(*FakeEnvManager).Env["DATABASE_PASSWORD"] = "existing"
    systemd := r.Systemd.(*FakeSystemdRunner)
    systemd.ActiveServices[ServiceName] = true
    require.NoError(t, r.stepStartService())
    require.Contains(t, systemd.Actions, "restart:"+ServiceName)
}

func TestSetupUsesExistingRemoteHost(t *testing.T) {
    r, out, _ := newTestSetupRunner()
    r.Env.(*FakeEnvManager).Env = map[string]string{
        "DATABASE_HOST": "db.example.test", "DATABASE_PASSWORD": "existing",
    }
    r.SkipTLS = true
    require.NoError(t, r.Run())
    require.Contains(t, out.String(), "skipped -- external database")
    for _, call := range r.Exec.(*FakeExecRunner).Calls {
        require.NotEqual(t, "runuser", call.Name)
    }
}

func TestSetupRejectsMissingServiceManager(t *testing.T) {
    r, _, _ := newTestSetupRunner()
    r.Exec.(*FakeExecRunner).Results["systemctl show-environment"] = FakeExecResult{ExitCode: 1}
    require.Error(t, r.Run())
    require.Empty(t, r.Env.(*FakeEnvManager).Env)
    r.Reconfigure = true
    require.NoError(t, r.Run())
}
```

- [ ] **Step 2: Run `go test ./internal/cmd -run 'TestSetupRestartsAnExistingService|TestSetupUsesExistingRemoteHost|TestSetupRejectsMissingServiceManager' -count=1`; observe the failures.**

- [ ] **Step 3: After the dry-run return, add the real-setup preflight before configuration.**

```go
if !r.Reconfigure {
    _, code, err := r.Exec.Run("systemctl", "show-environment")
    if err != nil || code != 0 { return fmt.Errorf("setup requires a running systemd service manager") }
}
```

Move the existing summary call and `isLocalDB` calculation after successful
`stepConfigure`, before PostgreSQL selection, retaining dry-run's own topology
calculation. Do not change existing summary text. The actual branch is:

```go
isLocalDB := isLocalHost(r.DBHost)
r.printSummary(isLocalDB)
```

Replace `EnableNow` in `stepStartService` with:

```go
if err := r.Systemd.Enable(ServiceName); err != nil { return fmt.Errorf("enabling service: %w", err) }
if err := r.Systemd.Restart(ServiceName); err != nil { return fmt.Errorf("restarting service: %w", err) }
active, err := r.Systemd.IsActive(ServiceName)
if err != nil { return err }
if !active { return fmt.Errorf("service %s is not active after restart", ServiceName) }
```

Keep the existing success output. Update fake `Start`, `Restart`, and `EnableNow`
to set `ActiveServices[service] = true` only when `Err == nil`, allocating the
map if needed; fake `Stop` sets it false on success. Retain recorded actions.
Update existing tests to expect enable/restart instead of enable-now.

- [ ] **Step 4: Run all CLI unit tests and compile the binary.**

```bash
gofmt -w internal/cmd/setup.go internal/cmd/setup_test.go internal/cmd/fakes_test.go
go test ./internal/cmd ./cmd/gen-manpages -count=1
go build ./cmd/heimdall-cli
git diff --check
```

Use the existing injected-error cases to verify failure propagation. Real
systemd, database, TLS, and literal environment loading are also checked by the
RPM lifecycle plan; fake tests are not a substitute.

- [ ] **Step 5: Commit, publish the integration branch, and record its exact commit.**

```bash
git add internal/cmd/setup.go internal/cmd/setup_test.go internal/cmd/fakes_test.go
git commit -m "fix: resolve setup topology and verify service restarts"
git push -u origin codex/rpm-integration-prerequisites
git rev-parse HEAD
```

If the repository's authorized workflow uses a fork, use that repository URL
when recording the RPM CLI source; do not claim the commit exists in upstream.
No merge or tag is required for the candidate. The RPM plan reads the commit
from this checkout, so it does not require an invented future SHA.

## Self-review and handoff

Spec coverage: R4 is Task 2; R5's native setup path is Task 3; R6's missing
generator is Task 1. The main RPM plan covers the package integration and real
lifecycle checks. All new interfaces are defined above; existing runner/test
helper names were checked at the pinned CLI commit. No FIPS or logger edits are
part of these tasks.
