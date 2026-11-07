# RPM Branch Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all eleven verified audit defects and produce candidate-specific evidence for the RPM deployment and connected application behavior.

**Architecture:** Preserve direct RPM packaging and the pinned CLI plus repository-owned patch. Make narrow fixes in package input handling, existing CLI operations, and existing backend services. Keep packaging, CLI, and backend fixes independently reviewable, followed by shared deployment acceptance.

**Tech Stack:** GNU Make, Bash, Python 3, RPM/DNF, Go/Cobra, NestJS/Express, TypeScript, Sequelize/PostgreSQL, Vitest, systemd, Nginx/Caddy, SELinux, firewalld, fapolicyd, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-15-rpm-branch-audit-remediation-design.md`. Read it before implementation; F1–F11 map directly to Tasks 1–11.

## Global Constraints

- Keep application version `2.14.0`; `VERSION` remains authoritative.
- Support EL8, EL9, and EL10 on `x86_64` and `aarch64`.
- Keep PostgreSQL support at `13–18`.
- Keep the Node.js build floor at `>=22.18.0` and the pinned Go build toolchain at `1.25.8`.
- Add no application dependencies and no new runtime service.
- Preserve saved configuration, credentials, comments, explicit port choices, and externally owned services.
- Keep the backend port private when using a managed HTTPS proxy.
- Keep SELinux and fapolicyd enabled during host acceptance; containers do not prove their enforcement.
- Preserve the migration gate, failed-upgrade backups, retained data, SQL error handling, and private-file permissions.
- Use disposable test databases, containers, and VMs; never run destructive fixtures against an existing installation.
- Record evidence for the exact candidate commit and package hashes; historical packages do not certify new source.

---

## File ownership and execution order

| Area | Files and responsibility |
|---|---|
| Source/package safety | `packaging/rpm/Makefile`, `scripts/check-inputs.py`, `Dockerfile.ol8.dockerignore`, `tests/inputs.py`: archive filtering and cleanup validation. |
| Packaged CLI | `packaging/rpm/heimdall-cli-nginx.patch`: authoritative diff against `heimdall-cli.ref`. Edit the Go files named in each task in a disposable CLI checkout, then regenerate this patch. |
| RPM defaults/docs | `heimdall-backend.env`, `heimdall-Caddyfile`, RPM README/BUILD/man pages and RPM test scripts: fresh defaults and documented operation. |
| HTTP configuration | `apps/backend/src/main.ts`, `config/config.service.ts`: bounded proxy trust and session behavior. |
| Upload handling | `apps/backend/src/evaluations/evaluations.module.ts`, `evaluations.controller.ts`, new regression test: one effective multipart configuration. |
| Data invariants | Existing groups/evaluations service files plus new focused regression suites: owner eligibility and awaited transactions. |
| Verification | Existing RPM tests, `.github/workflows/build-rpm.yml`, and a new candidate evidence report: test wiring and acceptance records. |

Tasks 1, 2, 4, and 8–10 can be developed independently in isolated worktrees. Tasks 3, 5–7, and 11 all modify the same CLI patch and must be integrated serially by one owner. Task 12 wires missing checks into CI. Task 13 runs final acceptance after all fixes.

Use `using-git-worktrees` when starting implementation. Preserve the user's existing untracked authentication documents and `heimdall-cli-setup-prompts.patch`; stage only each task's files.

## Prepare the pinned CLI once for Tasks 3, 5–7, and 11

Run on Linux with the documented build toolchain; do not install or modify an application instance:

```bash
rpm_plan_root=$(git rev-parse --show-toplevel)
rpm_plan_topdir=$(mktemp -d /tmp/heimdall-rpm-plan.XXXXXX)
export rpm_plan_root rpm_plan_topdir
make -C packaging/rpm cli-build-src TOPDIR="$rpm_plan_topdir" SOURCE_MODE=workspace
cd "$rpm_plan_topdir/heimdall-cli-build"
test "$(git rev-parse HEAD)" = "$(cat "$rpm_plan_root/packaging/rpm/heimdall-cli.ref")"
go test ./...
cd "$rpm_plan_root"
```

The Go paths in CLI tasks are relative to `$rpm_plan_topdir/heimdall-cli-build`. Do not rerun `cli-build-src` over in-progress edits; it deletes that disposable build checkout. Before each CLI commit, export all tracked and new Go patch files and prove the result applies to the pin:

```bash
git -C "$rpm_plan_topdir/heimdall-cli-build" add -N -- .
git -C "$rpm_plan_topdir/heimdall-cli-build" diff --binary > packaging/rpm/heimdall-cli-nginx.patch
rpm_patch_check=$(mktemp -d /tmp/heimdall-cli-patch-check.XXXXXX)
git clone --quiet --no-hardlinks "$rpm_plan_topdir/heimdall-cli-src" "$rpm_patch_check/cli"
git -C "$rpm_patch_check/cli" apply --check "$rpm_plan_root/packaging/rpm/heimdall-cli-nginx.patch"
```

Only intended source/tests/docs belong in that disposable checkout. Review `git status --short` there before `add -N`. Regenerate the patch after every CLI task so the next commit includes exactly the reviewed change. Generated man pages are built from that patched command tree, not hand-edited.

## Task 1: Exclude registry credentials from package inputs (F1)

**Files:** Modify `packaging/rpm/Makefile`, `packaging/rpm/Dockerfile.ol8.dockerignore`, `packaging/rpm/tests/inputs.py`, `packaging/rpm/BUILD.md`.

**Interfaces:** Consumes the existing `InputsTest.prepare_make_fixture()` and `InputsTest.make(*args)` fixtures and `sources` Make target. Produces the same source archive layout without local registry authentication files; no interface changes.

- [ ] **Step 1: Extend the actual source-archive regression.** Add these entries to `excluded` in `test_default_archive_excludes_local_inputs_without_git`; its existing loop writes a private marker and checks archive membership:

```python
'.npmrc', 'apps/backend/.npmrc',
'.yarnrc.yml', 'apps/frontend/.yarnrc.yml',
```

- [ ] **Step 2: Run the regression before editing archive behavior.**

```bash
python3 packaging/rpm/tests/inputs.py InputsTest.test_default_archive_excludes_local_inputs_without_git -v
```

Expected: FAIL because the archive contains `.npmrc`.

- [ ] **Step 3: Add the two tar exclusions and Docker context patterns.**

```make
	  --exclude=.npmrc --exclude=.yarnrc.yml \
```

```text
**/.npmrc
**/.yarnrc.yml
```

In `BUILD.md`, add: “Workspace source archives and Docker build contexts exclude local `.npmrc` and `.yarnrc.yml` files. Authenticate package downloads through the build environment; do not put credentials into distributable sources.” This does not introduce a new credential transport feature.

- [ ] **Step 4: Verify source and actual Docker-context filtering.**

```bash
python3 packaging/rpm/tests/inputs.py -v
rpm_context_fixture=$(mktemp -d /tmp/heimdall-context-test.XXXXXX)
printf 'FROM scratch\nCOPY . /\n' > "$rpm_context_fixture/Dockerfile"
cp packaging/rpm/Dockerfile.ol8.dockerignore "$rpm_context_fixture/.dockerignore"
printf '//registry.example.invalid/:_authToken=synthetic-only\n' > "$rpm_context_fixture/.npmrc"
printf 'npmAuthToken: synthetic-only\n' > "$rpm_context_fixture/.yarnrc.yml"
printf 'keep\n' > "$rpm_context_fixture/source.txt"
docker build --network=none --output "type=local,dest=$rpm_context_fixture-export" "$rpm_context_fixture"
test -f "$rpm_context_fixture-export/source.txt"
test ! -e "$rpm_context_fixture-export/.npmrc"
test ! -e "$rpm_context_fixture-export/.yarnrc.yml"
```

Expected: all source-input tests pass; export contains `source.txt` and neither credential file.

- [ ] **Step 5: Commit the reviewed change.**

```bash
git add packaging/rpm/Makefile packaging/rpm/Dockerfile.ol8.dockerignore packaging/rpm/tests/inputs.py packaging/rpm/BUILD.md
git commit -m "fix(rpm): exclude registry credentials from build inputs"
```

## Task 2: Reject unsafe cleanup paths (F2)

**Files:** Modify `packaging/rpm/scripts/check-inputs.py`, `packaging/rpm/Makefile`, `packaging/rpm/tests/inputs.py`, `packaging/rpm/BUILD.md`.

**Interfaces:** Extend existing `check-inputs.py REPO TOPDIR MODE` with mode `clean`. It returns zero only for an allowed cleanup path and does not read application version metadata in this mode.

- [ ] **Step 1: Add these methods to the existing `InputsTest` class.** Real deletion cases stay inside its temporary fixture; actual home/root paths go only to the read-only validator.

```python
    def test_clean_rejects_protected_paths(self):
        source_link = Path(self.tmp.name) / 'source-link'
        source_link.symlink_to(self.root, target_is_directory=True)
        for target in (self.root, self.root.parent, self.root / 'output',
                       Path.home(), Path('/'), source_link):
            with self.subTest(target=target):
                self.topdir = target
                result = self.check('clean')
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('Refusing to clean protected RPM topdir', result.stderr)
        self.assertTrue(self.root.is_dir())

    def test_make_clean_preserves_source(self):
        self.prepare_make_fixture()
        self.topdir = self.root
        result = self.make('clean')
        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertTrue((self.root / 'VERSION').is_file())

    def test_make_clean_preserves_source_ancestor(self):
        self.prepare_make_fixture()
        self.topdir = self.root.parent
        sentinel = self.topdir / 'unrelated-file'
        sentinel.write_text('preserve me')
        result = self.make('clean')
        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(sentinel.read_text(), 'preserve me')
        self.assertTrue((self.root / 'VERSION').is_file())

    def test_make_clean_preserves_symlink_to_source(self):
        self.prepare_make_fixture()
        self.topdir = Path(self.tmp.name) / 'source-link'
        self.topdir.symlink_to(self.root, target_is_directory=True)
        result = self.make('clean')
        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertTrue(self.topdir.is_symlink())
        self.assertTrue((self.root / 'VERSION').is_file())

    def test_make_clean_removes_only_external_output(self):
        self.prepare_make_fixture()
        self.topdir = Path(self.tmp.name) / 'output with spaces'
        self.topdir.mkdir()
        (self.topdir / 'artifact').write_text('build output')
        sibling = Path(self.tmp.name) / 'unrelated-file'
        sibling.write_text('preserve me')
        # Cleanup must still work after the source version becomes invalid.
        (self.root / 'VERSION').unlink()
        result = self.make('clean')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertFalse(self.topdir.exists())
        self.assertTrue(self.root.is_dir())
        self.assertEqual(sibling.read_text(), 'preserve me')

