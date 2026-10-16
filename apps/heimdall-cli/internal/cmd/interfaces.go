package cmd

import "os"

// ExecRunner runs external commands.
type ExecRunner interface {
	Run(name string, args ...string) (stdout string, exitCode int, err error)
	RunWithEnv(env map[string]string, name string, args ...string) (stdout string, exitCode int, err error)
	RunWithEnvAndStdin(env map[string]string, stdin, name string, args ...string) (stdout string, exitCode int, err error)
	// RunWithStdin runs the command with the given string piped to its stdin.
	// Used for tools (e.g. psql) that read multi-statement input from stdin.
	RunWithStdin(stdin string, name string, args ...string) (stdout string, exitCode int, err error)
}

// SystemdRunner manages systemd services.
type SystemdRunner interface {
	IsActive(service string) (bool, error)
	Start(service string) error
	Stop(service string) error
	Restart(service string) error
	Enable(service string) error
	EnableNow(service string) error
	Reload(service string) error
	ShowProperty(service, property string) (string, error)
}

// EnvManager reads and writes backend.env.
type EnvManager interface {
	ReadEnv() (map[string]string, error)
	WriteEnvKey(key, value string) error
	WriteEnvFile(entries map[string]string) error
	GetEnvFilePath() string
}

// FileSystem abstracts file I/O.
type FileSystem interface {
	ReadFile(path string) ([]byte, error)
	WriteFile(path string, data []byte, perm os.FileMode) error
	Stat(path string) (os.FileInfo, error)
	Lstat(path string) (os.FileInfo, error)
	EvalSymlinks(path string) (string, error)
	ReadDir(path string) ([]os.DirEntry, error)
	Rename(old, new string) error
	CopyFile(src, dst string) error
	MkdirAll(path string, perm os.FileMode) error
	TempDir(prefix string) (string, error)
	RemoveAll(path string) error
	Exists(path string) bool
	// FindFiles walks root recursively and returns paths whose base name
	// matches namePattern (filepath.Match syntax, e.g. "*.node"). Used
	// when we need to enumerate files of a kind, not list a directory.
	FindFiles(root, namePattern string) ([]string, error)
}

// PasswordHasher hashes passwords.
type PasswordHasher interface {
	Hash(password string) (string, error)
	Verify(password, hash string) (bool, error)
}

// DBConnector tests database connectivity.
type DBConnector interface {
	TestConnection(host string, port int, user, password, dbName string) error
	TableCount(host string, port int, user, password, dbName string) (int, error)
}

// Prompter handles interactive user input. Production uses charm/huh,
// tests inject FakePrompter with preset answers.
type Prompter interface {
	Input(prompt, defaultValue string) (string, error)
	Password(prompt string) (string, error)
	Confirm(prompt string, defaultValue bool) (bool, error)
	Select(prompt string, defaultValue string, options []string) (int, error)
	CanPrompt() bool
}

// TerminalDetector checks if stdin/stdout are interactive terminals.
type TerminalDetector interface {
	IsTerminal() bool
}
