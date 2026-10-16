package cmd

import (
	"bytes"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestConfigList_ShowsCategoriesAndKeys(t *testing.T) {
	r := &ConfigRunner{
		Env:    &FakeEnvManager{},
		Out:    new(bytes.Buffer),
		ErrOut: new(bytes.Buffer),
	}
	err := r.List()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	out := r.Out.(*bytes.Buffer).String()

	// Should contain category headers
	if !strings.Contains(out, "Core") {
		t.Error("expected Core category header")
	}
	if !strings.Contains(out, "Database") {
		t.Error("expected Database category header")
	}
	// Should contain keys
	if !strings.Contains(out, "PORT") {
		t.Error("expected PORT key in output")
	}
	if !strings.Contains(out, "DATABASE_HOST") {
		t.Error("expected DATABASE_HOST key in output")
	}
}

func TestConfigGet_ReturnsValue(t *testing.T) {
	r := &ConfigRunner{
		Env: &FakeEnvManager{Env: map[string]string{
			"PORT": "8080",
		}},
		Out:    new(bytes.Buffer),
		ErrOut: new(bytes.Buffer),
	}
	err := r.Get("PORT")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	out := r.Out.(*bytes.Buffer).String()
	if !strings.Contains(out, "PORT=8080") {
		t.Errorf("expected PORT=8080, got: %s", out)
	}
}

func TestConfigGet_NonexistentKey_ReturnsError(t *testing.T) {
	r := &ConfigRunner{
		Env:    &FakeEnvManager{Env: map[string]string{}},
		Out:    new(bytes.Buffer),
		ErrOut: new(bytes.Buffer),
	}
	err := r.Get("NONEXISTENT")
	if err == nil {
		t.Fatal("expected error for nonexistent key")
	}
	if !strings.Contains(err.Error(), "key not found") {
		t.Errorf("expected 'key not found' error, got: %v", err)
	}
}

func TestConfigGet_MasksSecretValue(t *testing.T) {
	r := &ConfigRunner{
		Env: &FakeEnvManager{Env: map[string]string{
			"DATABASE_PASSWORD": "supersecretpassword",
		}},
		Out:    new(bytes.Buffer),
		ErrOut: new(bytes.Buffer),
	}
	err := r.Get("DATABASE_PASSWORD")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	out := r.Out.(*bytes.Buffer).String()
	if strings.Contains(out, "supersecretpassword") {
		t.Error("secret value should be masked")
	}
	if !strings.Contains(out, "sup***ord") {
		t.Errorf("expected masked value sup***ord, got: %s", out)
	}
}

func TestConfigSet_UpdatesEnvFile(t *testing.T) {
	env := &FakeEnvManager{Env: map[string]string{}}
	r := &ConfigRunner{
		Env:    env,
		Out:    new(bytes.Buffer),
		ErrOut: new(bytes.Buffer),
	}
	port, _, _, _, _ := newSetPortRunner()
	r.Port = port
	err := r.Set("PORT", "8080")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.Env["PORT"] != "8080" {
		t.Errorf("expected PORT=8080, got: %s", env.Env["PORT"])
	}
	out := r.Out.(*bytes.Buffer).String()
	if !strings.Contains(out, "PORT=8080") {
		t.Errorf("expected confirmation message, got: %s", out)
	}
	if !strings.Contains(out, "Restarting service") {
		t.Errorf("expected applied port change, got: %s", out)
	}
}

func TestConfigSet_ValidationError_Int(t *testing.T) {
	r := &ConfigRunner{
		Env:    &FakeEnvManager{Env: map[string]string{}},
		Out:    new(bytes.Buffer),
		ErrOut: new(bytes.Buffer),
	}
	err := r.Set("PORT", "notanumber")
	if err == nil {
		t.Fatal("expected validation error")
	}
	if !strings.Contains(err.Error(), "must be an integer") {
		t.Errorf("expected integer validation error, got: %v", err)
	}
}

func TestConfigSet_ValidationError_IntRange(t *testing.T) {
	r := &ConfigRunner{
		Env:    &FakeEnvManager{Env: map[string]string{}},
		Out:    new(bytes.Buffer),
		ErrOut: new(bytes.Buffer),
	}
	err := r.Set("PORT", "99999")
	if err == nil {
		t.Fatal("expected validation error for out-of-range port")
	}
	if !strings.Contains(err.Error(), "1024-65535") {
		t.Errorf("expected range error, got: %v", err)
	}
}

func TestConfigSet_ValidationError_Bool(t *testing.T) {
	r := &ConfigRunner{
		Env:    &FakeEnvManager{Env: map[string]string{}},
		Out:    new(bytes.Buffer),
		ErrOut: new(bytes.Buffer),
	}
	err := r.Set("DATABASE_SSL", "maybe")
	if err == nil {
		t.Fatal("expected validation error for invalid bool")
	}
	if !strings.Contains(err.Error(), "must be true or false") {
		t.Errorf("expected bool validation error, got: %v", err)
	}
}

func TestConfigSet_ValidationError_Choices(t *testing.T) {
	r := &ConfigRunner{
		Env:    &FakeEnvManager{Env: map[string]string{}},
		Out:    new(bytes.Buffer),
		ErrOut: new(bytes.Buffer),
	}
	err := r.Set("NODE_ENV", "staging")
	if err == nil {
		t.Fatal("expected validation error for invalid choice")
	}
	if !strings.Contains(err.Error(), "must be one of") {
		t.Errorf("expected choices error, got: %v", err)
	}
}

func TestConfigSet_MasksSecretInConfirmation(t *testing.T) {
	r := &ConfigRunner{
		Env:    &FakeEnvManager{Env: map[string]string{}},
		Out:    new(bytes.Buffer),
		ErrOut: new(bytes.Buffer),
	}
	err := r.Set("DATABASE_PASSWORD", "mysupersecretpw")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	out := r.Out.(*bytes.Buffer).String()
	if strings.Contains(out, "mysupersecretpw") {
		t.Error("secret should be masked in confirmation")
	}
}

func TestConfigGet_ShowsSchemaDescription(t *testing.T) {
	r := &ConfigRunner{
		Env: &FakeEnvManager{Env: map[string]string{
			"PORT": "3000",
		}},
		Out:    new(bytes.Buffer),
		ErrOut: new(bytes.Buffer),
	}
	err := r.Get("PORT")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	out := r.Out.(*bytes.Buffer).String()
	if !strings.Contains(out, "HTTP listen port") {
		t.Errorf("expected schema description, got: %s", out)
	}
}

func TestConfigGet_SecretIsMasked(t *testing.T) {
	r := &ConfigRunner{
		Env: &FakeEnvManager{Env: map[string]string{"DATABASE_PASSWORD": "supersecretvalue"}},
		Out: new(bytes.Buffer),
	}
	err := r.Get("DATABASE_PASSWORD")
	assert.NoError(t, err)
	out := r.Out.(*bytes.Buffer).String()
	// MaskSecret("supersecretvalue") → "sup***lue" (first 3 + *** + last 3)
	assert.Contains(t, out, "sup***lue")
	assert.NotContains(t, out, "supersecretvalue")
}

func TestConfigSet_RootCheckFails(t *testing.T) {
	r := &ConfigRunner{
		Env:       &FakeEnvManager{Env: map[string]string{}},
		Out:       new(bytes.Buffer),
		ErrOut:    new(bytes.Buffer),
		CheckRoot: func() error { return errors.New("not root") },
	}
	err := r.Set("PORT", "8080")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not root")
}

func TestConfigGet_KeyNotInEnv_ButInSchema(t *testing.T) {
	r := &ConfigRunner{
		Env:    &FakeEnvManager{Env: map[string]string{}},
		Out:    new(bytes.Buffer),
		ErrOut: new(bytes.Buffer),
	}
	err := r.Get("PORT")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "key not found")
	errOut := r.ErrOut.(*bytes.Buffer).String()
	assert.Contains(t, errOut, "Description")
}

func TestConfigSetRejectsDeploymentChanges(t *testing.T) {
	for _, key := range []string{"HEIMDALL_DATABASE_MODE", "HEIMDALL_PROXY_MODE", "HEIMDALL_TLS_MODE", "HEIMDALL_TLS_CERT", "HEIMDALL_TLS_KEY", "HEIMDALL_TLS_CERT_DAYS"} {
		env := &FakeEnvManager{Env: map[string]string{key: "keep"}}
		r := &ConfigRunner{Env: env, Out: new(bytes.Buffer), ErrOut: new(bytes.Buffer)}
		err := r.Set(key, "external")
		require.ErrorContains(t, err, "setup")
		require.Equal(t, "keep", env.Env[key])
	}
}

func TestConfigRootPathOverrides(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "backend.env")
	require.NoError(t, os.WriteFile(path, []byte("PORT=3210\n"), 0600))
	out, _, err := executeCommand(t, "--env-file", path, "config", "get", "PORT")
	require.NoError(t, err)
	require.Contains(t, out, "PORT=3210")
}