```

Add the explicit empty-value case:

```python
    def test_clean_rejects_empty_topdir(self):
        result = subprocess.run(
            [sys.executable, str(CHECK), str(self.root), '', 'clean'],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Refusing to clean protected RPM topdir', result.stderr)
```

Do not pass real root/home directories to the unfixed Make recipe.

- [ ] **Step 2: Run the tests and confirm the copied source-deletion cases fail.**

```bash
python3 packaging/rpm/tests/inputs.py -v
```

- [ ] **Step 3: Add cleanup validation before reading VERSION or manifests.** Keep the existing resolved `repo` and `topdir` values:

```python
if mode not in ('check', 'head', 'release', 'workspace', 'clean'):
    sys.exit('Unknown source mode')
if mode == 'clean':
    if (not sys.argv[2] or topdir == repo or repo in topdir.parents
            or topdir in repo.parents or topdir == Path.home().resolve()):
        sys.exit('Refusing to clean protected RPM topdir')
    sys.exit(0)
```

```make
clean:
	python3 scripts/check-inputs.py ../.. "$(TOPDIR)" clean
	rm -rf "$(TOPDIR)"
```

Document the protected paths and continued cleanup support when VERSION is missing in `BUILD.md`. No ownership-marker framework is needed for this defect.

- [ ] **Step 4: Run all source-input and CLI acquisition regressions.**

```bash
python3 packaging/rpm/tests/inputs.py -v
python3 packaging/rpm/tests/cli-acquisition.py
```

Expected: protected paths retain all contents; valid external output, including a path with spaces, is removed; unrelated siblings remain.

- [ ] **Step 5: Commit.**

```bash
git add packaging/rpm/scripts/check-inputs.py packaging/rpm/Makefile packaging/rpm/tests/inputs.py packaging/rpm/BUILD.md
git commit -m "fix(rpm): reject protected cleanup paths"
```

## Task 3: Retire a deselected proxy during restore (F3)

**Files:** Modify `packaging/rpm/heimdall-cli-nginx.patch`; patched CLI files `internal/cmd/restore.go`, `internal/cmd/restore_test.go`.

**Interfaces:** Consumes `RestoreRunner.Run(archive string) error`, existing `env` (archive) and `existing` (current installation). No signature changes. Preserve stop-before-config-write ordering, archive validation and recovery markers.

- [ ] **Step 1: Add the regression.**

Add this to `internal/cmd/restore_test.go`, using existing imports (`os`, `strings`, `testing`, `require`) and helpers:

```go
func TestRestoreProxyOwnershipTransition(t *testing.T) {
    for _, oldMode := range []string{"bundled", "nginx"} {
        for _, newMode := range []string{"bundled", "nginx", "external", "none", ""} {
            t.Run(oldMode+" to "+newMode, func(t *testing.T) {
                p, fs, exec := recoveryFixture(t, true)
                before := "DATABASE_PASSWORD=old-secret\nHEIMDALL_PROXY_MODE="+oldMode+"\n"
                require.NoError(t, os.WriteFile(p.EnvFile, []byte(before), 0640))
                archived := "DATABASE_PASSWORD=new-secret\nHEIMDALL_DATABASE_MODE=external\nHEIMDALL_PROXY_MODE="+newMode+"\n"
                require.NoError(t, recoveryRestore(p, fs, exec).Run(oldRecoveryArchive(t, archived, true)))
                unit := bundledCaddyService
                if oldMode == "nginx" { unit = bundledNginxService }
                action := "stop "+unit
                if oldMode != newMode { action = "disable --now "+unit }
                var actions []string
                for _, call := range exec.calls {
                    if call.Name == "systemctl" { actions = append(actions, strings.Join(call.Args, " ")) }
                }
                require.Equal(t, []string{"stop heimdall-server", action}, actions)
            })
        }
    }
}

func TestRestoreProxyDisableFailurePreservesCurrentConfig(t *testing.T) {
    p, fs, exec := recoveryFixture(t, true)
    before, err := os.ReadFile(p.EnvFile)
    require.NoError(t, err)
    exec.fail = "systemctl disable --now heimdall-caddy"
    archive := oldRecoveryArchive(t, "DATABASE_PASSWORD=secret\nHEIMDALL_PROXY_MODE=nginx\n", true)
    require.Error(t, recoveryRestore(p, fs, exec).Run(archive))
    after, err := os.ReadFile(p.EnvFile)
    require.NoError(t, err)
    require.Equal(t, before, after)
    require.Empty(t, exec.sql)
    require.True(t, fs.Exists(p.ConfigDir+"/upgrade-pending"))
}
```

- [ ] **Step 2: Confirm the regression fails on the original behavior.**

```bash
cd "$rpm_plan_topdir/heimdall-cli-build"
go test ./internal/cmd -run 'TestRestoreProxy'
```

Expected: changed-mode cases fail because they see `stop` rather than `disable --now`; same-mode cases pass.

- [ ] **Step 3: Apply the minimal fix.**

Replace only the existing `if proxyUnit != ""` body in RestoreRunner.Run:

```go
if proxyUnit != "" {
    args := []string{"stop", proxyUnit}
    if existing["HEIMDALL_PROXY_MODE"] != env["HEIMDALL_PROXY_MODE"] {
        args = []string{"disable", "--now", proxyUnit}
    }
    if err := runChecked(r.Exec, "systemctl", args...); err != nil {
        return err
    }
}
```

The same-mode path remains `stop`; it must preserve enablement. Legacy archives without a proxy mode conservatively retire the previously selected managed proxy because later setup defaults configured legacy files to external ownership.

- [ ] **Step 4: Verify the fix and connected behavior.**

```bash
go test ./internal/cmd -run 'TestRestoreProxy|TestNginxRecovery|TestRecoveryArchive|TestRestore'
```

Expected: all tests pass; a disable failure leaves backend.env intact, no restore SQL runs, and the pending marker remains.

Host acceptance in Task 13 must cover both managed transitions, managed-to-external/none, same-mode recovery, and reboot.
- [ ] **Step 5: Commit the verified change.**

Regenerate and apply-check `packaging/rpm/heimdall-cli-nginx.patch` using the pinned-source commands above.

```bash
git add packaging/rpm/heimdall-cli-nginx.patch
git commit -m "fix(rpm): disable deselected proxy during restore"
```


## Task 4: Trust managed loopback proxies independently of sessions (F4)

**Files:** Modify `apps/backend/src/config/config.service.ts`, `apps/backend/src/main.ts`; create `apps/backend/src/config/config.proxy.spec.ts`.

**Interfaces:** Produces `ConfigService.getTrustProxy(): boolean | 'loopback'`. Bootstrap consumes it once before sessions and rate limiting. Managed modes are exactly `nginx` and `bundled`; external/non-RPM behavior remains as before.

- [ ] **Step 1: Add the regression.**

```ts
import express from 'express';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ConfigService} from './config.service';

afterEach(() => vi.restoreAllMocks());

function config(values: Record<string, string> = {}, tenable: string[] = []) {
  const service = Object.create(ConfigService.prototype) as ConfigService;
  vi.spyOn(service, 'get').mockImplementation(key => values[key]);
  vi.spyOn(service, 'getTenableHostUrl').mockReturnValue(tenable);
  return service;
}

function clientIP(trust: boolean | 'loopback', peer: string, forwarded: string) {
  const app = express();
  app.set('trust proxy', trust);
  const request = Object.assign(Object.create(app.request), {
    app,
    socket: {remoteAddress: peer},
    headers: {'x-forwarded-for': forwarded}
  });
  return request.ip;
}

describe('proxy trust', () => {
  it.each(['nginx', 'bundled'])('trusts only loopback for managed %s', mode => {
    for (const values of [{}, {OIDC_CLIENTID: 'configured'}]) {
      expect(config({NODE_ENV: 'production', HEIMDALL_PROXY_MODE: mode, ...values})
        .getTrustProxy()).toBe('loopback');
    }
    expect(config({NODE_ENV: 'production', HEIMDALL_PROXY_MODE: mode}, ['https://tenable.example'])
      .getTrustProxy()).toBe('loopback');
  });

  it('preserves existing external and non-RPM behavior', () => {
    expect(config({NODE_ENV: 'production', HEIMDALL_PROXY_MODE: 'external', OIDC_CLIENTID: 'configured'})
      .getTrustProxy()).toBe(true);
    expect(config({NODE_ENV: 'production', OIDC_CLIENTID: 'configured'}).getTrustProxy()).toBe(true);
    expect(config({NODE_ENV: 'production'}, ['https://tenable.example']).getTrustProxy()).toBe(true);
    expect(config({NODE_ENV: 'production', HEIMDALL_PROXY_MODE: 'external'}).getTrustProxy()).toBe(false);
    expect(config({NODE_ENV: 'development', OIDC_CLIENTID: 'configured'}).getTrustProxy()).toBe(false);
  });

  it.each(['127.0.0.1', '::1', '::ffff:127.0.0.1'])('recognizes clients behind %s', peer => {
    expect(clientIP('loopback', peer, '198.51.100.4')).toBe('198.51.100.4');
    expect(clientIP('loopback', peer, '203.0.113.99, 198.51.100.4')).toBe('198.51.100.4');
  });

  it('ignores spoofed forwarded addresses from a direct remote peer', () => {
    expect(clientIP('loopback', '198.51.100.4', '203.0.113.99')).toBe('198.51.100.4');
  });
});
```

- [ ] **Step 2: Confirm the regression fails on the original behavior.**

```bash
yarn backend test:ci src/config/config.proxy.spec.ts
```

Expected: the helper does not yet exist; the separately reproduced current bootstrap also combines 21 forwarded clients into one login limit.

- [ ] **Step 3: Apply the minimal fix.**

Add this methodto the existing `ConfigService` class:

```ts
  getTrustProxy(): boolean | 'loopback' {
    if (['nginx', 'bundled'].includes(this.get('HEIMDALL_PROXY_MODE') || '')) {
      return 'loopback';
    }
    return this.isInProductionMode() && Boolean(
      this.enabledOauthStrategies().length || this.getTenableHostUrl().length
    );
  }
```

In `main.ts`, before registering sessions/rate limiting:

```ts
  const trustProxy = configService.getTrustProxy();
  app.set('trust proxy', trustProxy);
```

Delete the existing nested production `set('trust proxy', true)` block. In the session options, use `proxy: trustProxy === true ? true : undefined`, so managed loopback mode inherits the Express policy while the pre-existing external OAuth/Tenable behavior is preserved. The tests below exercise the actual Express IP getter without listening; they supplement, rather than replace, the separate real rate-limit regression and HTTPS session smoke checks.

- [ ] **Step 4: Verify the fix and connected behavior.**

```bash
yarn backend test:ci src/config/config.proxy.spec.ts src/config/config.service.spec.ts
yarn backend build
```

Expected: proxy/config tests and compilation pass. Task 13 exercises the real login limiter and secure session cookies.


- [ ] **Step 5: Commit the verified change.**

```bash
git add apps/backend/src/config/config.service.ts apps/backend/src/config/config.proxy.spec.ts apps/backend/src/main.ts
git commit -m "fix(backend): trust managed loopback proxies for local login"
```


## Task 5: Choose a usable fresh RPM port without migrating existing installations (F5)

**Files:** Modify `packaging/rpm/heimdall-cli-nginx.patch`, `heimdall-backend.env`, `heimdall-Caddyfile`, README/BUILD/security docs and man sources, `selinux/heimdall_server.te` (comment only), `tests/topology.sh`, `lifecycle.sh`, `features.sh`, `coexistence.sh`, `remote-database.sh`, and `.github/workflows/build-rpm.yml`. All short paths in this list are under `packaging/rpm`. Patch members are listed below.

**Interfaces:** Produces `DefaultRPMAppPort = "3002"` in `internal/cmd/config_types.go`; keeps `DefaultAppPort = "3000"`. Uses existing `SetupRunner.readConfiguration()`, `isConfigured`, saved `PORT`, and Cobra `flagChanged` precedence. Existing installations and explicit overrides retain their port and conflict checks.

- [ ] **Step 1: Add the complete default-resolution regression and update fresh-RPM expectations.**

Create `internal/cmd/rpm_default_port_test.go` in the extracted patched CLI, then include it in the regenerated RPM patch. The file uses existing test fixtures and requires no new production interfaces. It checks real Cobra flag tracking, repeated setup persistence, nil-flagChanged direct runners, stock SELinux default selection, and unchanged state on default/saved/explicit conflicts.

```go
package cmd

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func TestSetupRPMDefaultPortResolution(t *testing.T) {
	for _, tc := range []struct {
		name, saved, argument, want string
		rpm, configured             bool
	}{
		{name: "fresh standalone", want: "3000"},
		{name: "fresh RPM", rpm: true, want: "3002"},
		{name: "RPM template", rpm: true, saved: "3002", want: "3002"},
		{name: "fresh RPM saved legacy port", rpm: true, saved: "3000", want: "3000"},
		{name: "fresh RPM saved custom port", rpm: true, saved: "3210", want: "3210"},
		{name: "configured RPM implicit legacy port", rpm: true, configured: true, want: "3000"},
		{name: "configured RPM saved legacy port", rpm: true, configured: true, saved: "3000", want: "3000"},
		{name: "configured RPM saved custom port", rpm: true, configured: true, saved: "3210", want: "3210"},
		{name: "fresh RPM explicit legacy default", rpm: true, argument: "3000", want: "3000"},
		{name: "fresh RPM explicit custom port", rpm: true, argument: "3456", want: "3456"},
		{name: "RPM explicit legacy default beats saved", rpm: true, saved: "3210", argument: "3000", want: "3000"},
		{name: "RPM explicit new default beats saved", rpm: true, saved: "3210", argument: "3002", want: "3002"},
		{name: "standalone explicit port beats saved", saved: "3210", argument: "3000", want: "3000"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r, _, _ := newTestSetupRunner()
			if tc.rpm {
				r.FS.(*FakeFileSystem).Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
			}
			env := r.Env.(*FakeEnvManager).Env
			if tc.saved != "" {
				env["PORT"] = tc.saved
			}
			if tc.configured {
				env["JWT_SECRET"] = "saved-secret"
			}
			command := NewSetupCmd(r)
			require.Equal(t, "3000", command.Flags().Lookup("port").DefValue)
			args := []string{"--non-interactive", "--reconfigure"}
			if tc.argument != "" {
				args = append(args, "--port="+tc.argument)
			}
			command.SetArgs(args)
			require.NoError(t, command.Execute())
			require.Equal(t, tc.want, r.Env.(*FakeEnvManager).Env["PORT"])
			command = NewSetupCmd(r)
			command.SetArgs([]string{"--non-interactive", "--reconfigure"})
			require.NoError(t, command.Execute())
			require.Equal(t, tc.want, r.Env.(*FakeEnvManager).Env["PORT"])
		})
	}
}

