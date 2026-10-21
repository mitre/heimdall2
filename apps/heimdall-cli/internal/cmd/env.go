package cmd

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"syscall"
)

var envKeyPattern = regexp.MustCompile("^[A-Za-z_][A-Za-z0-9_]*$")

// FileEnvManager implements EnvManager backed by a real file.
type FileEnvManager struct {
	Path string
}

// NewFileEnvManager returns an EnvManager backed by the compile-time default
// env file path. Runners that need a custom path should set it via Paths.EnvFile.
func NewFileEnvManager() *FileEnvManager {
	return &FileEnvManager{Path: EnvFile}
}

func (m *FileEnvManager) GetEnvFilePath() string { return m.Path }

// ReadEnv parses KEY=VALUE and KEY="VALUE" lines, skipping comments and blanks.
// Always returns a non-nil map, even on error, so callers can safely access
// keys without nil checks. The error is still returned for callers that care.
func (m *FileEnvManager) ReadEnv() (map[string]string, error) {
	data, err := os.ReadFile(m.Path)
	if err != nil {
		return map[string]string{}, err
	}
	return ParseEnv(string(data)), nil
}

// ParseEnv parses env file content into a map.
func ParseEnv(content string) map[string]string {
	env := make(map[string]string)
	for _, line := range envLines(strings.ReplaceAll(content, "\r\n", "\n")) {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		idx := strings.Index(line, "=")
		if idx < 0 {
			continue
		}
		key := strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(line[:idx]), "export "))
		val := strings.TrimSpace(line[idx+1:])
		val = decodeEnvValue(val)
		env[key] = val
	}
	return env
}

// WriteEnvKey updates or appends a key in the env file, preserving comments and order.
func (m *FileEnvManager) WriteEnvKey(key, value string) error {
	return m.WriteEnvFile(map[string]string{key: value})
}

// WriteEnvFile updates supplied keys while preserving unrelated text and unchanged
// assignments. New keys are appended in sorted order.
func (m *FileEnvManager) WriteEnvFile(entries map[string]string) error {
	path := m.Path
	info, err := os.Lstat(path)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	if info != nil && info.Mode()&os.ModeSymlink != 0 {
		path, err = filepath.EvalSymlinks(path)
		if err != nil {
			return err
		}
		info, err = os.Stat(path)
		if err != nil {
			return err
		}
	}
	if info != nil && !info.Mode().IsRegular() {
		return fmt.Errorf("environment file must be a regular file: %s", path)
	}
	data, err := os.ReadFile(path)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	content, err := updateEnvContent(data, entries)
	if err != nil {
		return err
	}
	// Keep the previous secrets intact until the complete replacement is durable.
	file, err := os.CreateTemp(filepath.Dir(path), ".backend.env-*")
	if err != nil {
		return err
	}
	defer os.Remove(file.Name())
	defer file.Close()
	if _, err := file.WriteString(content); err != nil {
		return err
	}
	mode := os.FileMode(0640)
	if info != nil {
		mode = info.Mode().Perm()
		stat := info.Sys().(*syscall.Stat_t)
		if err := file.Chown(int(stat.Uid), int(stat.Gid)); err != nil {
			return err
		}
	}
	if err := file.Chmod(mode); err != nil {
		return err
	}
	if err := file.Sync(); err != nil {
		return err
	}
	if err := file.Close(); err != nil {
		return err
	}
	dir, err := os.Open(filepath.Dir(path))
	if err != nil {
		return err
	}
	defer dir.Close()
	if err := os.Rename(file.Name(), path); err != nil {
		return err
	}
	return dir.Sync()
}

func updateEnvContent(data []byte, entries map[string]string) (string, error) {
	encoded := make(map[string]string, len(entries))
	for key, value := range entries {
		if !envKeyPattern.MatchString(key) {
			return "", fmt.Errorf("invalid environment key %q", key)
		}
		var err error
		encoded[key], err = encodeEnvValue(value)
		if err != nil {
			return "", err
		}
	}

	seen := make(map[string]bool)
	var lines []string
	if len(data) != 0 {
		lines = envLines(strings.TrimSuffix(string(data), "\n"))
	}
	updateEnvLines(lines, entries, encoded, seen)
	var missing []string
	for key := range entries {
		if !seen[key] {
			missing = append(missing, key)
		}
	}
	sort.Strings(missing)
	for _, key := range missing {
		lines = append(lines, key+"="+encoded[key])
	}
	content := strings.Join(lines, "\n")
	if len(missing) != 0 || strings.HasSuffix(string(data), "\n") {
		content += "\n"
	}
	return content, nil
}

// MaskSecret masks a secret value for display: first 3 + *** + last 3.
func MaskSecret(val string) string {
	if val == "" {
		return "(empty)"
	}
	if len(val) <= 6 {
		return "***"
	}
	return val[:3] + "***" + val[len(val)-3:]
}

func updateEnvLines(lines []string, entries, encoded map[string]string, seen map[string]bool) {
	for i, line := range lines {
		for key, previous := range ParseEnv(line) {
			value, updating := entries[key]
			if !updating {
				continue
			}
			seen[key] = true
			if value != previous {
				lines[i] = key + "=" + encoded[key]
			}
		}
	}
}
