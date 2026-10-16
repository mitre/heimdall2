package cmd

import (
	"fmt"
	"os"
	"strings"
	"syscall"
	"testing"

	"github.com/stretchr/testify/require"
)

// Security fixtures supply the root-owned metadata that the general fake omits.
type securityFS struct {
	*FakeFileSystem
	badPath    string
	badMode    os.FileMode
	uid        uint32
	failRename bool
}
type securityInfo struct {
	os.FileInfo
	mode os.FileMode
	uid  uint32
}

func (i securityInfo) Mode() os.FileMode { return i.mode }
func (i securityInfo) Sys() any          { return &syscall.Stat_t{Uid: i.uid, Gid: 0, Nlink: 1} }
func (f *securityFS) Lstat(path string) (os.FileInfo, error) {
	i, e := f.FakeFileSystem.Lstat(path)
	if e != nil {
		return i, e
	}
	mode := os.FileMode(0600)
	if i.IsDir() {
		mode = os.ModeDir | 0751
	}
	uid := uint32(0)
	if path == f.badPath {
		mode = f.badMode
		uid = f.uid
	}
	return securityInfo{i, mode, uid}, nil
}
func (f *securityFS) Rename(old, new string) error {
	if f.failRename {
		return fmt.Errorf("rename denied")
	}
	return f.FakeFileSystem.Rename(old, new)
}
func enableSELinux(r *SetupRunner) (*FakeFileSystem, *FakeExecRunner) {
	fs := r.FS.(*FakeFileSystem)
	fs.Files["/sys/fs/selinux/enforce"] = []byte("1\n")
	fs.Dirs[r.Paths.ConfigDir] = true
	r.FS = &securityFS{FakeFileSystem: fs}
	ex := r.Exec.(*FakeExecRunner)
	ex.Results["semanage port -l"] = FakeExecResult{Stdout: "SELinux Port Type              Proto    Port Number\nhttp_port_t tcp 80, 443\nunreserved_port_t tcp 1024-65535\n"}
	return fs, ex
}
func TestBundledUpgradeMigrationGate(t *testing.T) {
	for _, mode := range []string{"success", "skip-db", "reconfigure", "failed"} {
		t.Run(mode, func(t *testing.T) {
			r := bundledSetupFixture(t)
			fs := r.FS.(*FakeFileSystem)
			marker := r.Paths.ConfigDir + "/upgrade-pending"
			fs.Files[marker] = []byte("pending\n")
			r.FS = &securityFS{FakeFileSystem: fs}
			sd := r.Systemd.(*FakeSystemdRunner)
			switch mode {
			case "skip-db":
				r.SkipDB = true
			case "reconfigure":
				r.Reconfigure = true
			case "failed":
				r.Exec.(*FakeExecRunner).Results["heimdall-server-db-setup"] = FakeExecResult{ExitCode: 1}
			}
			err := r.Run()
			if mode == "failed" {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
			}
			if mode == "success" {
				require.False(t, fs.Exists(marker))
				require.True(t, sd.ActiveServices[ServiceName])
			} else {
				require.True(t, fs.Exists(marker))
				require.NotContains(t, sd.Actions, "restart:"+ServiceName)
				require.False(t, sd.ActiveServices[ServiceName])
			}
		})
	}
}
func TestBundledSELinuxConflictsPrecedeMutation(t *testing.T) {
	for _, line := range []string{"ssh_port_t tcp 3210", "other_port_t tcp 55000-56000", "other_port_t tcp 81, 443, 8443"} {
		t.Run(line, func(t *testing.T) {
			r := bundledSetupFixture(t)
			fs, ex := enableSELinux(r)
			ex.Results["semanage port -l"] = FakeExecResult{Stdout: line + "\n"}
			before, _ := r.Env.ReadEnv()
			beforeFiles := map[string]string{}
			for p, d := range fs.Files {
				beforeFiles[p] = string(d)
			}
			err := r.Run()
			require.Error(t, err)
			require.Contains(t, err.Error(), "SELinux")
			require.Equal(t, before, r.Env.(*FakeEnvManager).Env)
			require.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
			after := map[string]string{}
			for p, d := range fs.Files {
				after[p] = string(d)
			}
			require.Equal(t, beforeFiles, after)
			for _, c := range ex.Calls {
				if c.Name == "semanage" {
					require.NotContains(t, c.Args, "-m")
				}
				require.NotEqual(t, "chown", c.Name)
			}
		})
	}
}
func TestBundledSELinuxLedgerAndFailures(t *testing.T) {
	for _, mode := range []string{"new", "compatible", "query failure", "add failure", "unsafe ledger", "rename failure"} {
		t.Run(mode, func(t *testing.T) {
			r := bundledSetupFixture(t)
			r.SkipDB = true
			r.SkipTLS = true
			fs, ex := enableSELinux(r)
			ledger := r.Paths.ConfigDir + "/selinux-ports"
			switch mode {
			case "compatible":
				ex.Results["semanage port -l"] = FakeExecResult{Stdout: "heimdall_server_port_t tcp 3000, 3200-3220\n"}
			case "query failure":
				ex.Results["semanage port -l"] = FakeExecResult{ExitCode: 1}
			case "add failure":
				ex.Results["semanage port -a"] = FakeExecResult{ExitCode: 1}
			case "unsafe ledger":
				fs.Files[ledger] = []byte("http_port_t tcp 8443\n")
				r.FS.(*securityFS).badPath = ledger
				r.FS.(*securityFS).badMode = 0666
			case "rename failure":
				r.FS.(*securityFS).failRename = true
			}
			err := r.Run()
			if mode == "new" {
				require.NoError(t, err)
				require.Equal(t, "heimdall_server_port_t tcp 3210\n", string(fs.Files[ledger]))
			} else if mode == "compatible" {
				require.NoError(t, err)
				require.False(t, fs.Exists(ledger))
			} else {
				require.Error(t, err)
				require.NotContains(t, r.Systemd.(*FakeSystemdRunner).Actions, "restart:"+ServiceName)
			}
			for _, c := range ex.Calls {
				if c.Name == "semanage" {
					require.NotContains(t, c.Args, "-m")
				}
			}
		})
	}
}
func TestSetPortSELinuxConflictAndFailedAddPreserveConfig(t *testing.T) {
	for _, failure := range []string{"conflict", "add"} {
		t.Run(failure, func(t *testing.T) {
			setup := bundledSetupFixture(t)
			_, ex := enableSELinux(setup)
			if failure == "conflict" {
				ex.Results["semanage port -l"] = FakeExecResult{Stdout: "ssh_port_t tcp 4000-5000\n"}
			} else {
				ex.Results["semanage port -a"] = FakeExecResult{ExitCode: 1}
			}
			r := &SetPortRunner{FS: setup.FS, Paths: setup.Paths, Exec: ex, Env: setup.Env, Systemd: setup.Systemd, Out: setup.Out}
			err := r.Run("4567")
			require.Error(t, err)
			require.Equal(t, "3210", setup.Env.(*FakeEnvManager).Env["PORT"])
			require.Empty(t, setup.Systemd.(*FakeSystemdRunner).Actions)
		})
	}
}