func TestSetupRPMDefaultPortDirectRunner(t *testing.T) {
	for _, tc := range []struct {
		name, initial, saved, want string
		rpm, configured            bool
	}{
		{name: "empty standalone", want: "3000"},
		{name: "initialized standalone", initial: "3000", want: "3000"},
		{name: "empty RPM", rpm: true, want: "3002"},
		{name: "initialized RPM", rpm: true, initial: "3000", want: "3002"},
		{name: "initialized RPM saved port", rpm: true, initial: "3000", saved: "3210", want: "3210"},
		{name: "RPM saved legacy", rpm: true, saved: "3000", want: "3000"},
		{name: "RPM custom override", rpm: true, initial: "3456", saved: "3210", want: "3456"},
		{name: "configured RPM implicit legacy", rpm: true, configured: true, want: "3000"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r, _, _ := newTestSetupRunner()
			if tc.rpm {
				r.FS.(*FakeFileSystem).Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
			}
			if tc.saved != "" {
				r.Env.(*FakeEnvManager).Env["PORT"] = tc.saved
			}
			if tc.configured {
				r.Env.(*FakeEnvManager).Env["JWT_SECRET"] = "saved-secret"
			}
			r.Port = tc.initial
			require.Nil(t, r.flagChanged)
			_, err := r.readConfiguration()
			require.NoError(t, err)
			require.Equal(t, tc.want, r.Port)
		})
	}
}

func TestSetupRPMDefaultAvoidsStockSELinuxPort(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	fs := r.FS.(*FakeFileSystem)
	fs.Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
	fs.Files["/sys/fs/selinux/enforce"] = []byte("1")
	exec := r.Exec.(*FakeExecRunner)
	exec.Results["semanage port -l"] = FakeExecResult{Stdout: "ntop_port_t tcp 3000-3001\nhttp_port_t tcp 80,443\npostgresql_port_t tcp 5432\n"}
	command := NewSetupCmd(r)
	command.SetArgs([]string{"--non-interactive", "--reconfigure"})
	require.NoError(t, command.Execute())
	require.Equal(t, "3002", r.Env.(*FakeEnvManager).Env["PORT"])
	for _, call := range exec.Calls {
		if call.Name == "semanage" {
			require.Equal(t, []string{"port", "-l"}, call.Args)
		}
	}
}

func TestSetupRPMDefaultPortConflictsStillFailBeforeMutation(t *testing.T) {
	for _, tc := range []struct {
		name, saved, argument, port, problem string
		occupied                             bool
	}{
		{name: "default occupied", port: "3002", problem: "occupied", occupied: true},
		{name: "default SELinux conflict", port: "3002", problem: "other_port_t"},
		{name: "explicit legacy SELinux conflict", argument: "3000", port: "3000", problem: "other_port_t"},
		{name: "saved legacy SELinux conflict", saved: "3000", port: "3000", problem: "other_port_t"},
	} {
		for _, reconfigure := range []bool{false, true} {
			t.Run(tc.name+map[bool]string{false: " full", true: " reconfigure"}[reconfigure], func(t *testing.T) {
				r, _, _ := newTestSetupRunner()
				fs := r.FS.(*FakeFileSystem)
				fs.Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
				if tc.saved != "" {
					r.Env.(*FakeEnvManager).Env["PORT"] = tc.saved
				}
				exec := r.Exec.(*FakeExecRunner)
				if tc.occupied {
					exec.Results["ss -H -ltnp sport = :"+tc.port] = FakeExecResult{Stdout: `LISTEN 0 100 127.0.0.1:` + tc.port + ` 0.0.0.0:* users:(("other",pid=123,fd=1))`}
				} else {
					fs.Files["/sys/fs/selinux/enforce"] = []byte("1")
					exec.Results["semanage port -l"] = FakeExecResult{Stdout: "other_port_t tcp " + tc.port + "\n"}
				}
				unchanged := assertSetupPortUnchanged(t, r)
				command := NewSetupCmd(r)
				args := []string{"--non-interactive"}
				if reconfigure {
					args = append(args, "--reconfigure")
				}
				if tc.argument != "" {
					args = append(args, "--port="+tc.argument)
				}
				command.SetArgs(args)
				err := command.Execute()
				require.ErrorContains(t, err, tc.problem)
				unchanged()
			})
		}
	}
}
```

Update exactly three existing expectations in `internal/cmd/setup_port_test.go`:

```diff
- {name: "fresh default", want: "3000"},
+ {name: "fresh default", want: "3002"},
- {name: "fresh", wantDefault: "3000", want: "3000"},
+ {name: "fresh", wantDefault: "3002", want: "3002"},
- assert.Equal(t, []string{"3000"}, p.defaults)
+ assert.Equal(t, []string{"3002"}, p.defaults)
```

These are the fresh RPM expectations in `TestSetupBackendPortDefaultsOverridesAndPersistence`, `TestSetupBackendPortInteractiveDefaults`, and `TestSetupBackendPortPromptBeforeSummary`. Keep the same file's explicit `--port=3000`, saved values, and `ntop_port_t` refusal cases. Keep `internal/cmd/config_types_test.go`'s `DefaultAppPort == "3000"` assertion. The new behavior tests already exercise `DefaultRPMAppPort`; an extra constant-only assertion is unnecessary.

- [ ] **Step 2: Confirm the defect.**

```bash
cd "$rpm_plan_topdir/heimdall-cli-build"
go test ./internal/cmd -run '^TestSetup(RPMDefault|BackendPort)' -count=1
```

Expected: fresh RPM gets 3000; stock-policy test fails because ntop_port_t owns 3000–3001. Saved, explicit and standalone cases still pass.

- [ ] **Step 3: Change only the fresh RPM default and its shipped template.**

The repository builds the pinned CLI through `/Users/Shared/Docker/heimdall2/packaging/rpm/heimdall-cli-nginx.patch`. Make these edits in the extracted patched CLI, then regenerate the patch against pristine `ea29e299ca0206519dd324c9543c74cba80c1963`. The following relative source paths are patch members, not a checked-in CLI directory.

In `internal/cmd/config_types.go`, retain `DefaultAppPort` and add `DefaultRPMAppPort`:

```go
// Default port constants.
const (
    DefaultAppPort    = "3000"
    DefaultRPMAppPort = "3002"
    DefaultDBPort     = 5432
)
```

In `internal/cmd/setup.go`, immediately after the existing `r.Port = resolve(...)` and before `ValidateValue`, use this tested guard:

```go
r.Port = resolve("PORT", "port", r.Port, DefaultAppPort)
// Keep saved and explicit ports, including the historical standalone default.
if r.bundledRuntime && !configured && values["PORT"] == "" &&
    !r.flagChanged["port"] && r.Port == DefaultAppPort {
    r.Port = DefaultRPMAppPort
}
```

Retain the Cobra `StringVar` default argument `DefaultAppPort` and the `flagChanged` handling. Update its help text to make the displayed standalone default clear:

```go
flags.StringVar(&runner.Port, "port", DefaultAppPort,
    "Backend listen port (1024-65535; default shown is standalone; fresh RPM default 3002; saved PORT wins unless explicitly set)")
```

Replace the paragraph in `NewSetupCmd`'s long help with:

```text
The backend port uses saved PORT, otherwise 3002 for a fresh RPM installation
or 3000 for standalone and configured legacy installations. Use --port to
override it; managed HTTPS defaults to port 443. Setup rejects listener and
SELinux conflicts before changing configuration and prompts again in
interactive mode.
```

Change `/Users/Shared/Docker/heimdall2/packaging/rpm/heimdall-backend.env:5` to `PORT=3002`. This is required: the shipped template is a saved value, so merely changing CLI fallback does not fix a normal RPM install. The `%config(noreplace)` package behavior must continue to preserve existing backend.env files.

- [ ] **Step 4: Update the connected RPM fixtures and current documentation.**

All paths below are relative to `/Users/Shared/Docker/heimdall2/`.

- `packaging/rpm/tests/topology.sh:7`: change `backend_port=${3:-3000}` to `backend_port=${3:-3002}`. Replace unconditional `args+=(--port "$backend_port")` with the snippet below. An omitted third argument must genuinely test no-port-flag behavior; explicit custom port jobs still test the override.
- `packaging/rpm/tests/lifecycle.sh:46`: change the fresh RPM fallback `${PORT:-3000}` to `${PORT:-3002}`. Saved values still win.
- `packaging/rpm/tests/features.sh:6`: change `original_port=${PORT:-3000}` to `original_port=${PORT:-3002}`. At line71 replace the successful `set-port 3001` fixture with `set-port 3456`: `3001` has the same stock SELinux conflict as `3000`.
- `packaging/rpm/tests/coexistence.sh:41`: upstream becomes `http://127.0.0.1:3002`. At lines100/103, successful changes become `set-port 3456` then `set-port 3002`.
- `packaging/rpm/tests/remote-database.sh:122`: external test Nginx upstream becomes `http://rpm-app:3002`.

```bash
backend_port=${3:-3002}
# Later, in place of the unconditional args+=(--port ...) line:
if [[ $# -ge 3 ]]; then
  args+=(--port "$backend_port")
fi
```

Do not change `packaging/rpm/tests/previous-package.sh:50`: `${PORT:-3000}` is intentionally the preceding package's default, and the upgraded configured installation must preserve it. Do not change `packaging/rpm/tests/upgrade-scriptlets.py`'s `3000` ownership/deletion fixtures or its stock `ntop_port_t` conflict fixture: they verify legacy state and no relabeling. Do not change the application development ports in `.github/workflows/e2e-ui-tests.yml:96`.

These shell fixture changes are required plan content. They have been inspected but not applied or executed in a live RPM/systemd host by this subagent.

In `.github/workflows/build-rpm.yml`, change `topology.sh bundled nginx 3003` to `topology.sh bundled nginx` so the fresh-install job genuinely exercises the new default. Keep explicit custom-port coverage in the CLI tests and lifecycle tests.

Exact repository files and current lines:

- `packaging/rpm/README.md:106`: new-install dotenv example `PORT=3002`.
- `packaging/rpm/README.md:161`: remove explicit `--port 3000` from the fresh default example (or explicitly choose `--port 3002`).
- `packaging/rpm/README.md:165`: fresh RPM default **3002**; include that saved/legacy ports remain unchanged.
- `packaging/rpm/README.md:187`: fresh install diagnostic URL `http://localhost:3002/server`.
- `packaging/rpm/README.md:233`: example `set-port 3002`.
- `packaging/rpm/man/heimdall-server.8.md:19`: fresh RPM default 3002.
- `packaging/rpm/man/heimdall-server.8.md:255`: saved PORT wins, fresh RPM fallback 3002, configured legacy implicit 3000 retained.
- `packaging/rpm/man/heimdall-server.8.md:261`: fresh install `--port 3002` example.
- `packaging/rpm/man/heimdall-server-backend.env.5.md:38`: `**PORT**=_3002_`.
- `packaging/rpm/BUILD.md:54`: fresh diagnostic endpoint `http://127.0.0.1:3002`.
- `packaging/rpm/security/SECURITY.md:32`: fresh RPM listen default TCP 3002.
- `packaging/rpm/selinux/heimdall_server.te:49`: comment only, default 3002. No security-policy changes are needed; setup registers only its selected port.
- `packaging/rpm/heimdall-Caddyfile:12`: reference upstream `127.0.0.1:3002`; the active Caddyfile is rendered dynamically, but the shipped reference must match fresh defaults.
- Patch member `README.md:53`: say saved PORT wins; fresh RPM 3002; standalone/configured legacy 3000. Keep the following explicit `--port 3000` override example, and note all values remain subject to listener/SELinux checks.
- Patch member `internal/cmd/setup.go:104` and its flag help: exact replacement given above.

Keep `internal/cmd/schema.go`'s shared PORT default 3000. It is also used by standalone CLI. Its description may mention the fresh RPM default without changing its shared default. Keep the historical changelog entries at `packaging/rpm/heimdall-server.spec:759,783`. Keep old Caddyfile/backup/restore fixtures and tests explicitly setting 3000: they prove existing settings remain supported.

- [ ] **Step 5: Verify resolution, compatibility and patch export.**

```bash
go test ./internal/cmd -run '^TestSetup(RPMDefault|BackendPort)' -count=1
go test ./...
go test -tags functional ./internal/cmd
cd "$rpm_plan_root"
bash -n packaging/rpm/tests/topology.sh packaging/rpm/tests/lifecycle.sh \
  packaging/rpm/tests/features.sh packaging/rpm/tests/coexistence.sh packaging/rpm/tests/remote-database.sh
rg -n '3000|3001|3002' packaging/rpm
```

Expected: new defaults and preserved legacy/explicit settings pass; every remaining 3000/3001 occurrence is an intentional legacy, conflict or standalone case. Real no-override setup under each supported stock policy remains Task 13 acceptance, not a mock-derived claim.

- [ ] **Step 6: Commit the coordinated default change.** Regenerate/apply-check the CLI patch first.

