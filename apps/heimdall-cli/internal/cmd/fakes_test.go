package cmd

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// executeCommand runs the root command with the given args and captures output.
func executeCommand(t *testing.T, args ...string) (stdout, stderr string, err error) {
	t.Helper()
	root := NewRootCmd()
	outBuf := new(bytes.Buffer)
	errBuf := new(bytes.Buffer)
	root.SetOut(outBuf)
	root.SetErr(errBuf)
	root.SetArgs(args)
	err = root.Execute()
	return outBuf.String(), errBuf.String(), err
}

// --- Fake implementations for testing ---

// FakeExecRunner records calls and returns pre-configured results.
type FakeExecRunner struct {
	Calls   []FakeExecCall
	Results map[string]FakeExecResult
}

type FakeExecCall struct {
	Name  string
	Args  []string
	Env   map[string]string
	Stdin string
}

type FakeExecResult struct {
	Stdout   string
	ExitCode int
	Err      error
	matched  bool // set by Run() when this result is consumed
}

// execKey builds a lookup key from the command name and first two args.
// Run also accepts full command keys to distinguish shell lookup arguments.
func execKey(name string, args []string) string {
	switch {
	case len(args) >= 2:
		return fmt.Sprintf("%s %s %s", name, args[0], args[1])
	case len(args) == 1:
		return fmt.Sprintf("%s %s", name, args[0])
	default:
		return name
	}
}

func (f *FakeExecRunner) Run(name string, args ...string) (string, int, error) {
	f.Calls = append(f.Calls, FakeExecCall{Name: name, Args: args})
	fullKey := strings.Join(append([]string{name}, args...), " ")
	if r, ok := f.Results[fullKey]; ok {
		r.matched = true
		f.Results[fullKey] = r
		return r.Stdout, r.ExitCode, r.Err
	}
	key := execKey(name, args)
	if r, ok := f.Results[key]; ok {
		r.matched = true
		f.Results[key] = r
		return r.Stdout, r.ExitCode, r.Err
	}
	// Fall back to single-arg key for backward compatibility
	if len(args) > 0 {
		shortKey := fmt.Sprintf("%s %s", name, args[0])
		if r, ok := f.Results[shortKey]; ok {
			r.matched = true
			f.Results[shortKey] = r
			return r.Stdout, r.ExitCode, r.Err
		}
	}
	return "", 0, nil
}

// Verify checks that all registered results were consumed by at least one call.
// Call this at the end of a test to catch stubs that were never triggered —
// which usually means the code path you expected to run didn't actually execute.
// Pattern from gh CLI's httpmock.Registry.Verify().
func (f *FakeExecRunner) Verify(t testing.TB) {
	t.Helper()
	for key, r := range f.Results {
		if !r.matched {
			t.Errorf("FakeExecRunner: registered result %q was never called", key)
		}
	}
}

func (f *FakeExecRunner) RunWithEnv(env map[string]string, name string, args ...string) (string, int, error) {
	f.Calls = append(f.Calls, FakeExecCall{Name: name, Args: args, Env: env})
	fullKey := strings.Join(append([]string{name}, args...), " ")
	if r, ok := f.Results[fullKey]; ok {
		r.matched = true
		f.Results[fullKey] = r
		return r.Stdout, r.ExitCode, r.Err
	}
	key := execKey(name, args)
	if r, ok := f.Results[key]; ok {
		r.matched = true
		f.Results[key] = r
		return r.Stdout, r.ExitCode, r.Err
	}
	// Fall back to single-arg key for backward compatibility
	if len(args) > 0 {
		shortKey := fmt.Sprintf("%s %s", name, args[0])
		if r, ok := f.Results[shortKey]; ok {
			r.matched = true
			f.Results[shortKey] = r
			return r.Stdout, r.ExitCode, r.Err
		}
	}
	return "", 0, nil
}

func (f *FakeExecRunner) RunWithEnvAndStdin(env map[string]string, stdin, name string, args ...string) (string, int, error) {
	out, code, err := f.RunWithEnv(env, name, args...)
	f.Calls[len(f.Calls)-1].Stdin = stdin
	return out, code, err
}

func (f *FakeExecRunner) RunWithStdin(stdin, name string, args ...string) (string, int, error) {
	f.Calls = append(f.Calls, FakeExecCall{Name: name, Args: args, Stdin: stdin})
	key := execKey(name, args)
	if r, ok := f.Results[key]; ok {
		r.matched = true
		f.Results[key] = r
		return r.Stdout, r.ExitCode, r.Err
	}
	if len(args) > 0 {
		shortKey := fmt.Sprintf("%s %s", name, args[0])
		if r, ok := f.Results[shortKey]; ok {
			r.matched = true
			f.Results[shortKey] = r
			return r.Stdout, r.ExitCode, r.Err
		}
	}
	return "", 0, nil
}

// FakeSystemdRunner records systemd operations.
// Set Err to simulate systemd failures in tests.
type FakeSystemdRunner struct {
	ActiveServices map[string]bool
	Properties     map[string]string
	Actions        []string
	Err            error // returned by mutating operations when non-nil
}