type labelOrderSystemd struct {
	*FakeSystemdRunner
	exec *FakeExecRunner
	fs   *FakeFileSystem
	t    *testing.T
}

func (s *labelOrderSystemd) Start(unit string) error {
	s.check(unit)
	return s.FakeSystemdRunner.Start(unit)
}
func (s *labelOrderSystemd) Restart(unit string) error {
	s.check(unit)
	return s.FakeSystemdRunner.Restart(unit)
}
func (s *labelOrderSystemd) check(unit string) {
	var paths []string
	switch unit {
	case bundledPGService:
		paths = []string{bundledPGSocket, bundledPGData}
	case bundledCaddyService:
		paths = []string{"/run/heimdall-caddy", DefaultPaths().ConfigDir + "/caddy"}
	case ServiceName:
		paths = []string{DefaultPaths().ConfigDir}
		require.False(s.t, s.fs.Exists(DefaultPaths().ConfigDir+"/upgrade-pending"))
	}
	for _, p := range paths {
		found := false
		for _, c := range s.exec.Calls {
			if c.Name == "restorecon" {
				for _, a := range c.Args {
					if a == p || strings.HasPrefix(p, a+"/") {
						found = true
					}
				}
			}
		}
		require.True(s.t, found, "%s must be relabeled before %s starts", p, unit)
	}
}
func TestBundledSELinuxLabelsBeforePrivateServicesStart(t *testing.T) {
	r := bundledSetupFixture(t)
	fs, ex := enableSELinux(r)
	for _, dir := range []string{r.Paths.AppDir, r.Paths.LibExecDir + "/runtime", r.Paths.LibExecDir + "/runtime/postgresql", r.Paths.LibExecDir + "/runtime/caddy", "/var/lib/heimdall-postgresql", bundledPGData, "/var/lib/heimdall-caddy"} {
		fs.Dirs[dir] = true
	}
	fs.Files[r.Paths.ConfigDir+"/upgrade-pending"] = nil
	r.Systemd = &labelOrderSystemd{r.Systemd.(*FakeSystemdRunner), ex, fs, t}
	require.NoError(t, r.Run())
}
func TestBundledSELinuxRelabelFailureBlocksActivation(t *testing.T) {
	r := bundledSetupFixture(t)
	_, ex := enableSELinux(r)
	ex.Results["restorecon -R"] = FakeExecResult{ExitCode: 1}
	require.Error(t, r.Run())
	require.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
}
func TestFindTrustFilesPropagatesTraversalFailure(t *testing.T) {
	dir := t.TempDir()
	file := dir + "/regular"
	require.NoError(t, os.WriteFile(file, nil, 0600))
	_, err := (&osFileSystem{}).FindFiles(file+"/child", "*.node")
	require.Error(t, err, "ENOTDIR is an error, not an empty trust inventory")
}