```bash
git add packaging/rpm/heimdall-cli-nginx.patch packaging/rpm/heimdall-backend.env \
  packaging/rpm/heimdall-Caddyfile packaging/rpm/README.md packaging/rpm/BUILD.md \
  packaging/rpm/security/SECURITY.md packaging/rpm/selinux/heimdall_server.te \
  packaging/rpm/man/heimdall-server.8.md packaging/rpm/man/heimdall-server-backend.env.5.md \
  packaging/rpm/tests/topology.sh packaging/rpm/tests/lifecycle.sh \
  packaging/rpm/tests/features.sh packaging/rpm/tests/coexistence.sh \
  packaging/rpm/tests/remote-database.sh .github/workflows/build-rpm.yml
git commit -m "fix(rpm): use a free fresh backend default and retain saved ports"
```



## Task 6: Open the selected Caddy public port and preserve rollback (F6)

**Files:** Modify `packaging/rpm/heimdall-cli-nginx.patch`, `packaging/rpm/security/SECURITY.md`; patched CLI `internal/cmd/firewall.go`, `firewall_test.go`, `setup.go`, `set_port.go`.

**Interfaces:** Change `SetupRunner.configureFirewall(port, mode, previousPort, externalURL string) (undo func() error, err error)`. Both production callers must pass the saved `EXTERNAL_URL`. Reuse `validateBackendPort(value string, env map[string]string) error` in set-port before mutation.

- [ ] **Step 1: Add the regression.**

Add `fmt` to `firewall_test.go` imports and these tests:

```go
func TestCaddyCustomPublicPortForSetupAndSetPort(t *testing.T) {
    for _, command := range []string{"setup", "set-port"} {
        t.Run(command, func(t *testing.T) {
            r, exec := firewallFixture(t, "bundled")
            r.Env.(*FakeEnvManager).Env["EXTERNAL_URL"] = "https://heimdall.example.test:8443"
            backend := "3210"
            if command == "setup" {
                require.NoError(t, firewallSetup(t, r))
            } else {
                backend = "3456"
                require.NoError(t, firewallSetPort(r, backend))
            }
            ledger, err := r.FS.ReadFile(r.Paths.ConfigDir+"/firewalld-ports")
            require.NoError(t, err)
            for _, scope := range []string{"runtime", "permanent"} {
                assert.True(t, exec.rules[scope+" public 8443/tcp"])
                assert.False(t, exec.rules[scope+" public "+backend+"/tcp"])
                assert.Contains(t, string(ledger), scope+" public 8443/tcp\n")
            }
            before := maps.Clone(exec.rules)
            require.NoError(t, firewallSetup(t, r))
            assert.Equal(t, before, exec.rules)
        })
    }
}

func TestCaddyCustomPublicPortOwnership(t *testing.T) {
    for _, preexisting := range []bool{false, true} {
        t.Run(fmt.Sprint(preexisting), func(t *testing.T) {
            r, exec := firewallFixture(t, "bundled")
            r.Env.(*FakeEnvManager).Env["EXTERNAL_URL"] = "https://heimdall.example.test:8443"
            if preexisting {
                exec.rules["runtime public 8443/tcp"] = true
                exec.rules["permanent public 8443/tcp"] = true
            }
            exec.rules["runtime dmz 9000/tcp"] = true
            require.NoError(t, firewallSetup(t, r))
            require.NoError(t, firewallSetup(t, r, "--external-url=https://heimdall.example.test:9443"))
            for _, scope := range []string{"runtime", "permanent"} {
                assert.Equal(t, preexisting, exec.rules[scope+" public 8443/tcp"])
                assert.True(t, exec.rules[scope+" public 9443/tcp"])
            }
            assert.True(t, exec.rules["runtime dmz 9000/tcp"])
        })
    }
}

func TestCaddyCustomPublicPortFirewallFailureRollsBack(t *testing.T) {
    for _, failure := range []string{"firewall", "ledger", "restart"} {
        t.Run(failure, func(t *testing.T) {
            r, exec := firewallFixture(t, "bundled")
            r.Env.(*FakeEnvManager).Env["EXTERNAL_URL"] = "https://heimdall.example.test:8443"
            exec.rules["runtime dmz 9000/tcp"] = true
            before := maps.Clone(exec.rules)
            switch failure {
            case "firewall": exec.failure = "--permanent --add-port=8443/tcp"
            case "ledger": r.FS.(*securityFS).failRename = true
            case "restart": r.Systemd = &portFailureSystemd{
                FakeSystemdRunner: r.Systemd.(*FakeSystemdRunner), failure: "restart",
            }
            require.Error(t, firewallSetPort(r, "3456"))
            assert.Equal(t, before, exec.rules)
            assert.Equal(t, "3210", r.Env.(*FakeEnvManager).Env["PORT"])
            assert.False(t, r.FS.Exists(r.Paths.ConfigDir+"/firewalld-ports"))
        })
    }
}

func TestSetPortRejectsStoppedProxyPublicPort(t *testing.T) {
    r, exec := firewallFixture(t, "bundled")
    r.Env.(*FakeEnvManager).Env["EXTERNAL_URL"] = "https://heimdall.example.test:8443"
    require.ErrorContains(t, firewallSetPort(r, "8443"), "reserved for the selected proxy")
    assert.Empty(t, exec.rules)
    assert.Equal(t, "3210", r.Env.(*FakeEnvManager).Env["PORT"])
    assert.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
}
```

- [ ] **Step 2: Confirm the regression fails on the original behavior.**

```bash
cd "$rpm_plan_topdir/heimdall-cli-build"
go test ./internal/cmd -run 'TestCaddyCustom|TestSetPortRejectsStopped'
```

Expected: custom 8443 rules are absent, transition/rollback expectations fail, and stopped-proxy collision is accepted.

- [ ] **Step 3: Apply the minimal fix.**

Current signature:

```go
func (r *SetupRunner) configureFirewall(port, mode, previousPort string) (undo func() error, err error)
```

Exactly two production callers:

```go
// setup.go, stepSecurityPolicies():
r.rollbackFirewall, err = r.configureFirewall(port, r.ProxyMode, r.previousBackendPort)
// set_port.go, SetPortRunner.Run():
rollbackFirewall, err = firewall.configureFirewall(portStr, env["HEIMDALL_PROXY_MODE"], oldPort)
```

Append the saved external URL, rather than deriving it from an unset field on the SetPort helper:

```go
func (r *SetupRunner) configureFirewall(port, mode, previousPort, externalURL string) (undo func() error, err error)
// stepSecurityPolicies:
r.rollbackFirewall, err = r.configureFirewall(port, r.ProxyMode, r.previousBackendPort, env["EXTERNAL_URL"])
// SetPortRunner.Run:
rollbackFirewall, err = setup.configureFirewall(portStr, env["HEIMDALL_PROXY_MODE"], oldPort, env["EXTERNAL_URL"])
```

Existing test fixtures invoke setup or set-port, not configureFirewall directly. Keep the root-only ledger, exact-rule ownership, zone scans, permanent/runtime separation, and returned undo callback.

### Minimal implementation blocks

Immediately after `managed := mode == "bundled" || mode == "nginx"`, calculate desired public rules. Existing code accepts custom Caddy HTTPS ports in rendering and SELinux setup; do not silently normalize them to 443:

```go
kind, value := "port", port+"/tcp"
if mode == "nginx" {
    kind, value = "service", "https"
} else if mode == "bundled" {
    target, err := validatePublicURL(externalURL)
    if err != nil { return undo, err }
    publicPort := "80"
    if target.Scheme == "https" { publicPort = "443" }
    if target.Port() != "" {
        n, _ := strconv.Atoi(target.Port())
        publicPort = strconv.Itoa(n)
    }
    switch publicPort {
    case "443":
        kind, value = "service", "https"
    case "80":
        kind, value = "service", "http"
    default:
        kind, value = "port", publicPort+"/tcp"
    }
}
desired := map[string]firewallRule{}
for _, scope := range []string{"runtime", "permanent"} {
    rule := firewallRule{scope, zone, kind, value}
    desired[rule.record()] = rule
}
```

Change the owned-rule retention condition from:

```go
if !managed && rule.zone == zone && rule.value == port+"/tcp" { continue }
```

to:

```go
if _, keep := desired[rule.record()]; keep { continue }
```

Replace the rule-construction loop that currently chooses `service=https` for every managed mode:

```go
for _, key := range slices.Sorted(maps.Keys(desired)) {
    rule := desired[key]
    exists, err := present(rule)
    if err != nil { return undo, err }
    if !exists { changes = append(changes, change{rule, true}) }
}
```

The existing add/remove bookkeeping already records newly created `kind == "port"` rules. It will therefore track custom public ports, remove obsolete CLI-owned public rules, retain pre-existing rules, and roll changes back. The three-field ledger stays compatible. Since the ledger now tracks public ports, accept valid 1–65535 TCP ports instead of 1024–65535 when reading it. Keep application `PORT` validation at 1024–65535. Update the malformed-ledger test's `81/tcp` input to `0/tcp`; do not loosen protocol/scope/zone/field-count/ownership checks.

Standard `http`/`https` service rules retain existing non-adoption semantics; this task does not take ownership of administrator rules or rewrite rich rules. Update completion text so custom endpoints are not described as generic port-443 HTTPS.

### Share endpoint collision preflight with set-port

Setup already uses `validateBackendPort(value string, env map[string]string) error` to reject backend/database/proxy port overlap. SetPort currently skips that helper and only detects existing listeners. A stopped proxy is insufficient protection against accepting its public port as the new backend.

Create the existing SetupRunner helper before SELinux mutation with its `DatabaseMode` and `ProxyMode` set from the saved environment, and call `validateBackendPort(portStr, env)` before `configureSELinuxPorts(..., true)`. Reuse that helper later for proxy preparation and configureFirewall. Remove the now-duplicate set-port `checkOwnedPort` and read-only configureSELinuxPorts call. Do not change saved mode resolution or initialize a database during a port change.

The shared helper declaration is:

```go
setup := &SetupRunner{
    Paths: r.Paths, Exec: r.Exec, FS: r.FS, Systemd: r.Systemd, Env: r.Env, Out: r.Out,
    DatabaseMode: env["HEIMDALL_DATABASE_MODE"], ProxyMode: env["HEIMDALL_PROXY_MODE"],
}
if err := setup.validateBackendPort(portStr, env); err != nil { return err }
```

Use `setup.prepareBundledNginx(candidate)` / `setup.prepareBundledCaddy(candidate)` in the existing branch and `setup.configureFirewall(portStr, env["HEIMDALL_PROXY_MODE"], oldPort, env["EXTERNAL_URL"])` at the firewall call. Remove the inner setup declaration and later firewall-only SetupRunner declaration. Remove the now-unused `p, _ := strconv.Atoi(portStr)` and `strconv` import. The schema validation at the top remains, and selected SELinux ports are applied once after the shared read-only preflight.

- [ ] **Step 4: Verify the fix and connected behavior.**

```bash
go test ./internal/cmd -run 'TestCaddyCustom|TestManagedProxy|TestBackendFirewall|TestUnownedNonmanaged|TestFirewall|TestSetPort'
go test ./...
```

Expected: all tests pass, including existing unowned-rule and zone tests.

Update SECURITY.md to say “Open the configured managed proxy endpoint; keep the application port private.” Describe `firewalld-ports` as CLI-owned TCP port rules for backend or custom public endpoints. Keep the 443 Nginx restriction. Task 13 verifies 8443 from another host, permanent rules after reboot, and return to 443.
- [ ] **Step 5: Commit the verified change.**

Regenerate and apply-check `packaging/rpm/heimdall-cli-nginx.patch` using the pinned-source commands above.

```bash
git add packaging/rpm/heimdall-cli-nginx.patch packaging/rpm/security/SECURITY.md
git commit -m "fix(rpm): manage the selected public firewall port"
```


## Task 7: Reset passwords through psql stdin with SQL failure checking (F7)

**Files:** Modify `packaging/rpm/heimdall-cli-nginx.patch`; patched CLI `internal/cmd/interfaces.go`, `runtime.go`, `fakes_test.go`, `restore_test.go`, `reset_password.go`, `reset_password_test.go`, `runtime_test.go`.

**Interfaces:** Produces `ExecRunner.RunWithEnvAndStdin(env map[string]string, stdin, name string, args ...string) (stdout string, exitCode int, err error)`. Existing RunWithEnv/RunWithStdin become wrappers. Preserve child-only credentials, preparePGEnv TLS-file cleanup, exit codes and current SQL variable quoting.

- [ ] **Step 1: Add the regression.**

Add to reset_password_test.go:

