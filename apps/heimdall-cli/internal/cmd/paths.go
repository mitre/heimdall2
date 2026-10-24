package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

// registerPathDefaults sets Viper defaults for all configurable paths.
// These are the lowest priority — overridden by config file, env vars, or flags.
func registerPathDefaults(v *viper.Viper) {
	v.SetDefault("app-dir", AppDir)
	v.SetDefault("data-dir", DataDir)
	v.SetDefault("libexec-dir", LibExecDir)
	v.SetDefault("config-dir", ConfigDir)
	v.SetDefault("cert-dir", CertDir)
	v.SetDefault("log-dir", LogDir)
	v.SetDefault("env-file", EnvFile)
}

// NewPathsFromViper resolves all paths from a Viper instance.
// Uses the priority chain: CLI flag > env var > config file > compile-time default.
func NewPathsFromViper(v *viper.Viper) Paths {
	return Paths{
		AppDir:     v.GetString("app-dir"),
		DataDir:    v.GetString("data-dir"),
		LibExecDir: v.GetString("libexec-dir"),
		ConfigDir:  v.GetString("config-dir"),
		CertDir:    v.GetString("cert-dir"),
		LogDir:     v.GetString("log-dir"),
		EnvFile:    v.GetString("env-file"),
	}
}

// RuntimePath only accepts code-owned segments beneath the private RPM runtime.
func (p Paths) RuntimePath(parts ...string) string {
	return filepath.Join(append([]string{p.LibExecDir, "runtime"}, parts...)...)
}

type pathsContextKey struct{}

func commandPaths(cmd *cobra.Command) Paths {
	if paths, ok := cmd.Context().Value(pathsContextKey{}).(Paths); ok {
		return paths
	}
	return DefaultPaths()
}

func (p Paths) hasRuntime(fs FileSystem) (bool, error) {
	if fs == nil {
		fs = &osFileSystem{}
	}
	app := p.AppDir
	if app == "" {
		app = AppDir
	}
	_, err := fs.Stat(filepath.Join(app, "runtime-manifest.json"))
	if os.IsNotExist(err) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("reading runtime manifest: %w", err)
	}
	return true, nil
}

func postgresClient(paths Paths, fs FileSystem, tool string) (string, error) {
	bundled, err := paths.hasRuntime(fs)
	if err != nil {
		return "", err
	}
	if !bundled {
		return tool, nil
	}
	if paths.LibExecDir == "" {
		paths.LibExecDir = LibExecDir
	}
	binary := paths.RuntimePath("postgresql", "bin", tool)
	if fs == nil {
		fs = &osFileSystem{}
	}
	info, err := fs.Stat(binary)
	if err != nil || info.IsDir() {
		return "", fmt.Errorf("RPM runtime client %s is missing or unreadable; reinstall the heimdall-server RPM", binary)
	}
	return binary, nil
}

func configureDBConnector(db DBConnector, paths Paths, fs FileSystem, cfg DBConfig) error {
	binary, err := postgresClient(paths, fs, "psql")
	if err != nil {
		return err
	}
	if connector, ok := db.(*psqlConnector); ok {
		connector.Binary = binary
		connector.Env = cfg.PgEnv()
	}
	return nil
}
