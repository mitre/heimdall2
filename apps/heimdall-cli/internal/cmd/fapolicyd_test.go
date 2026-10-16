package cmd

import (
	"bytes"
	"crypto/sha256"
	"fmt"
	"os"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestFapolicydRefreshExistingOwnedPaths(t *testing.T) {
	r, exec, fs, _, _ := newFapolicydForTest()
	path := "/usr/libexec/heimdall-server/runtime/node/bin/node with spaces"
	trust := "/etc/fapolicyd/trust.d/" + fapolicydTrustFile
	admin := "/etc/fapolicyd/trust.d/operator"
	fs.Files[path] = []byte("new runtime bytes")
	fs.Files[trust] = []byte(path + " 3 old-hash\n/stale/owned/path 0 old-hash\n")
	fs.Files[admin] = []byte("administrator record\n")
	// Native fapolicyd rejects add when the path is in any existing trust file.
	exec.Results["fapolicyd-cli --file add"] = FakeExecResult{ExitCode: 1, Stdout: "After removing duplicates, there is nothing to add"}
	for _, data := range []string{"new runtime bytes", "replacement bytes"} {
		fs.Files[path] = []byte(data)
		require.NoError(t, r.Add())
		require.Equal(t, fmt.Sprintf("%s %d %x\n", path, len(data), sha256.Sum256([]byte(data))), string(fs.Files[trust]))
		require.Equal(t, "administrator record\n", string(fs.Files[admin]))
		require.False(t, fs.Exists(trust+".pending"))
	}
	delete(fs.Files, path)
	require.NoError(t, r.Add())
	require.Empty(t, fs.Files[trust], "removed immutable files must lose their owned rows")
}

func TestFapolicydRejectsAmbiguousTrustPaths(t *testing.T) {
	for _, whitespace := range []string{"\t", "\n", "\r", "\v", "\f", "\x1b", "\x7f"} {
		t.Run(fmt.Sprintf("%q", whitespace), func(t *testing.T) {
			r, _, fs, _, _ := newFapolicydForTest()
			path := "/usr/share/heimdall-server/ambiguous" + whitespace + "addon.node"
			trust := "/etc/fapolicyd/trust.d/" + fapolicydTrustFile
			fs.Files[path] = []byte("addon")
			fs.Files[trust] = []byte("previous inventory\n")
			require.Error(t, r.Add())
			require.Equal(t, "previous inventory\n", string(fs.Files[trust]))
		})
	}
}

// newFapolicydForTest wires a FapolicydRunner to fakes with the canonical
// install layout. Each test mutates fields it cares about.
func newFapolicydForTest() (*FapolicydRunner, *FakeExecRunner, *FakeFileSystem, *FakeSystemdRunner, *bytes.Buffer) {
	exec := &FakeExecRunner{Results: map[string]FakeExecResult{}}
	fs := NewFakeFileSystem()
	sysd := &FakeSystemdRunner{ActiveServices: map[string]bool{}}
	out := &bytes.Buffer{}
	r := &FapolicydRunner{
		Exec:    exec,
		FS:      fs,
		Systemd: sysd,
		Out:     out,
	}
	return r, exec, fs, sysd, out
}

func TestFapolicyd_Add_TrustsNodeBinaryWhenPresent(t *testing.T) {
	r, _, fs, _, _ := newFapolicydForTest()
	fs.Files["/usr/share/heimdall-server/node"] = []byte("")

	err := r.Add()

	require.NoError(t, err)

	require.Equal(t, fmt.Sprintf("/usr/share/heimdall-server/node 0 %x\n", sha256.Sum256(nil)), string(fs.Files["/etc/fapolicyd/trust.d/heimdall-server"]))
}

func TestFapolicyd_Add_SkipsNodeBinaryWhenMissing(t *testing.T) {
	r, exec, _, _, _ := newFapolicydForTest()
	// fs is empty — no node binary

	err := r.Add()

	require.NoError(t, err)

	for _, c := range exec.Calls {
		require.NotContains(t, c.Args, "/usr/share/heimdall-server/node",
			"must not try to trust missing node binary")
	}
}

func TestFapolicyd_Add_TrustsNativeAddons(t *testing.T) {
	r, _, fs, _, _ := newFapolicydForTest()
	addons := []string{
		"/usr/share/heimdall-server/node_modules/argon2/lib/binding/napi-v3/argon2.node",
		"/usr/share/heimdall-server/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node",
		"/usr/share/heimdall-server/apps/backend/node_modules/sharp/build/Release/sharp.node",
	}
	for _, p := range addons {
		fs.Files[p] = []byte("")
	}

	err := r.Add()

	require.NoError(t, err)

	for _, addon := range addons {
		require.Contains(t, string(fs.Files["/etc/fapolicyd/trust.d/heimdall-server"]), fmt.Sprintf("%s 0 %x\n", addon, sha256.Sum256(nil)))
	}
}

func TestFapolicyd_Add_ReloadsServiceWhenActive(t *testing.T) {
	r, exec, _, sysd, _ := newFapolicydForTest()
	sysd.ActiveServices["fapolicyd"] = true

	err := r.Add()
	require.NoError(t, err)

	var sawUpdate bool
	for _, c := range exec.Calls {
		if c.Name == "fapolicyd-cli" && contains(c.Args, "--update") {
			sawUpdate = true
			break
		}
	}
	require.True(t, sawUpdate,
		"fapolicyd-cli --update must be invoked when fapolicyd service is active")
}

func TestFapolicyd_Add_SkipsReloadWhenServiceInactive(t *testing.T) {
	r, exec, _, _, _ := newFapolicydForTest()
	// fapolicyd inactive (default)

	err := r.Add()
	require.NoError(t, err)

	for _, c := range exec.Calls {
		require.NotContains(t, c.Args, "--update",
			"must not invoke --update when fapolicyd service is inactive")
	}
}

func TestFapolicyd_Remove_DeletesTrustFile(t *testing.T) {
	r, _, fs, _, _ := newFapolicydForTest()
	trustPath := "/etc/fapolicyd/trust.d/heimdall-server"
	fs.Files[trustPath] = []byte("/usr/share/heimdall-server/node\n")

	err := r.Remove()
	require.NoError(t, err)

	require.False(t, fs.Exists(trustPath),
		"trust file must be removed after Remove()")
}

func TestFapolicyd_Remove_TolerantToMissingTrustFile(t *testing.T) {
	r, _, _, _, _ := newFapolicydForTest()
	// no trust file in fs

	err := r.Remove()
	require.NoError(t, err,
		"Remove() must not error when trust file is already absent")
}

func TestFapolicyd_Remove_ReloadsServiceWhenActive(t *testing.T) {
	r, exec, _, sysd, _ := newFapolicydForTest()
	sysd.ActiveServices["fapolicyd"] = true

	err := r.Remove()
	require.NoError(t, err)

	var sawUpdate bool
	for _, c := range exec.Calls {
		if c.Name == "fapolicyd-cli" && contains(c.Args, "--update") {
			sawUpdate = true
			break
		}
	}
	require.True(t, sawUpdate,
		"fapolicyd-cli --update must be invoked when fapolicyd service is active")
}

// --- Cobra-level command surface tests ---

func TestFapolicydCmd_Help(t *testing.T) {
	cmd := NewFapolicydCmd(nil)
	out := &bytes.Buffer{}
	cmd.SetOut(out)
	cmd.SetArgs([]string{"--help"})

	err := cmd.Execute()
	require.NoError(t, err)

	help := out.String()
	require.Contains(t, help, "fapolicyd")
	require.Contains(t, help, "add")
	require.Contains(t, help, "remove")
}

func TestFapolicydCmd_Add_InvokesRunner(t *testing.T) {
	r, exec, fs, _, _ := newFapolicydForTest()
	fs.Files["/usr/share/heimdall-server/node"] = []byte("")
	cmd := NewFapolicydCmd(r)
	cmd.SetArgs([]string{"add"})

	out := &bytes.Buffer{}
	cmd.SetOut(out)

	err := cmd.Execute()
	require.NoError(t, err)
	require.NotEmpty(t, exec.Calls,
		"add subcommand must invoke fapolicyd-cli")
	require.Contains(t, out.String(), "trust entries added")
}

func TestFapolicydCmd_Remove_InvokesRunner(t *testing.T) {
	r, _, fs, _, _ := newFapolicydForTest()
	fs.Files["/etc/fapolicyd/trust.d/heimdall-server"] = []byte("x")
	cmd := NewFapolicydCmd(r)
	cmd.SetArgs([]string{"remove"})

	out := &bytes.Buffer{}
	cmd.SetOut(out)

	err := cmd.Execute()
	require.NoError(t, err)
	require.False(t, fs.Exists("/etc/fapolicyd/trust.d/heimdall-server"),
		"remove subcommand must delete the trust file")
	require.Contains(t, out.String(), "trust entries removed")
}

// contains is a tiny helper for asserting on flag/arg slices.
func contains(haystack []string, needle string) bool {
	for _, s := range haystack {
		if s == needle {
			return true
		}
	}
	return false
}

// avoid `fmt imported but not used` if helpers above stop using it.
var _ = fmt.Sprintf

func TestFapolicyd_PrivateRuntimeAndErrors(t *testing.T) {
	r, _, fs, _, _ := newFapolicydForTest()
	paths := []string{"/usr/libexec/heimdall-server/runtime/node/bin/node", "/usr/libexec/heimdall-server/runtime/postgresql/bin/postgres", "/usr/libexec/heimdall-server/runtime/postgresql/lib/libpq.so.5", "/usr/libexec/heimdall-server/runtime/caddy/caddy", "/usr/libexec/heimdall-server/runtime/nginx/sbin/nginx", "/usr/share/heimdall-server/node_modules/argon2.node"}
	for _, p := range paths {
		fs.Files[p] = nil
	}
	fs.Files["/var/lib/heimdall-caddy/unsafe.node"] = nil
	require.NoError(t, r.Add())
	trust := string(fs.Files["/etc/fapolicyd/trust.d/heimdall-server"])
	for _, p := range paths {
		require.Contains(t, trust, fmt.Sprintf("%s 0 %x\n", p, sha256.Sum256(nil)))
	}
	require.NotContains(t, trust, "/var/lib/heimdall-caddy/unsafe.node")
	r.FS = &fapolicydReadFailure{FakeFileSystem: fs, path: paths[0]}
	require.Error(t, r.Add(), "real trust failures must not report success")
}

type fapolicydReadFailure struct {
	*FakeFileSystem
	path string
}

func (f *fapolicydReadFailure) ReadFile(path string) ([]byte, error) {
	if path == f.path {
		return nil, fmt.Errorf("read denied")
	}
	return f.FakeFileSystem.ReadFile(path)
}

func TestFapolicydRefreshPreservesTrustOnFailureAndSkipsAliases(t *testing.T) {
	r, exec, fs, sysd, out := newFapolicydForTest()
	path := "/usr/libexec/heimdall-server/runtime/postgresql/lib/libpq.so.5.18"
	fs.Files[path] = nil
	trust := "/etc/fapolicyd/trust.d/heimdall-server"
	fs.Files[trust] = []byte("old hash\n")
	fs.Files["/etc/fapolicyd/trust.d/operator"] = []byte("untouched\n")
	r.FS = &fapolicydReadFailure{FakeFileSystem: fs, path: path}
	require.Error(t, r.Add())
	require.Equal(t, "old hash\n", string(fs.Files[trust]))
	require.NotContains(t, out.String(), "trust entries added")
	r.FS = fs
	sysd.ActiveServices["fapolicyd"] = true
	exec.Results["fapolicyd-cli --update"] = FakeExecResult{ExitCode: 1}
	require.Error(t, r.Add())
	require.Equal(t, "old hash\n", string(fs.Files[trust]))
	require.NoError(t, fs.RemoveAll(path))
	delete(exec.Results, "fapolicyd-cli --update")
	require.NoError(t, r.Remove())
	require.Equal(t, "untouched\n", string(fs.Files["/etc/fapolicyd/trust.d/operator"]))
}
func TestFapolicydMissingVersusBrokenTool(t *testing.T) {
	for _, code := range []int{1, 127} {
		t.Run(fmt.Sprint(code), func(t *testing.T) {
			r, exec, fs, _, out := newFapolicydForTest()
			fs.Files["/usr/share/heimdall-server/argon.node"] = nil
			exec.Results[`sh -c command -v "$1" sh fapolicyd-cli`] = FakeExecResult{ExitCode: code}
			err := r.Add()
			if code == 1 {
				require.NoError(t, err)
				require.Contains(t, out.String(), "not installed")
			} else {
				require.Error(t, err)
			}
			require.NotContains(t, out.String(), "trust entries added")
			for _, c := range exec.Calls {
				require.NotEqual(t, "fapolicyd-cli", c.Name)
			}
		})
	}
}

func TestFapolicydRefusesLinkedAddonAndTrustRoot(t *testing.T) {
	for _, path := range []string{"/usr/share/heimdall-server/native.node", "/usr/libexec/heimdall-server/runtime/postgresql/lib"} {
		t.Run(path, func(t *testing.T) {
			r, _, fs, _, _ := newFapolicydForTest()
			fs.Files[path] = nil
			r.FS = &securityFS{FakeFileSystem: fs, badPath: path, badMode: os.ModeSymlink | 0777}
			require.Error(t, r.Add())
		})
	}
}

type fapolicydPublishFailure struct {
	*FakeFileSystem
	writeFails bool
	renameAt   int
	renames    int
}

func (f *fapolicydPublishFailure) WriteFile(path string, data []byte, mode os.FileMode) error {
	if f.writeFails {
		return fmt.Errorf("snapshot write denied")
	}
	return f.FakeFileSystem.WriteFile(path, data, mode)
}
func (f *fapolicydPublishFailure) Rename(from, to string) error {
	f.renames++
	if f.renames == f.renameAt {
		return fmt.Errorf("snapshot rename denied")
	}
	return f.FakeFileSystem.Rename(from, to)
}

type fapolicydUpdateFailure struct {
	*FakeExecRunner
	snapshots []string
	fs        *FakeFileSystem
	failAgain bool
}

func (e *fapolicydUpdateFailure) Run(name string, args ...string) (string, int, error) {
	out, code, err := e.FakeExecRunner.Run(name, args...)
	if name == "fapolicyd-cli" && len(args) == 1 && args[0] == "--update" {
		e.snapshots = append(e.snapshots, string(e.fs.Files["/etc/fapolicyd/trust.d/"+fapolicydTrustFile]))
		if len(e.snapshots) == 1 {
			return "native update failed", 1, nil
		}
		if e.failAgain {
			return "native re-notification failed", 1, nil
		}
	}
	return out, code, err
}

func TestFapolicydSnapshotPublicationFailures(t *testing.T) {
	for _, failure := range []string{"write", "chown", "chmod", "rename", "update", "rollback", "re-notification"} {
		t.Run(failure, func(t *testing.T) {
			r, ex, fs, sd, out := newFapolicydForTest()
			path := "/usr/share/heimdall-server/native.node"
			trust := "/etc/fapolicyd/trust.d/" + fapolicydTrustFile
			fs.Files[path] = []byte("replacement")
			fs.Files[trust] = []byte("original owned inventory\n")
			fs.Files["/etc/fapolicyd/trust.d/operator"] = []byte("administrator inventory\n")
			wrapped := &fapolicydPublishFailure{FakeFileSystem: fs}
			r.FS = wrapped
			updates := &fapolicydUpdateFailure{FakeExecRunner: ex, fs: fs, failAgain: failure == "re-notification"}
			switch failure {
			case "write":
				wrapped.writeFails = true
			case "chown", "chmod":
				arg := "root:root"
				if failure == "chmod" {
					arg = "0600"
				}
				ex.Results[failure+" "+arg+" "+trust+".pending"] = FakeExecResult{ExitCode: 1, Stdout: "metadata denied"}
			case "rename":
				wrapped.renameAt = 1
			default:
				r.Exec = updates
				sd.ActiveServices[fapolicydService] = true
				if failure == "rollback" {
					wrapped.renameAt = 2
				}
			}
			err := r.Add()
			require.Error(t, err)
			require.NotContains(t, out.String(), "trust entries added")
			require.Equal(t, "administrator inventory\n", string(fs.Files["/etc/fapolicyd/trust.d/operator"]))
			if failure == "rollback" {
				require.ErrorContains(t, err, "native update failed")
				require.ErrorContains(t, err, "snapshot rename denied")
				require.Len(t, updates.snapshots, 1)
			} else {
				require.Equal(t, "original owned inventory\n", string(fs.Files[trust]))
			}
			if failure == "update" || failure == "re-notification" {
				require.ErrorContains(t, err, "native update failed")
				require.Len(t, updates.snapshots, 2)
				require.Contains(t, updates.snapshots[0], path+" ")
				require.Equal(t, "original owned inventory\n", updates.snapshots[1])
			}
			if failure == "re-notification" {
				require.ErrorContains(t, err, "native re-notification failed")
			}
		})
	}
}