```go
func TestResetPasswordUsesInputAndPrivateConnectionEnvironment(t *testing.T) {
    exec := &FakeExecRunner{Results: map[string]FakeExecResult{"psql -h": {Stdout: "UPDATE 1"}}}
    env := &FakeEnvManager{Env: map[string]string{"DATABASE_PASSWORD": "db-secret"}}
    runner, _, _ := newResetPasswordRunner(exec, env)
    require.NoError(t, runner.Run("admin+audit@example.com", "aB1!cD2@eF3#gH4$"))
    require.Len(t, exec.Calls, 1)
    call := exec.Calls[0]
    require.Contains(t, call.Stdin, "WHERE email = :'email'")
    require.Contains(t, call.Args, "hash=$2a$14$testhash")
    require.Contains(t, call.Args, "email=admin+audit@example.com")
    require.Contains(t, call.Args, "-X")
    require.Contains(t, call.Args, "ON_ERROR_STOP=1")
    require.NotContains(t, call.Args, "-tAc")
    require.Equal(t, "db-secret", call.Env["PGPASSWORD"])
    require.NotContains(t, strings.Join(call.Args, " "), "db-secret")
}
```

Add `strings` import. Existing psql exit-1 and missing-user tests remain relevant and must pass.

Update the existing TestRealRPMClientRouting shell fixture in runtime_test.go so it recognizes the new stdin path rather than returning generic success. Replace its `*UPDATE*) echo 'UPDATE 1' ;;` case with:

```sh
 *-tA*)
  input=$(cat)
  case "$input" in
   *"UPDATE \"Users\" SET"*) echo 'UPDATE 1' ;;
   *) exit 97 ;;
  esac ;;
```

The table-count query uses separate `-t`, `-A`, so it retains its earlier information_schema branch. Keep the fixture's password-in-argv rejection and TLS material readability/cleanup checks.

Add to runtime_test.go:

```go
func TestRealExecRunnerCombinesInputAndPrivateTLS(t *testing.T) {
    skipIfWindows(t)
    pem := "-----BEGIN CERTIFICATE-----\nfixture\n-----END CERTIFICATE-----\n"
    env := map[string]string{"PGPASSWORD": "test-secret", "PGSSLROOTCERT": pem}
    out, code, err := (&execRunner{}).RunWithEnvAndStdin(env, "SQL input\n", "sh", "-c",
        `test "$PGPASSWORD" = test-secret && test -f "$PGSSLROOTCERT" || exit 91; printf '%s\n' "$PGSSLROOTCERT"; cat`)
    require.NoError(t, err)
    require.Zero(t, code)
    path, payload, ok := strings.Cut(out, "\n")
    require.True(t, ok)
    require.Equal(t, "SQL input\n", payload)
    _, err = os.Stat(path)
    require.True(t, os.IsNotExist(err))
    require.Equal(t, pem, env["PGSSLROOTCERT"])
}
```

- [ ] **Step 2: Confirm the regression fails on the original behavior.**

```bash
cd "$rpm_plan_topdir/heimdall-cli-build"
go test ./internal/cmd -run 'TestResetPassword|TestRealExecRunner|TestRealRPMClientRouting'
```

Expected: the new interface is missing; after adding its adapter, reset still fails the stdin assertion until its invocation changes. Actual PostgreSQL has already demonstrated the colon syntax failure with -c.

- [ ] **Step 3: Apply the minimal fix.**

Add to `internal/cmd/interfaces.go`:

```go
RunWithEnvAndStdin(env map[string]string, stdin, name string, args ...string) (stdout string, exitCode int, err error)
```

In `runtime.go`, rename the existing RunWithEnv implementation to RunWithEnvAndStdin, add `c.Stdin = strings.NewReader(stdin)` immediately after exec.Command, and keep its existing `preparePGEnv`, child environment, CombinedOutput, exit-code, and cleanup logic. Replace the two wrappers with:

```go
func (r *execRunner) RunWithEnv(env map[string]string, name string, args ...string) (string, int, error) {
    return r.RunWithEnvAndStdin(env, "", name, args...)
}
func (r *execRunner) RunWithStdin(stdin, name string, args ...string) (string, int, error) {
    return r.RunWithEnvAndStdin(nil, stdin, name, args...)
}
```

`preparePGEnv` materializes inline certificate/key PEM; it does not remove PGPASSWORD. Keep credentials in the child environment, never `env PGPASSWORD=...` command arguments.

In `fakes_test.go` add:

```go
func (f *FakeExecRunner) RunWithEnvAndStdin(env map[string]string, stdin, name string, args ...string) (string, int, error) {
    out, code, err := f.RunWithEnv(env, name, args...)
    f.Calls[len(f.Calls)-1].Stdin = stdin
    return out, code, err
}
```

The only other direct ExecRunner implementation is recoveryExec in `restore_test.go`; other specialized executors embed one of these. Add its intentionally unsupported method:

```go
func (e *recoveryExec) RunWithEnvAndStdin(map[string]string, string, string, ...string) (string, int, error) {
    return "", 1, fmt.Errorf("unexpected stdin command")
}
```

Change the reset invocation, preserving the current SQL string and psql argument order used by existing fake tests:

```go
stdout, code, err := r.Exec.RunWithEnvAndStdin(pgEnv, sql+"\n", binary,
    "-h", dbCfg.Host, "-p", dbCfg.PortStr(), "-U", dbCfg.User,
    "-d", dbCfg.DBName, "-X", "-v", "ON_ERROR_STOP=1",
    "-v", "hash="+hashed, "-v", "email="+email, "-tA",
)
```

`-X` prevents psqlrc from changing the operation; `ON_ERROR_STOP=1` is essential because stdin SQL errors otherwise need not produce a failing process exit. Retain `UPDATE 0` detection, database failure handling, and no generated-password success output on failure.

- [ ] **Step 4: Verify the fix and connected behavior.**

```bash
go test ./internal/cmd -run 'TestResetPassword|TestRealExecRunner|TestRealRPMClientRouting|TestRecovery'
go test ./...
go test -tags functional ./internal/cmd
```

Expected: all tests pass; child TLS files are readable during execution and removed afterward. Missing accounts and SQL errors return failure without a generated-password success message.

Task 13 includes a real CLI reset against both bundled and external databases plus application login. Keep that gate: a fake returning `UPDATE 1` did not catch this defect.
- [ ] **Step 5: Commit the verified change.**

Regenerate and apply-check `packaging/rpm/heimdall-cli-nginx.patch` using the pinned-source commands above.

```bash
git add packaging/rpm/heimdall-cli-nginx.patch
git commit -m "fix(rpm): reset passwords through checked psql input"
```


## Task 8: Enforce multipart upload size at the actual interceptor (F8)

**Files:** Modify `apps/backend/src/evaluations/evaluations.module.ts`, `evaluations.controller.ts`, `apps/backend/src/main.ts`; create `apps/backend/src/evaluations/evaluations.upload.spec.ts`; update the MAX_FILE_UPLOAD_SIZE description in `packaging/rpm/man/heimdall-server-backend.env.5.md`.

**Interfaces:** Consumes existing ConfigService.get(key). Registers Multer options `{limits: {files: 100, fileSize: bytes}}` in EvaluationsModule. Route uses `AnyFilesInterceptor()` so it inherits the complete limits object. No new helper file or dependency.

- [ ] **Step 1: Add the regression.**

```ts
import 'reflect-metadata';
import {Readable} from 'node:stream';
import {DynamicModule, ExecutionContext, FactoryProvider, NestInterceptor, PayloadTooLargeException} from '@nestjs/common';
import {INTERCEPTORS_METADATA, MODULE_METADATA} from '@nestjs/common/constants';
import {MulterModule} from '@nestjs/platform-express';
import {MULTER_MODULE_OPTIONS} from '@nestjs/platform-express/multer/files.constants';
import {of} from 'rxjs';
import {describe, expect, it, vi} from 'vitest';
import {EvaluationsController} from './evaluations.controller';
import {EvaluationsModule} from './evaluations.module';

function uploadOptions(raw: string | undefined) {
  const imports: DynamicModule[] = Reflect.getMetadata(MODULE_METADATA.IMPORTS, EvaluationsModule);
  const registration = imports.find(item => item.module === MulterModule);
  expect(registration, 'EvaluationsModule must register upload options').toBeDefined();
  const provider = registration!.providers!.find(item =>
    (item as FactoryProvider).provide === MULTER_MODULE_OPTIONS
  ) as FactoryProvider;
  return provider.useFactory({get: (key: string) => key === 'MAX_FILE_UPLOAD_SIZE' ? raw : undefined});
}

async function parseFiles(sizes: number[], raw: string | undefined = '1') {
  const interceptors = Reflect.getMetadata(INTERCEPTORS_METADATA, EvaluationsController.prototype.create);
  const UploadInterceptor = interceptors[0] as new (options: unknown) => NestInterceptor;
  const interceptor = new UploadInterceptor(await uploadOptions(raw));
  const boundary = 'heimdall-upload-test';
  const parts: Buffer[] = [];
  sizes.forEach((size, index) => {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${index}.json"\r\nContent-Type: application/json\r\n\r\n`));
    parts.push(Buffer.alloc(size, 0x20), Buffer.from('\r\n'));
  });
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(parts);
  const request = Object.assign(Readable.from(body), {
    method: 'POST',
    headers: {'content-type': `multipart/form-data; boundary=${boundary}`, 'content-length': String(body.length)}
  });
  const context = {switchToHttp: () => ({getRequest: () => request, getResponse: () => ({})})} as unknown as ExecutionContext;
  const next = {handle: vi.fn(() => of(null))};
  try {
    await interceptor.intercept(context, next);
  } catch (error) {
    expect(next.handle).not.toHaveBeenCalled();
    throw error;
  }
  expect(next.handle).toHaveBeenCalledOnce();
}

describe('evaluation upload limits', () => {
  it('uses a 50 MiB default and retains the 100-file limit', async () => {
    expect(await uploadOptions(undefined)).toMatchObject({limits: {files: 100, fileSize: 50 * 1024 * 1024}});
  });
  it('accepts multiple files below the configured cap', async () => {
    await parseFiles([1024 * 1024 - 1, 16]);
  });
  it.each([1024 * 1024, 2 * 1024 * 1024])('rejects a file of %s bytes at or over Multer’s cap', async size => {
    await expect(parseFiles([size])).rejects.toBeInstanceOf(PayloadTooLargeException);
  });
  it('rejects a 101st file', async () => {
    await expect(parseFiles(Array(101).fill(1))).rejects.toThrow('Too many files');
  });
  it.each(['', '0', '-1', '1.5', 'NaN', 'Infinity', '999999999999999999999'])('rejects invalid size %j', raw => {
    expect(() => uploadOptions(raw)).toThrow('MAX_FILE_UPLOAD_SIZE');
  });
});
```

- [ ] **Step 2: Confirm the regression fails on the original behavior.**

```bash
yarn backend test:ci src/evaluations/evaluations.upload.spec.ts
```

Expected: the module lacks effective upload options. The independent current-route probe accepted 2 MiB under a 1 MiB setting.

- [ ] **Step 3: Apply the minimal fix.**

For F8,import `MulterModule` from `@nestjs/platform-express` and `ConfigService` into `evaluations.module.ts`. Add this dynamic module to the existing module's `imports` array:

```ts
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const raw = config.get('MAX_FILE_UPLOAD_SIZE') ?? '50';
        const size = Number(raw);
        const bytes = size * 1024 * 1024;
        if (!/^[0-9]+$/.test(raw) || size <= 0 || !Number.isSafeInteger(bytes)) {
          throw new Error('MAX_FILE_UPLOAD_SIZE must be a positive integer in MiB');
        }
        return {limits: {files: 100, fileSize: bytes}};
      }
    }),
```

Change the controller decorator to `AnyFilesInterceptor()` and delete the unused standalone `multer(...)` call/import from `main.ts`. Nest shallow-merges module and route options; leaving the current route `{limits:{files:100}}` would silently overwrite `fileSize`. The installed Multer/Busboy rejects files **at or above** its byte cap, which the boundary test below explicitly records. Document the cap as an exclusive byte bound consistent with the installed parser; do not claim inclusive behavior.
Use this manual text: “Positive integer MiB per file; default 50. Files reaching the configured byte cap are rejected with HTTP 413. A request accepts at most 100 files.”

- [ ] **Step 4: Verify the fix and connected behavior.**

```bash
yarn backend test:ci src/evaluations/evaluations.upload.spec.ts
yarn backend build
```

Expected: sub-cap files pass, at/above-cap files return PayloadTooLargeException, 101 files fail, invalid config fails on initialization.


- [ ] **Step 5: Commit the verified change.**

```bash
git add apps/backend/src/main.ts apps/backend/src/evaluations/evaluations.module.ts apps/backend/src/evaluations/evaluations.controller.ts apps/backend/src/evaluations/evaluations.upload.spec.ts packaging/rpm/man/heimdall-server-backend.env.5.md
git commit -m "fix(backend): enforce configured multipart file size"
```


## Task 9: Exclude a departing administrator from owner replacement (F9)

**Files:** Modify `apps/backend/src/groups/groups.service.ts`; create `apps/backend/src/groups/groups.owner.spec.ts`; verify existing `groups.service.spec.ts` and `apps/backend/src/users/users.service.spec.ts`.

**Interfaces:** Keeps `ensureGroupHasOwner`, `removeUserFromGroup`, and `updateGroupUserRole` signatures. Candidate administrators exclude the departing user in both configured-email and fallback queries. Keeping owner role does not invoke replacement.

- [ ] **Step 1: Add the regression.**

```ts
import {Op} from 'sequelize';
import {afterEach, expect, it, vi} from 'vitest';
import {GroupUser} from '../group-users/group-user.model';
import {User} from '../users/user.model';
import {Group} from './group.model';
import {GroupsService} from './groups.service';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