func TestSELinuxNativeGenericPortRanges(t *testing.T) {
	output := "SELinux Port Type              Proto    Port Number\nreserved_port_t tcp 0-511\nhttp_port_t tcp 80, 443, 488, 8008, 8009, 8443, 9000\nunreserved_port_t tcp 1024-32767, 61001-65535\nephemeral_port_t tcp 32768-61000\n"
	compatible, err := selinuxPortCompatible(output, selinuxPort{"postgresql_port_t", "55432"})
	require.NoError(t, err)
	require.False(t, compatible)
	compatible, err = selinuxPortCompatible(output, selinuxPort{"http_port_t", "443"})
	require.NoError(t, err)
	require.True(t, compatible)
}

func TestBundledUpgradeRejectsUnsafeMarker(t *testing.T) {
	for _, mode := range []os.FileMode{os.ModeSymlink | 0600, 0666} {
		t.Run(fmt.Sprint(mode), func(t *testing.T) {
			r := bundledSetupFixture(t)
			fs := r.FS.(*FakeFileSystem)
			path := r.Paths.ConfigDir + "/upgrade-pending"
			fs.Files[path] = nil
			r.FS = &securityFS{FakeFileSystem: fs, badPath: path, badMode: mode}
			before, _ := r.Env.ReadEnv()
			require.Error(t, r.Run())
			require.Equal(t, before, r.Env.(*FakeEnvManager).Env)
			require.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
			require.True(t, fs.Exists(path))
		})
	}
}
func TestSELinuxLedgerRejectsNonnumericPort(t *testing.T) {
	require.False(t, validSELinuxPort(selinuxPort{"http_port_t", "+443"}))
}

type trustOrderExec struct {
	*FakeExecRunner
	t    *testing.T
	psql string
	fs   FileSystem
}

func (e *trustOrderExec) RunWithEnv(env map[string]string, name string, args ...string) (string, int, error) {
	if name == e.psql {
		trusted, err := e.fs.ReadFile("/etc/fapolicyd/trust.d/" + fapolicydTrustFile)
		require.NoError(e.t, err)
		require.Contains(e.t, string(trusted), e.psql+" ", "trust must precede the external-database private client preflight")
	}
	return e.FakeExecRunner.RunWithEnv(env, name, args...)
}
func TestBundledExternalPreflightTrustsPrivateClientFirst(t *testing.T) {
	r := bundledSetupFixture(t)
	r.DatabaseMode = "external"
	r.DBHost = "db.example.test"
	r.DBPort = 5432
	r.flagChanged = map[string]bool{"db-host": true, "db-port": true}
	r.Exec = &trustOrderExec{r.Exec.(*FakeExecRunner), t, r.Paths.RuntimePath("postgresql", "bin", "psql"), r.FS}
	require.NoError(t, r.Run())
}