func (f *FakeSystemdRunner) IsActive(service string) (bool, error) {
	return f.ActiveServices[service], nil
}
func (f *FakeSystemdRunner) Start(service string) error {
	f.Actions = append(f.Actions, "start:"+service)
	if f.Err == nil {
		if f.ActiveServices == nil {
			f.ActiveServices = make(map[string]bool)
		}
		f.ActiveServices[service] = true
	}
	return f.Err
}
func (f *FakeSystemdRunner) Stop(service string) error {
	f.Actions = append(f.Actions, "stop:"+service)
	if f.Err == nil {
		delete(f.ActiveServices, service)
	}
	return f.Err
}
func (f *FakeSystemdRunner) Restart(service string) error {
	f.Actions = append(f.Actions, "restart:"+service)
	if f.Err == nil {
		if f.ActiveServices == nil {
			f.ActiveServices = make(map[string]bool)
		}
		f.ActiveServices[service] = true
	}
	return f.Err
}
func (f *FakeSystemdRunner) Enable(service string) error {
	f.Actions = append(f.Actions, "enable:"+service)
	return f.Err
}
func (f *FakeSystemdRunner) EnableNow(service string) error {
	f.Actions = append(f.Actions, "enable-now:"+service)
	if f.Err == nil {
		if f.ActiveServices == nil {
			f.ActiveServices = make(map[string]bool)
		}
		f.ActiveServices[service] = true
	}
	return f.Err
}
func (f *FakeSystemdRunner) Reload(service string) error {
	f.Actions = append(f.Actions, "reload:"+service)
	return f.Err
}
func (f *FakeSystemdRunner) ShowProperty(service, property string) (string, error) {
	key := service + ":" + property
	return f.Properties[key], nil
}

// FakeEnvManager stores env in memory.
type FakeEnvManager struct {
	Env  map[string]string
	Path string
}

func (f *FakeEnvManager) ReadEnv() (map[string]string, error) {
	if f.Env == nil {
		return map[string]string{}, nil
	}
	cp := make(map[string]string, len(f.Env))
	for k, v := range f.Env {
		cp[k] = v
	}
	return cp, nil
}
func (f *FakeEnvManager) WriteEnvKey(key, value string) error {
	if f.Env == nil {
		f.Env = make(map[string]string)
	}
	f.Env[key] = value
	return nil
}
func (f *FakeEnvManager) WriteEnvFile(entries map[string]string) error {
	f.Env = make(map[string]string, len(entries))
	for k, v := range entries {
		f.Env[k] = v
	}
	return nil
}
func (f *FakeEnvManager) GetEnvFilePath() string {
	if f.Path != "" {
		return f.Path
	}
	return "/etc/heimdall-server/backend.env"
}

// FakeFileSystem records file operations in memory.
type FakeFileSystem struct {
	Files map[string][]byte
	Dirs  map[string]bool
}

func NewFakeFileSystem() *FakeFileSystem {
	return &FakeFileSystem{
		Files: make(map[string][]byte),
		Dirs:  make(map[string]bool),
	}
}

func (f *FakeFileSystem) ReadFile(path string) ([]byte, error) {
	data, ok := f.Files[path]
	if !ok {
		return nil, os.ErrNotExist
	}
	return data, nil
}
func (f *FakeFileSystem) WriteFile(path string, data []byte, _ os.FileMode) error {
	f.Files[path] = data
	return nil
}
func (f *FakeFileSystem) Stat(path string) (os.FileInfo, error) {
	if data, ok := f.Files[path]; ok {
		return &fakeFileInfo{name: filepath.Base(path), size: int64(len(data))}, nil
	}
	if f.Dirs[path] {
		return &fakeFileInfo{name: filepath.Base(path), mode: os.ModeDir}, nil
	}
	return nil, os.ErrNotExist
}

// fakeFileInfo implements os.FileInfo with zero-value defaults.
type fakeFileInfo struct {
	name string
	size int64
	mode os.FileMode
}

func (fi *fakeFileInfo) Name() string       { return fi.name }
func (fi *fakeFileInfo) Size() int64        { return fi.size }
func (fi *fakeFileInfo) Mode() os.FileMode  { return 0640 | fi.mode }
func (fi *fakeFileInfo) ModTime() time.Time { return time.Time{} }
func (fi *fakeFileInfo) IsDir() bool        { return fi.mode.IsDir() }
func (fi *fakeFileInfo) Sys() interface{}   { return nil }
func (f *FakeFileSystem) CopyFile(src, dst string) error {
	data, ok := f.Files[src]
	if !ok {
		return os.ErrNotExist
	}
	f.Files[dst] = append([]byte(nil), data...)
	return nil
}
func (f *FakeFileSystem) MkdirAll(path string, _ os.FileMode) error {
	f.Dirs[path] = true
	return nil
}
func (f *FakeFileSystem) TempDir(prefix string) (string, error) {
	dir := "/tmp/" + prefix + "-fake"
	f.Dirs[dir] = true
	return dir, nil
}
func (f *FakeFileSystem) RemoveAll(path string) error {
	delete(f.Dirs, path)
	for k := range f.Files {
		if len(k) >= len(path) && k[:len(path)] == path {
			delete(f.Files, k)
		}
	}
	return nil
}
func (f *FakeFileSystem) Exists(path string) bool {
	_, ok := f.Files[path]
	if ok {
		return true
	}
	_, ok = f.Dirs[path]
	return ok
}