type Admin = {id: string; role: string; email: string};
type Membership = {userId: string; role: string; update: (change: {role: string}) => Promise<Membership>};

function fixture(withReplacement: boolean, configured = 'departing@example.test') {
  vi.stubEnv('ADMIN_EMAIL', configured);
  const departing: Admin = {id: '1', role: 'admin', email: 'departing@example.test'};
  const admins = [departing];
  if (withReplacement) admins.push({id: '2', role: 'admin', email: 'other@example.test'});
  const members = new Map<string, Membership>();
  const addMember = (id: string, role: string) => {
    const member: Membership = {userId: id, role, update: async change => Object.assign(member, change)};
    members.set(id, member);
  };
  addMember(departing.id, 'owner');

  vi.spyOn(GroupUser, 'findOne').mockImplementation(async options => {
    const where = options!.where as {userId?: string | {[Op.ne]: string}; role?: string};
    const member = [...members.values()].find(item =>
      (!where.role || item.role === where.role) &&
      (typeof where.userId === 'string' ? item.userId === where.userId : item.userId !== where.userId?.[Op.ne])
    );
    return (member || null) as unknown as GroupUser | null;
  });
  const users = {findOne: vi.fn(async ({where}: {where: {email?: string; id?: {[Op.ne]: string}}}) =>
    admins.find(admin => (!where.email || admin.email === where.email) && admin.id !== where.id?.[Op.ne]) || null
  )};
  const group = {
    id: '10',
    $add: vi.fn(async (_relation: string, admin: Admin, options: {through: {role: string}}) => addMember(admin.id, options.through.role)),
    $remove: vi.fn(async (_relation: string, user: Admin) => members.delete(user.id))
  };
  const service = new GroupsService({} as typeof Group, users as unknown as typeof User);
  return {service, group: group as unknown as Group, departing: departing as unknown as User, members};
}

it.each(['departing@example.test', 'missing@example.test'])('does not choose the departing admin as replacement with configured email %s', async configured => {
  const {service, group, departing, members} = fixture(true, configured);
  await service.removeUserFromGroup(group, departing);
  expect(members.has('1')).toBe(false);
  expect(members.get('2')?.role).toBe('owner');
});

it('preserves the sole administrator membership if no replacement exists', async () => {
  const {service, group, departing, members} = fixture(false);
  await expect(service.removeUserFromGroup(group, departing)).rejects.toThrow('No admin to be promoted');
  expect(members.get('1')?.role).toBe('owner');
});

it('demotes the departing administrator only after assigning another owner', async () => {
  const {service, group, members} = fixture(true);
  await service.updateGroupUserRole(group, {userId: '1', groupRole: 'member'});
  expect(members.get('1')?.role).toBe('member');
  expect(members.get('2')?.role).toBe('owner');
});


it('allows the sole administrator to retain their owner role', async () => {
  const {service, group, members} = fixture(false);
  await service.updateGroupUserRole(group, {userId: '1', groupRole: 'owner'});
  expect(members.get('1')?.role).toBe('owner');
});
```

- [ ] **Step 2: Confirm the regression fails on the original behavior.**

```bash
yarn backend test:ci src/groups/groups.owner.spec.ts
```

Expected: removing/demoting the default admin loses the owner, and sole-admin removal is incorrectly allowed.

- [ ] **Step 3: Apply the minimal fix.**

Use the existing `Op` import and change the two candidate queries and the role-update guard:

```ts
const admin =
  (await this.userModel.findOne({
    where: {role: 'admin', email: appConfig.getDefaultAdmin(), id: {[Op.ne]: userId}}
  })) ||
  (await this.userModel.findOne({
    where: {role: 'admin', id: {[Op.ne]: userId}},
    order: [['id', 'ASC']]
  }));
```

```ts
if (groupUser && updateGroupUser.groupRole !== 'owner') {
  await this.ensureGroupHasOwner(group, groupUser);
}
return groupUser?.update({role: updateGroupUser.groupRole});
```

Retain the existing promotion/addition branch and `ForbiddenException('No admin to be promoted')`. The users service also calls this guard during user deletion; run its integration suite. No new transaction/locking architecture is justified by this single-operation defect.

- [ ] **Step 4: Verify the fix and connected behavior.**

```bash
yarn backend test:ci src/groups/groups.owner.spec.ts
yarn backend build
```

Expected: all focused cases pass. Run existing database-backed groups/users suites only in Task 13’s disposable database.


- [ ] **Step 5: Commit the verified change.**

```bash
git add apps/backend/src/groups/groups.service.ts apps/backend/src/groups/groups.owner.spec.ts
git commit -m "fix(backend): preserve group ownership when an admin leaves"
```


## Task 10: Await all tag deletions before committing evaluation removal (F10)

**Files:** Modify `apps/backend/src/evaluations/evaluations.service.ts`; create `apps/backend/src/evaluations/evaluations.transaction.spec.ts`.

**Interfaces:** Keeps `EvaluationsService.remove(id: string)` and its managed transaction. Every tag.destroy and evaluation.destroy receives the same transaction; Promise.all consumes the mapped promises directly.

- [ ] **Step 1: Add the regression.**

```ts
import {setImmediate} from 'node:timers/promises';
import {expect, it, vi} from 'vitest';
import {DatabaseService} from '../database/database.service';
import {Evaluation} from './evaluation.model';
import {EvaluationsService} from './evaluations.service';

it('waits for tag deletion before deleting the evaluation and committing', async () => {
  let release!: () => void;
  const pendingTag = new Promise<void>(resolve => { release = resolve; });
  const events: string[] = [];
  const transaction = {};
  const tag = {destroy: vi.fn(async () => { await pendingTag; events.push('tag'); })};
  const evaluation = {evaluationTags: [tag], destroy: vi.fn(async () => { events.push('evaluation'); })};
  const database = {sequelize: {transaction: async (callback: (value: object) => Promise<unknown>) => {
    await callback(transaction);
    events.push('commit');
  }}};
  const model = {findByPk: async () => evaluation};
  const service = new EvaluationsService(model as unknown as typeof Evaluation, database as unknown as DatabaseService);
  const removal = service.remove('1');
  let pendingEvents: string[] = [];
  try {
    await setImmediate();
    pendingEvents = [...events];
  } finally {
    release();
    await removal;
  }
  expect(pendingEvents).toEqual([]);
  expect(events).toEqual(['tag', 'evaluation', 'commit']);
  expect(tag.destroy).toHaveBeenCalledWith({transaction});
  expect(evaluation.destroy).toHaveBeenCalledWith({transaction});
});