func TestSecurityRound1LedgerFailureAndRetry(t *testing.T) {
	r := bundledSetupFixture(t)
	fs, ex := enableSELinux(r)
	ledger := r.Paths.ConfigDir + "/selinux-ports"
	fs.Files[ledger] = []byte("http_port_t tcp 8443\n")
	r.FS.(*securityFS).failRename = true
	ex.Results["semanage port -d"] = FakeExecResult{ExitCode: 1, Stdout: "delete denied"}
	ex.Results["semanage port -l -C"] = FakeExecResult{Stdout: "heimdall_server_port_t tcp 3210\nhttp_port_t tcp 8443\n"}
	ports := []selinuxPort{{"heimdall_server_port_t", "3210"}}
	err := configureSELinuxPorts(ex, r.FS, r.Paths.ConfigDir, ports, true)
	require.ErrorContains(t, err, "delete denied")
	require.Equal(t, "http_port_t tcp 8443\nheimdall_server_port_t tcp 3210\n", string(fs.Files[ledger+".pending"]))
	require.Equal(t, "http_port_t tcp 8443\n", string(fs.Files[ledger]))
	// A later administrator addition must survive reconciliation of the failed save.
	fs.Files[ledger] = []byte("postgresql_port_t tcp 55432\n")
	r.FS.(*securityFS).failRename = false
	ex.Results["semanage port -l"] = FakeExecResult{Stdout: "heimdall_server_port_t tcp 3210\nhttp_port_t tcp 8443\npostgresql_port_t tcp 55432\n"}
	ex.Results["semanage port -l -C"] = FakeExecResult{Stdout: "heimdall_server_port_t tcp 3210\nhttp_port_t tcp 8443\npostgresql_port_t tcp 55432\n"}
	ex.Calls = nil
	require.NoError(t, configureSELinuxPorts(ex, r.FS, r.Paths.ConfigDir, ports, true))
	require.Contains(t, string(fs.Files[ledger]), "postgresql_port_t tcp 55432\n")
	require.Contains(t, string(fs.Files[ledger]), "http_port_t tcp 8443\n")
	require.Contains(t, string(fs.Files[ledger]), "heimdall_server_port_t tcp 3210\n")
	require.False(t, fs.Exists(ledger+".pending"))
	for _, c := range ex.Calls {
		require.False(t, c.Name == "semanage" && contains(c.Args, "-a"), "compatible retry must only reconcile ownership")
	}
}

func TestSecurityRound1PendingLedgerReconciliation(t *testing.T) {
	for _, mode := range []string{"exact", "changed type", "range", "absent", "query failure", "rename failure", "unsafe", "preflight"} {
		t.Run(mode, func(t *testing.T) {
			r := bundledSetupFixture(t)
			fs, ex := enableSELinux(r)
			ledger := r.Paths.ConfigDir + "/selinux-ports"
			canonical := "http_port_t tcp 8443\n"
			pending := "heimdall_server_port_t tcp 3210\n"
			fs.Files[ledger] = []byte(canonical)
			fs.Files[ledger+".pending"] = []byte(pending)
			local := FakeExecResult{Stdout: "heimdall_server_port_t tcp 3210\n"}
			switch mode {
			case "changed type":
				local.Stdout = "ssh_port_t tcp 3210\n"
			case "range":
				local.Stdout = "heimdall_server_port_t tcp 3200-3220\n"
			case "absent":
				local.Stdout = ""
			case "query failure":
				local.ExitCode = 1
			case "rename failure":
				r.FS.(*securityFS).failRename = true
			case "unsafe":
				r.FS.(*securityFS).badPath = ledger + ".pending"
				r.FS.(*securityFS).badMode = 0666
			}
			ex.Results["semanage port -l -C"] = local
			err := configureSELinuxPorts(ex, r.FS, r.Paths.ConfigDir, []selinuxPort{{"http_port_t", "443"}}, mode != "preflight")
			retained := mode == "query failure" || mode == "rename failure" || mode == "unsafe" || mode == "preflight"
			if retained && mode != "preflight" {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
			}
			if retained {
				require.Equal(t, pending, string(fs.Files[ledger+".pending"]))
			} else {
				require.False(t, fs.Exists(ledger+".pending"))
			}
			if mode == "exact" {
				require.Equal(t, canonical+pending, string(fs.Files[ledger]))
			} else {
				require.Equal(t, canonical, string(fs.Files[ledger]))
			}
			for _, c := range ex.Calls {
				if c.Name == "semanage" {
					require.NotContains(t, c.Args, "-a")
					require.NotContains(t, c.Args, "-d")
				}
				if mode == "preflight" {
					require.NotContains(t, []string{"chown", "chmod"}, c.Name)
				}
			}
		})
	}
}

