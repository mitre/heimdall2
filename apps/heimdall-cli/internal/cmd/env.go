package cmd

import (
	"errors"
	"fmt"
	"os"
	"regexp"
	"sort"
	"strings"
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
	for _, line := range strings.Split(content, "\n") {
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
	data, err := os.ReadFile(m.Path)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	encoded := make(map[string]string, len(entries))
	for key, value := range entries {
		if !envKeyPattern.MatchString(key) {
			return fmt.Errorf("invalid environment key %q", key)
		}
		encoded[key], err = encodeEnvValue(value)
		if err != nil {
			return err
		}
	}

	seen := make(map[string]bool)
	var lines []string
	if len(data) != 0 {
		lines = strings.Split(strings.TrimSuffix(string(data), "\n"), "\n")
	}
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
	return os.WriteFile(m.Path, []byte(content), 0640)
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