func (f *FakeFileSystem) FindFiles(root, namePattern string) ([]string, error) {
	var matches []string
	rootPrefix := root
	if !strings.HasSuffix(rootPrefix, "/") {
		rootPrefix += "/"
	}
	for p := range f.Files {
		if p != root && !strings.HasPrefix(p, rootPrefix) {
			continue
		}
		base := p
		if i := strings.LastIndex(p, "/"); i >= 0 {
			base = p[i+1:]
		}
		ok, err := filepath.Match(namePattern, base)
		if err != nil {
			return nil, err
		}
		if ok {
			matches = append(matches, p)
		}
	}
	return matches, nil
}

// FakePrompter returns preset answers for interactive prompts.
// If a prompt has no preset answer, the default value is returned.
// Set Err to simulate prompt errors (e.g., user cancel via Ctrl+C).
type FakePrompter struct {
	Inputs        map[string]string // prompt text → answer
	InputDefaults map[string]string // prompt text → displayed default
	Confirms      map[string]bool   // prompt text → answer
	Selects       map[string]int    // prompt text → selected index
	IsTTY         bool
	Err           error // returned by all methods when non-nil
}

func (f *FakePrompter) Input(prompt, defaultValue string) (string, error) {
	if f.Err != nil {
		return "", f.Err
	}
	if f.InputDefaults == nil {
		f.InputDefaults = make(map[string]string)
	}
	f.InputDefaults[prompt] = defaultValue
	if v, ok := f.Inputs[prompt]; ok {
		return v, nil
	}
	return defaultValue, nil
}

func (f *FakePrompter) Password(prompt string) (string, error) {
	if f.Err != nil {
		return "", f.Err
	}
	if v, ok := f.Inputs[prompt]; ok {
		return v, nil
	}
	return "", nil
}

func (f *FakePrompter) Confirm(prompt string, defaultValue bool) (bool, error) {
	if f.Err != nil {
		return false, f.Err
	}
	if v, ok := f.Confirms[prompt]; ok {
		return v, nil
	}
	return defaultValue, nil
}

func (f *FakePrompter) Select(prompt string, defaultValue string, options []string) (int, error) {
	if f.Err != nil {
		return 0, f.Err
	}
	if v, ok := f.Selects[prompt]; ok {
		return v, nil
	}
	for i, option := range options {
		if option == defaultValue {
			return i, nil
		}
	}
	return 0, nil
}

func (f *FakePrompter) CanPrompt() bool {
	return f.IsTTY
}

// FakeTerminalDetector returns a preset TTY state.
type FakeTerminalDetector struct {
	TTY bool
}

func (f *FakeTerminalDetector) IsTerminal() bool {
	return f.TTY
}

// FakePasswordHasher implements PasswordHasher for tests.
type FakePasswordHasher struct {
	HashResult string
	HashErr    error
}

func (f *FakePasswordHasher) Hash(password string) (string, error) {
	if f.HashErr != nil {
		return "", f.HashErr
	}
	if f.HashResult != "" {
		return f.HashResult, nil
	}
	return "$2a$14$fakehash_" + password, nil
}

func (f *FakePasswordHasher) Verify(password, hash string) (bool, error) {
	return hash == "$2a$14$fakehash_"+password, nil
}

// FakeDBConnector simulates database connectivity for tests.
type FakeDBConnector struct {
	ConnErr  error
	Tables   int
	TableErr error
}

func (f *FakeDBConnector) TestConnection(host string, port int, user, password, dbName string) error {
	return f.ConnErr
}

func (f *FakeDBConnector) TableCount(host string, port int, user, password, dbName string) (int, error) {
	return f.Tables, f.TableErr
}

func (f *FakeFileSystem) EvalSymlinks(path string) (string, error) { return path, nil }
func (f *FakeFileSystem) Lstat(path string) (os.FileInfo, error)   { return f.Stat(path) }
func (f *FakeFileSystem) ReadDir(path string) ([]os.DirEntry, error) {
	var entries []os.DirEntry
	for name := range f.Files {
		if filepath.Dir(name) == path {
			info, _ := f.Stat(name)
			entries = append(entries, fakeDirEntry{info})
		}
	}
	for name := range f.Dirs {
		if filepath.Dir(name) == path {
			entries = append(entries, fakeDirEntry{&fakeFileInfo{name: filepath.Base(name), mode: os.ModeDir}})
		}
	}
	return entries, nil
}

type fakeDirEntry struct{ os.FileInfo }

func (d fakeDirEntry) Type() os.FileMode          { return d.Mode().Type() }
func (d fakeDirEntry) Info() (os.FileInfo, error) { return d.FileInfo, nil }
func (f *FakeFileSystem) Rename(old, renamed string) error {
	data, err := f.ReadFile(old)
	if err != nil {
		return err
	}
	f.Files[renamed] = data
	delete(f.Files, old)
	return nil
}