func TestSecurityRound1LedgerRollbackChecksLocalOwnership(t *testing.T) {
	for _, mode := range []string{"exact", "changed type", "range", "absent", "query failure"} {
		t.Run(mode, func(t *testing.T) {
			r := bundledSetupFixture(t)
			fs, ex := enableSELinux(r)
			r.FS.(*securityFS).failRename = true
			local := FakeExecResult{Stdout: "heimdall_server_port_t tcp 3210\n"}
			switch mode {
			case "changed type":
				local.Stdout = "ssh_port_t tcp 3210\n"
			case "range":
				local.Stdout = "heimdall_server_port_t tcp 3200-3220\n"
			case "absent":
				local.Stdout = ""
			case "query failure":
				local.ExitCode = 1
			}
			ex.Results["semanage port -l -C"] = local
			err := configureSELinuxPorts(ex, r.FS, r.Paths.ConfigDir, []selinuxPort{{"heimdall_server_port_t", "3210"}}, true)
			require.Error(t, err)
			deleted := false
			for _, c := range ex.Calls {
				deleted = deleted || (c.Name == "semanage" && contains(c.Args, "-d"))
			}
			require.Equal(t, mode == "exact", deleted)
			require.Equal(t, mode == "query failure", fs.Exists(r.Paths.ConfigDir+"/selinux-ports.pending"))
		})
	}
}

type securityActivationFailure struct {
	*FakeSystemdRunner
	failure   string
	attempted bool
	stopFails bool
}

func (s *securityActivationFailure) Enable(unit string) error {
	if unit == ServiceName {
		s.attempted = true
		if s.failure == "enable" {
			return fmt.Errorf("enable failure")
		}
	}
	return s.FakeSystemdRunner.Enable(unit)
}
func (s *securityActivationFailure) Restart(unit string) error {
	if unit == ServiceName && s.failure == "restart" {
		s.ActiveServices[unit] = true
		return fmt.Errorf("restart failure")
	}
	return s.FakeSystemdRunner.Restart(unit)
}
func (s *securityActivationFailure) IsActive(unit string) (bool, error) {
	if unit == ServiceName && s.attempted && s.failure == "status" {
		return false, fmt.Errorf("status failure")
	}
	return s.FakeSystemdRunner.IsActive(unit)
}
func (s *securityActivationFailure) Stop(unit string) error {
	if unit == ServiceName && s.attempted && s.stopFails {
		return fmt.Errorf("cleanup stop failed")
	}
	return s.FakeSystemdRunner.Stop(unit)
}
func TestSecurityRound1FailedActivationRestoresBarrier(t *testing.T) {
	for _, failure := range []string{"enable", "restart", "status", "stop"} {
		t.Run(failure, func(t *testing.T) {
			r := bundledSetupFixture(t)
			fs := r.FS.(*FakeFileSystem)
			marker := r.Paths.ConfigDir + "/upgrade-pending"
			fs.Files[marker] = []byte("original pending\n")
			r.FS = &securityFS{FakeFileSystem: fs}
			sd := &securityActivationFailure{FakeSystemdRunner: r.Systemd.(*FakeSystemdRunner), failure: failure}
			r.Systemd = sd
			if failure == "stop" {
				sd.failure = "status"
				sd.stopFails = true
			}
			err := r.Run()
			require.Error(t, err)
			require.Equal(t, "original pending\n", string(fs.Files[marker]))
			if failure == "stop" {
				require.ErrorContains(t, err, "cleanup stop failed")
			} else {
				require.False(t, sd.ActiveServices[ServiceName])
			}
		})
	}
}