it('does not delete the evaluation or commit when tag deletion rejects', async () => {
  const failure = new Error('tag deletion failed');
  const evaluation = {
    evaluationTags: [{destroy: async () => { throw failure; }}],
    destroy: vi.fn()
  };
  const commit = vi.fn();
  const database = {sequelize: {transaction: async (callback: (value: object) => Promise<unknown>) => {
    const result = await callback({});
    commit();
    return result;
  }}};
  const model = {findByPk: async () => evaluation};
  const service = new EvaluationsService(model as unknown as typeof Evaluation, database as unknown as DatabaseService);
  await expect(service.remove('1')).rejects.toBe(failure);
  expect(evaluation.destroy).not.toHaveBeenCalled();
  expect(commit).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Confirm the regression fails on the original behavior.**

```bash
yarn backend test:ci src/evaluations/evaluations.transaction.spec.ts
```

Expected: the parent delete/commit is observed before the delayed tag resolves; a rejected tag does not reject the removal correctly.

- [ ] **Step 3: Apply the minimal fix.**

Replace only the nested-array await with:

```ts
        await Promise.all(
          evaluation.evaluationTags.map((evaluationTag) =>
            evaluationTag.destroy({transaction})
          )
        );
```
Leave the existing nullable-tags guard, evaluation.destroy, and transaction boundary intact.

- [ ] **Step 4: Verify the fix and connected behavior.**

```bash
yarn backend test:ci src/evaluations/evaluations.transaction.spec.ts
yarn backend build
```

Expected: event order is tag → evaluation → commit, and tag failures prevent successful parent deletion/commit. No unhandled promise rejection remains.


- [ ] **Step 5: Commit the verified change.**

```bash
git add apps/backend/src/evaluations/evaluations.service.ts apps/backend/src/evaluations/evaluations.transaction.spec.ts
git commit -m "fix(backend): await tag deletion within evaluation transaction"
```


## Task 11: Report trust-store rebuild failures accurately (F11)

**Files:** Modify `packaging/rpm/heimdall-cli-nginx.patch`; patched CLI `internal/cmd/add_cert.go`, `internal/cmd/add_cert_test.go`.

**Interfaces:** Consumes existing runChecked(ExecRunner, command, args...) error. Keeps AddCertRunner.Run(certPath string) error and retains the copied anchor for retry; no new rollback of system trust bundles.

- [ ] **Step 1: Add the regression.**

Add `fmt` to the test imports and this table test:

```go
func TestAddCertTrustFailureStopsConfiguration(t *testing.T) {
    for _, result := range []FakeExecResult{
        {ExitCode: 1, Stdout: "could not rebuild trust"},
        {Err: fmt.Errorf("could not execute update-ca-trust")},
    } {
        r, exec, env, fs, out := newAddCertRunner()
        fs.Files["/tmp/corporate.pem"] = []byte("certificate")
        exec.Results["update-ca-trust"] = result
        require.Error(t, r.Run("/tmp/corporate.pem"))
        require.NotContains(t, out.String(), "System trust store updated")
        require.Empty(t, env.Env["NODE_EXTRA_CA_CERTS"])
    }
}
```

- [ ] **Step 2: Confirm the regression fails on the original behavior.**

```bash
cd "$rpm_plan_topdir/heimdall-cli-build"
go test ./internal/cmd -run TestAddCertTrustFailureStopsConfiguration
```

Expected: exit-code-only failure returns success and writes NODE_EXTRA_CA_CERTS on the reviewed code.

- [ ] **Step 3: Apply the minimal fix.**

Replace the unchecked update-ca-trust conditional with:

```go
if err := runChecked(r.Exec, "update-ca-trust"); err != nil {
    return fmt.Errorf("updating system trust store: %w", err)
}
fmt.Fprintln(r.Out, "System trust store updated.")
```

- [ ] **Step 4: Verify the fix and connected behavior.**

```bash
go test ./internal/cmd -run TestAddCert
go test ./...
go test -tags functional ./internal/cmd
```

Expected: nonzero and execution-error cases fail clearly, no success message/config mutation occurs, and existing successful installation still passes.


- [ ] **Step 5: Commit the verified change.**

Regenerate and apply-check `packaging/rpm/heimdall-cli-nginx.patch` using the pinned-source commands above.

```bash
git add packaging/rpm/heimdall-cli-nginx.patch
git commit -m "fix(rpm): fail certificate installation when trust update fails"
```

## Task 12: Run the existing omitted safety fixtures in CI

**Files:** Modify `.github/workflows/build-rpm.yml`. Reuse `packaging/rpm/tests/guards.sh`, `host-build-args.py`, and `remote-readiness.py` unchanged.

**Interfaces:** The fixture scripts exit nonzero on regression. Run them after checkout in `lifecycle-test`, on the Ubuntu runner with Docker and `shasum`, before downloading/building application artifacts. No new test framework or dependency.

- [ ] **Step 1: Confirm the current CI gap.**

```bash
rg -n 'guards.sh|host-build-args.py|remote-readiness.py' .github/workflows/build-rpm.yml
```

Expected before the change: no matches, although all three files exist and pass independently.

- [ ] **Step 2: Add this step immediately after lifecycle-test’s checkout.**

```yaml
      - name: Verify host-runner guards and readiness fixtures
        run: |
          bash packaging/rpm/tests/guards.sh
          python3 packaging/rpm/tests/host-build-args.py
          python3 packaging/rpm/tests/remote-readiness.py
```

Do not place this step in the minimal Rocky build container without its prerequisites; the fixtures test host orchestration, including `shasum` and process-substitution paths.

- [ ] **Step 3: Run the same commands on Linux.**

```bash
bash packaging/rpm/tests/guards.sh
python3 packaging/rpm/tests/host-build-args.py
python3 packaging/rpm/tests/remote-readiness.py
git diff --check
```

Expected: guards reject unsafe fixture invocation, both architecture build-argument cases pass, and delayed/failed/wrong-result database readiness cases pass with cleanup.

- [ ] **Step 4: Commit.**

```bash
git add .github/workflows/build-rpm.yml
git commit -m "test(rpm): run host guard and readiness fixtures in CI"
```

## Task 13: Qualify the complete candidate and record remaining release gates

**Files:** Create `docs/superpowers/reports/2026-10-15-rpm-remediation-acceptance.md` at execution time. Update the acceptance-status text in `packaging/rpm/BUILD.md` only when new evidence supports it. Add the real reset regression below as `packaging/rpm/tests/reset-password.sh`, and invoke it from `topology.sh` after the final application-ready check.

**Interfaces:** Consumes the integrated candidate commit, the regenerated pinned CLI patch, signed candidate RPM/SRPM files and their matching public test key. Test keys remain disposable. Existing `run-lifecycle.sh PLATFORM INITIAL_RPM UPGRADE_RPM` consumes `RPM_TEST_GPG_KEY` and optional `RPM_TEST_PREVIOUS_RPM`. Existing fixtures are destructive and require dedicated hosts/databases.

Each acceptance step is a separate checkpoint; do not combine failures into one “tests passed” statement. Long builds/host runs naturally exceed a small code-edit step.

- [ ] **Step 1: Add an actual password reset/application-login regression.** Create `packaging/rpm/tests/reset-password.sh` with this content. It runs on the disposable topology fixture, which already created `rpm-test@example.invalid`. Its known password is only a fixture value. It restores the previous hash so subsequent readiness checks still work.

```bash
#!/bin/bash
set -euo pipefail
[[ ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || exit 64
[[ -e /.dockerenv ]] || exit 64
umask 077
source /etc/heimdall-server/backend.env
runtime=/usr/libexec/heimdall-server/runtime
scratch=$(mktemp -d)
export PGPASSWORD="$DATABASE_PASSWORD" PGCONNECT_TIMEOUT=5
pg=("$runtime/postgresql/bin/psql" -X -v ON_ERROR_STOP=1 -At
  -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USERNAME" -d "$DATABASE_NAME")
query() { "${pg[@]}" -c "$1"; }
email=rpm-test@example.invalid
before=$(query "SELECT \"encryptedPassword\" FROM \"Users\" WHERE email='$email'")
[[ -n $before ]]
others=$(query "SELECT md5(COALESCE(string_agg(\"encryptedPassword\", ',' ORDER BY id), '')) FROM \"Users\" WHERE email <> '$email'")
restore_hash() {
  result=$?
  "${pg[@]}" -v old_hash="$before" <<'SQL' >/dev/null || result=1
UPDATE "Users" SET "encryptedPassword" = :'old_hash' WHERE email = 'rpm-test@example.invalid';
SQL
  rm -rf "$scratch"
  exit "$result"
}
trap restore_hash EXIT
if heimdall-cli reset-password missing-reset-user@example.invalid </dev/null >"$scratch/missing.log" 2>&1; then exit 1; fi
if grep -q 'New password:' "$scratch/missing.log"; then exit 1; fi
if PGOPTIONS='-c default_transaction_read_only=on' heimdall-cli reset-password "$email" </dev/null >"$scratch/readonly.log" 2>&1; then exit 1; fi
if grep -q 'New password:' "$scratch/readonly.log"; then exit 1; fi
[[ $(query "SELECT \"encryptedPassword\" FROM \"Users\" WHERE email='$email'") == "$before" ]]
heimdall-cli reset-password "$email" --password 'aB1!cD2@eF3#gH4$' </dev/null >"$scratch/reset.log" 2>&1
[[ $(query "SELECT \"encryptedPassword\" FROM \"Users\" WHERE email='$email'") != "$before" ]]
[[ $(query "SELECT (NOT \"forcePasswordChange\" AND \"passwordChangedAt\" IS NOT NULL AND \"updatedAt\" IS NOT NULL) FROM \"Users\" WHERE email='$email'") == t ]]
[[ $(query "SELECT md5(COALESCE(string_agg(\"encryptedPassword\", ',' ORDER BY id), '')) FROM \"Users\" WHERE email <> '$email'") == "$others" ]]
curl --fail --silent --show-error --noproxy '*' -H 'Content-Type: application/json' \
  --data '{"email":"rpm-test@example.invalid","password":"aB1!cD2@eF3#gH4$"}' \
  "http://127.0.0.1:$PORT/authn/login" >"$scratch/login.json"
"$runtime/node/bin/node" - "$scratch/login.json" <<'NODE'
const assert = require('node:assert/strict');
const login = require(process.argv[2]);
assert.equal(typeof login.accessToken, 'string');
assert.ok(login.accessToken.length > 0);
assert.ok(login.userID);
NODE
printf 'PASS actual reset-password, SQL failures, and application login\n'
```

At the end of `topology.sh`, before its final PASS line, add:

```bash
bash /tmp/rpm-tests/reset-password.sh
```

The fixture connections use password auth without TLS; the Go adapter test covers inline TLS material. Real TLS/verify-full database acceptance remains Step 7. Run this script first with the original packaged CLI: it must fail at the successful-reset call with the `psql` colon syntax error. Run it after Task 7: it must pass in both database modes. Do not accept a skipped test because the private psql binary was unavailable.

- [ ] **Step 2: Run all portable package checks and the regenerated CLI suites.**

```bash
bash packaging/rpm/tests/build-python.sh
for fixture in inputs build-shortcuts version-srpm runtime-inputs lifecycle-status download-protocols runtime-extraction upgrade-scriptlets application-readiness cli-acquisition host-build-args remote-readiness; do
  python3 "packaging/rpm/tests/$fixture.py"
done
bash packaging/rpm/tests/setup.sh
bash packaging/rpm/tests/guards.sh
find packaging/rpm -type f -name '*.sh' -exec bash -n {} +
cd "$rpm_plan_topdir/heimdall-cli-build"
go test ./...
go test -tags functional ./internal/cmd
cd "$rpm_plan_root"
git diff --check
```

Run with GNU tar, RPM tools, Go 1.25.8 and the documented Linux prerequisites. Verify the exported patch applies to a fresh copy of `heimdall-cli.ref`, apply it there, and repeat `go test ./...`. Build the CLI and generate man pages from that same patched source. This catches stale patch exports and documentation provenance errors.

- [ ] **Step 3: Run application build, lint, unit and browser suites using isolated fixtures.** Use a disposable checkout and database; the backend suites truncate tables. The existing workflow definitions are the executable fixture recipes:

| Check | Recipe | Required result |
|---|---|---|
| Backend | `.github/workflows/backend-tests.yml` | Build and all tests, including new suites, pass against a fresh migrated PostgreSQL database. |
| Frontend | `.github/workflows/frontend-tests.yml` | All unit tests pass. |
| Converters | `.github/workflows/hdfconverter-tests.yml` | Splunk, SonarQube mock, network-dependent mapping and schema tests pass. |
| InSpec | `.github/workflows/inspecjs-tests.yml` | All tests pass. |
| Browser/application | `.github/workflows/e2e-ui-tests.yml` | Seeded PostgreSQL, LDAP, mock OIDC, Splunk and S3 fixtures pass the Cypress suite. |
| Lint | `.github/workflows/linter.yml` | Strict ESLint invocation passes for affected source and tests; root lint:ci currently suppresses failures with `|| true`. |

After provisioning those workflow fixtures in the disposable environment, the main local commands are:

```bash
yarn install --frozen-lockfile
yarn backend build
yarn backend lint:ci
yarn exec eslint --max-warnings 0 apps/backend/src/main.ts apps/backend/src/config/config.service.ts apps/backend/src/config/config.proxy.spec.ts apps/backend/src/evaluations/evaluations.module.ts apps/backend/src/evaluations/evaluations.controller.ts apps/backend/src/evaluations/evaluations.service.ts apps/backend/src/evaluations/evaluations.upload.spec.ts apps/backend/src/evaluations/evaluations.transaction.spec.ts apps/backend/src/groups/groups.service.ts apps/backend/src/groups/groups.owner.spec.ts
yarn backend test:ci
yarn frontend test:ci
yarn hdf-converters test:ci
yarn inspecjs test:ci
yarn build
```

If strict lint reports pre-existing violations outside the changed lines, preserve the output and classify that baseline explicitly; do not broaden this repair into a style rewrite or report the masked root command as a pass.

Use the E2E workflow’s existing Cypress action with its `yarn start`, `mock-json`, and `mock-openid` commands. Confirm real PostgreSQL rollback for tag-deletion failure and owner preservation for group-member removal, demotion and whole-user deletion. Do not run the fixture’s `.env-ci` copy or migration/seed commands in the user's active checkout/database.

- [ ] **Step 4: Verify the real login limiter under a managed proxy configuration.** On a freshly started disposable application with local login enabled and `HEIMDALL_PROXY_MODE=nginx` (then `bundled`), issue independent forwarded addresses directly through the trusted loopback backend. Each first request must reach authentication; a single address still reaches 429 after 20 attempts.

```bash
source /etc/heimdall-server/backend.env
for client in $(seq 1 21); do
  status=$(curl --silent --output /dev/null --write-out '%{http_code}' \
    --noproxy '*' -H "X-Forwarded-For: 192.0.2.$client" \
    -H 'Content-Type: application/json' \
    --data '{"email":"absent-limit-user@example.invalid","password":"invalid"}' \
    "http://127.0.0.1:$PORT/authn/login")
  [[ $status == 401 ]]
done
for attempt in $(seq 1 21); do
  status=$(curl --silent --output /dev/null --write-out '%{http_code}' \
    --noproxy '*' -H 'X-Forwarded-For: 198.51.100.250' \
    -H 'Content-Type: application/json' \
    --data '{"email":"absent-limit-user@example.invalid","password":"invalid"}' \
    "http://127.0.0.1:$PORT/authn/login")
  if [[ $attempt -le 20 ]]; then [[ $status == 401 ]]; else [[ $status == 429 ]]; fi
done
```

Restart the test service or wait out the one-minute window before repeating the same addresses. The focused Express tests cover IPv4/IPv6 loopback and spoofed remote headers. Additionally complete an OIDC/Tenable session over HTTPS and verify the secure cookie survives the callback; local login alone does not exercise sessions.

- [ ] **Step 5: Build and install all six platform candidates.** After the portable/source checks, commit the new acceptance script and its topology caller so the workflow receives them:

```bash
bash -n packaging/rpm/tests/reset-password.sh packaging/rpm/tests/topology.sh
git add packaging/rpm/tests/reset-password.sh packaging/rpm/tests/topology.sh
git commit -m "test(rpm): cover actual password recovery in topology acceptance"
```

Trigger the existing RPM workflow for that exact branch, then select its matching commit run:

```bash
rpm_candidate_branch=$(git branch --show-current)
rpm_candidate_commit=$(git rev-parse HEAD)
gh workflow run build-rpm.yml --ref "$rpm_candidate_branch"
gh run list --workflow build-rpm.yml --branch "$rpm_candidate_branch" \
  --commit "$rpm_candidate_commit" --event workflow_dispatch --limit 5
```

Set `RPM_RUN_ID` to the run displayed for this candidate, then:

```bash
: "${RPM_RUN_ID:?Set the candidate workflow run ID from the preceding output}"
gh run watch "$RPM_RUN_ID" --exit-status
rpm_artifact_dir=$(mktemp -d /tmp/heimdall-rpm-artifacts.XXXXXX)
gh run download "$RPM_RUN_ID" --dir "$rpm_artifact_dir"
gh run view "$RPM_RUN_ID" --json headSha,conclusion,url,jobs
```

Required jobs: build, clean SRPM rebuild, signed direct DNF install/payload inspection, installed provenance/man pages, SELinux policy checks, systemd-unit validation, fresh default setup and restart for EL8/9/10 × x86_64/aarch64. Verify headSha equals `rpm_candidate_commit` and all six artifact bundles have checksums, RPM, SRPM, runtime manifest and matching public test key. A successful historical run or existing local image is insufficient. Integration artifacts must remain ineligible for release publication; no production signing-key or release changes belong here.

- [ ] **Step 6: Run the complete existing lifecycle suite with real predecessor and candidate artifacts.** Set the following inputs to signed local files for the selected architecture. `RPM_TEST_INITIAL_RPM` and `RPM_TEST_UPGRADE_RPM` must have increasing RPM releases; do not substitute the same package for both.

```bash
: "${RPM_TEST_PLATFORM:?Use linux/amd64 or linux/arm64}"
: "${RPM_TEST_INITIAL_RPM:?Path to the signed initial package}"
: "${RPM_TEST_UPGRADE_RPM:?Path to the signed later candidate package}"
: "${RPM_TEST_PREVIOUS_RPM:?Path to the supported preceding package}"
: "${RPM_TEST_GPG_KEY:?Path to the matching disposable public signing key}"
export RPM_TEST_GPG_KEY RPM_TEST_PREVIOUS_RPM
bash packaging/rpm/tests/run-lifecycle.sh "$RPM_TEST_PLATFORM" \
  "$RPM_TEST_INITIAL_RPM" "$RPM_TEST_UPGRADE_RPM"
```

The existing runner covers install/setup, upgrade, restart, SQL recovery, traversal rejection, retained-state remove/reinstall, all six database/proxy combinations, coexistence and predecessor migration. Run on both architectures. Inspect `command-status.log`, `result.txt`, SQL sentinel and configuration/certificate hashes; a final HTTP response alone is insufficient. Preserve failed-upgrade backups and migration markers in the failure cases. This runner’s OL8 image does not replace Step 5’s other EL majors or Step 7’s enforcing hosts.

- [ ] **Step 7: Qualify real enforcing hosts and cases outside the container runner.** Use a dedicated VM with a snapshot, candidate RPM and fixture scripts. Copy `packaging/rpm/tests/` to `/tmp/rpm-tests`. Set `HEIMDALL_RPM_TEST=1`, install/configure the candidate with a dedicated database, and retain the following baseline:

```bash
export HEIMDALL_RPM_TEST=1
install -d -m 0700 /root/rpm-acceptance
getenforce | tee /root/rpm-acceptance/selinux-mode.txt
[[ $(getenforce) == Enforcing ]]
systemctl is-active --quiet fapolicyd
rpm -q heimdall-server | tee /root/rpm-acceptance/package.txt
heimdall-cli --version | tee /root/rpm-acceptance/cli-version.txt
ps -eZ | tee /root/rpm-acceptance/process-domains.txt
sudo heimdall-cli fapolicyd add
sudo heimdall-cli validate
sudo heimdall-cli status
sudo firewall-cmd --list-all-zones > /root/rpm-acceptance/firewall-runtime.txt
sudo firewall-cmd --permanent --list-all-zones > /root/rpm-acceptance/firewall-permanent.txt
sudo journalctl --no-pager -u heimdall-server -u heimdall-postgresql -u heimdall-nginx -u heimdall-caddy > /root/rpm-acceptance/services-before.log
```

Run each row separately and retain its command output and before/after state. The host snapshot is the reset boundary; do not blindly replay destructive tests on a retained installation.

| Host case | Actions | Assertions |
|---|---|---|
| Fresh default | `heimdall-cli setup --non-interactive --external-url heimdall.example.test` with no port/proxy/TLS override | Nginx/self-signed selected; backend 3002; intended SELinux domain; authenticated HTTPS works. |
| Caddy custom public port | `heimdall-cli setup --non-interactive --proxy-mode bundled --tls-mode internal --external-url https://heimdall.example.test:8443` | Caddy validates; runtime and permanent 8443/tcp rules exist; remote HTTPS works; backend remains unreachable remotely. |
| Return to standard public port | `heimdall-cli setup --non-interactive --external-url https://heimdall.example.test` | Owned 8443 rule removed; administrator-preexisting 8443 rule preserved in a separate run; HTTPS 443 works. |
| None/external mode | `heimdall-cli setup --non-interactive --proxy-mode none`; separately configure external mode with its explicit external URL | No old managed proxy is enabled; externally owned services retain enablement/configuration. |
| Cross-proxy restore | Back up Nginx; switch to Caddy; restore Nginx archive; repeat reversed; also restore same mode and an external/none archive | Deselected managed unit disabled, selected managed unit enabled after setup; SQL sentinel, secrets and certificate identity restored. |
| Disabled-service failure | In the Go fixture, inject disable failure; on VM inspect the successful transitions | Failed operation never reports success or overwrites configuration after the failure. |
| External database versions/TLS | Configure dedicated PostgreSQL 13 and 18 targets using `heimdall-cli setup --database-mode external` and existing DB flags; set existing DATABASE_SSL configuration to verify-full with the test CA | Migration, actual reset, backup/restore and authenticated readiness succeed; wrong CA/hostname fails clearly. |
| SELinux/fapolicyd | Keep both enforcing for setup, reset, backup/restore, port changes and upgrade | Expected domains/labels, no unexplained AVC or fapolicyd denial, no permissive-mode workaround. |
| Full reboot | `systemctl reboot` on the dedicated VM after each managed-mode restore and custom-port case | Only selected proxy resumes; public endpoint works remotely; backend remains private; data and certificates match. |

For backup/restore, use these existing commands, choosing each archive from the dedicated output directory and verifying exactly one result:

```bash
rpm_restore_dir=$(mktemp -d /root/rpm-restore.XXXXXX)
heimdall-cli backup --output "$rpm_restore_dir"
mapfile -t rpm_restore_archives < <(find "$rpm_restore_dir" -maxdepth 1 -name '*.tar.gz')
[[ ${#rpm_restore_archives[@]} == 1 ]]
# Change the selected proxy with the setup commands in the table, then:
heimdall-cli restore "${rpm_restore_archives[0]}"
heimdall-cli setup --non-interactive
systemctl is-enabled heimdall-nginx heimdall-caddy
```

For each PostgreSQL 13/18 TLS target, require explicit fixture connection values and configure the existing SSL fields; `DATABASE_SSL` is a boolean, not the literal string `verify-full`:

```bash
: "${RPM_TEST_DB_HOST:?Dedicated PostgreSQL fixture hostname}"
: "${RPM_TEST_DB_PORT:?Fixture port}"
: "${RPM_TEST_DB_USER:?Fixture database user}"
: "${RPM_TEST_DB_PASSWORD:?Fixture password}"
: "${RPM_TEST_DB_NAME:?Dedicated fixture database}"
: "${RPM_TEST_DB_CA:?Readable public CA file}"
heimdall-cli config set DATABASE_SSL true
heimdall-cli config set DATABASE_SSL_INSECURE false
heimdall-cli config set DATABASE_SSL_CA "$RPM_TEST_DB_CA"
heimdall-cli setup --non-interactive --database-mode external \
  --db-host "$RPM_TEST_DB_HOST" --db-port "$RPM_TEST_DB_PORT" \
  --db-user "$RPM_TEST_DB_USER" --db-password "$RPM_TEST_DB_PASSWORD" \
  --db-name "$RPM_TEST_DB_NAME"
heimdall-cli validate
```

Keep password-bearing command traces private and exclude them from the acceptance report. The CLI resolves verified TLS to PostgreSQL verify-full; a wrong CA or hostname must make a connection operation fail. Restore the correct CA/hostname before recovery and login checks. Record the server's `SELECT version()` result so the 13/18 claim is tied to an actual server.

Capture state after reboot:

```bash
ps -eZ > /root/rpm-acceptance/process-domains-after.txt
ss -lntp > /root/rpm-acceptance/listeners-after.txt
sudo journalctl --no-pager -b -u heimdall-server -u heimdall-postgresql -u heimdall-nginx -u heimdall-caddy > /root/rpm-acceptance/services-after.log
sudo ausearch -m AVC,USER_AVC -ts boot > /root/rpm-acceptance/avc-after.txt || [[ $? == 1 ]]
sudo journalctl --no-pager -b -u fapolicyd > /root/rpm-acceptance/fapolicyd-after.txt
```

From another machine, with `RPM_TEST_HOST` set to the dedicated VM address and `RPM_TEST_PROXY_CA` set to the test public CA file, verify the public custom endpoint and blocked backend:

```bash
: "${RPM_TEST_HOST:?Dedicated VM IP address}"
: "${RPM_TEST_PROXY_CA:?Public test CA file}"
curl --fail --cacert "$RPM_TEST_PROXY_CA" \
  --resolve "heimdall.example.test:8443:$RPM_TEST_HOST" \
  https://heimdall.example.test:8443/server
if curl --fail --connect-timeout 3 "http://$RPM_TEST_HOST:3002/server"; then
  echo 'Managed proxy backend was reachable remotely' >&2
  exit 1
fi
```

Repeat default and policy qualification for every supported EL major and architecture; record the specific OS/policy versions. An unavailable VM is a release gate, never an assumed pass. Default stock policy checks on cached EL8/9/10 images already supported choosing 3002, but they do not prove running process confinement.

- [ ] **Step 8: Commit evidence-supported documentation.**

```bash
git add packaging/rpm/BUILD.md docs/superpowers/reports/2026-10-15-rpm-remediation-acceptance.md
git diff --cached --check
git commit -m "docs(rpm): record candidate acceptance and remaining gates"
```

The evidence identifies the tested candidate commit from Step 5; this final commit changes documentation only. If any source, package input or regression changes after that candidate, rerun the affected checks and candidate workflow before recording success. Record the run URL, commit, OS/architecture, RPM/SRPM hashes, command, exit status, evidence location, and any unresolved gate for every acceptance row. Do not store credentials, private keys, generated passwords or database contents in the report. Public fixture identifiers and test public keys are sufficient.

## Audit evidence recorded before implementation

This section describes the audit of `885d04dd5`, not the future fixed candidate. Production source was unchanged. Temporary reproductions intentionally failed where they demonstrated a listed defect.

| Audit check | Result |
|---|---|
| Source-input and packaging Python fixtures | 42 tests passed; lifecycle-status added 3 passing tests. |
| Source safety fixes in a temporary copy | 23 input tests passed after proposed credential/cleanup fixes; originals failed the regression cases. |
| Actual scratch Docker build context | Original included four synthetic registry credential files; temporary exclusions removed all four and retained normal source. |
| Version/SRPM fixture | Passed on Linux for 2.14.0 and its synthetic 3.2.1 override scenario. |
| Build Python, setup wrappers, guard/readiness/upgrade fixtures | Passed in their supported environments; Linux resolved the earlier macOS tool/sandbox limitations. |
| Current SELinux source | Compiled and installed in a disposable OL8 policy store; all 8 policy tests passed. Enforcement not established by this container. |
| Patched CLI baseline | Full `go test ./...` and functional suites passed. This did not detect the new audit regressions. |
| Real PostgreSQL reset syntax | PostgreSQL 18.6 rejected variable substitution in `-c`; stdin succeeded. |
| Existing backend | 13 files / 207 tests passed against a fresh disposable PostgreSQL database, excluding config suite; configuration and other safe unit tests separately passed (5 files / 61 tests, overlapping some of the 207). |
| Proposed backend regressions/fixes in a temporary copy | 4 files / 26 tests passed, including delayed deletion and tag-failure rejection. |
| Frontend | 7 files / 33 tests passed. |
| InSpec library | 4 files / 6 tests passed. |
| Converters | 34 files / 171 tests passed. Five tests in three files failed with absent/restricted SonarQube, Splunk and external Hadolint data access; dedicated-fixture rerun remains required. |
| Proposed RPM default change in a temporary CLI copy | All 30 new resolution/conflict cases, full Go suite and functional suite passed after the minimal guard and fresh-default expectation updates. |
| Default-port policy inspection | Stock cached EL8/9/10 policies assign 3000–3001 to ntop_port_t; 3002 has only generic unreserved assignment. |
| Full new RPM build, six-target candidate matrix, browser fixtures, enforcing VM/reboot | Not completed in this audit. Explicit Task 13 gates. Cached installed packages are only runtime test fixtures, not acceptance of current source. |

The root `lint:ci` command currently ends with `|| true`; its exit status cannot certify clean lint. Task 13 therefore runs strict backend/direct ESLint commands and records any existing baseline violations separately. No dependency-advisory or penetration scan was performed.

The audit found no evidence requiring a new installer, dependency, global administrative lock, broad architecture rewrite or blanket style cleanup. Those changes are intentionally excluded. Prioritize F1/F2 credential and deletion safety, then installer/recovery availability (F3/F5/F7), then the remaining independent correctness fixes; all eleven are required by this plan.

## Plan self-review

Completed by the plan author on 2026-10-15:

- F1–F11 each map to a numbered fix with regression code, exact source paths, validation commands and a separate commit.
- Task 12 covers omitted host fixtures; Task 13 covers builds, application suites, lifecycle, predecessor compatibility, TLS, policy enforcement, reboot and evidence provenance.
- CLI interface changes include every direct implementation and both firewall callers. The pinned revision stays unchanged; patch regeneration includes new test files.
- The global constraints match the design document. Fresh RPM defaults preserve saved/explicit/legacy settings and standalone defaults.
- Shell blocks parse, Markdown fences are balanced, tasks are sequentially numbered, and no unresolved content markers remain.
- Validation evidence distinguishes unchanged-source baselines, deliberately failing reproductions, proposed fixes tested only in temporary copies, and remaining release gates.