func TestSecurityRound1FailedActivationWithoutMarkerStopsApp(t *testing.T) {
	for _, stopFails := range []bool{false, true} {
		t.Run(fmt.Sprint(stopFails), func(t *testing.T) {
			r := bundledSetupFixture(t)
			fs := r.FS.(*FakeFileSystem)
			sd := &securityActivationFailure{FakeSystemdRunner: r.Systemd.(*FakeSystemdRunner), failure: "status", stopFails: stopFails}
			r.Systemd = sd
			err := r.Run()
			require.ErrorContains(t, err, "status failure")
			require.False(t, fs.Exists(r.Paths.ConfigDir+"/upgrade-pending"))
			if stopFails {
				require.ErrorContains(t, err, "cleanup stop failed")
			} else {
				require.False(t, sd.ActiveServices[ServiceName])
			}
		})
	}
}

type securityMarkerWriteFailure struct {
	*securityFS
	marker string
}

func (f *securityMarkerWriteFailure) WriteFile(path string, data []byte, mode os.FileMode) error {
	if path == f.marker {
		return fmt.Errorf("marker write denied")
	}
	return f.securityFS.WriteFile(path, data, mode)
}

func TestSecurityRound1FailedMarkerRestoreStillStopsApp(t *testing.T) {
	for _, failure := range []string{"write", "chown", "chmod"} {
		t.Run(failure, func(t *testing.T) {
			r := bundledSetupFixture(t)
			fs := r.FS.(*FakeFileSystem)
			marker := r.Paths.ConfigDir + "/upgrade-pending"
			fs.Files[marker] = []byte("pending\n")
			checked := &securityFS{FakeFileSystem: fs}
			r.FS = checked
			if failure == "write" {
				r.FS = &securityMarkerWriteFailure{securityFS: checked, marker: marker}
			} else {
				arg := "root:root"
				if failure == "chmod" {
					arg = "0600"
				}
				r.Exec.(*FakeExecRunner).Results[failure+" "+arg+" "+marker] = FakeExecResult{ExitCode: 1, Stdout: "marker " + failure + " denied"}
			}
			sd := &securityActivationFailure{FakeSystemdRunner: r.Systemd.(*FakeSystemdRunner), failure: "status"}
			r.Systemd = sd
			err := r.Run()
			require.ErrorContains(t, err, "status failure")
			require.ErrorContains(t, err, "marker "+failure+" denied")
			require.False(t, sd.ActiveServices[ServiceName])
		})
	}
}

type securityAliasFS struct {
	*securityFS
	target string
	hidden string
}

func (f *securityAliasFS) EvalSymlinks(string) (string, error) {
	if f.target == "" {
		return "", os.ErrNotExist
	}
	return f.target, nil
}
func (f *securityAliasFS) FindFiles(root, pattern string) ([]string, error) {
	files, err := f.securityFS.FindFiles(root, pattern)
	kept := files[:0]
	for _, file := range files {
		if file != f.hidden {
			kept = append(kept, file)
		}
	}
	return kept, err
}
func TestSecurityRound1PrivateAliasInventory(t *testing.T) {
	for _, kind := range []string{"ordinary", "missing", "external", "unlisted"} {
		t.Run(kind, func(t *testing.T) {
			r, ex, fs, _, _ := newFapolicydForTest()
			trust := "/etc/fapolicyd/trust.d/" + fapolicydTrustFile
			fs.Files[trust] = []byte("previous trusted inventory\n")
			alias := "/usr/libexec/heimdall-server/runtime/postgresql/lib/libpq.so.5"
			target := alias + ".18"
			fs.Files[alias] = nil
			wrapped := &securityAliasFS{securityFS: &securityFS{FakeFileSystem: fs, badPath: alias, badMode: os.ModeSymlink | 0777}, target: target}
			r.FS = wrapped
			if kind == "missing" {
				wrapped.target = ""
			} else {
				if kind == "external" {
					wrapped.target = "/var/lib/operator/libpq.so.5.18"
				}
				fs.Files[wrapped.target] = nil
			}
			if kind == "unlisted" {
				wrapped.hidden = target
			}
			err := r.Add()
			if kind != "ordinary" {
				require.Error(t, err)
				require.Equal(t, "previous trusted inventory\n", string(fs.Files[trust]))
				for _, c := range ex.Calls {
					require.NotEqual(t, "fapolicyd-cli", c.Name)
				}
				return
			}
			require.NoError(t, err)
			require.NotContains(t, string(fs.Files[trust]), alias+" ")
			require.Contains(t, string(fs.Files[trust]), target+" ")
		})
	}
}
